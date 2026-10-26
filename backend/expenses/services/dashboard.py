import calendar
from datetime import date, timedelta
from decimal import Decimal

from django.db.models import DecimalField, Q, Sum
from django.db.models.functions import Coalesce

from expenses.models import Account, Period, Transaction, Upload

TOP_CATEGORIES = 6
DISTRIBUTION_SIZE = 8
MIN_GAP_DAYS = 15
ZERO = Decimal(0)


def _account_totals(period: Period | None) -> list[dict]:
    if period is None:
        return []
    return list(
        Transaction.objects.filter(period=period)
        .valid()
        .values("account_id", "account__name", "account__sign", "account__account_type")
        .annotate(total=Coalesce(Sum("local_amount"), ZERO, output_field=DecimalField(max_digits=14, decimal_places=2)))
        .order_by("-total")
    )


def _split(rows: list[dict]) -> tuple[list[dict], Decimal, Decimal]:
    expenses = [r for r in rows if r["account__sign"] < 0]
    total_expenses = sum((abs(r["total"]) for r in expenses), ZERO)
    total_income = sum((abs(r["total"]) for r in rows if r["account__sign"] > 0), ZERO)
    return expenses, total_expenses, total_income


def _pct_change(current: Decimal, previous: Decimal) -> float | None:
    return float((current - previous) / previous * 100) if previous > 0 else None


def previous_period(period: Period) -> Period | None:
    return (
        Period.objects.filter(active=True)
        .filter(Q(year__lt=period.year) | Q(year=period.year, month__lt=period.month))
        .order_by("-year", "-month")
        .first()
    )


def period_dashboard(period: Period, today: date) -> dict:
    prev = previous_period(period)
    expenses, total_expenses, total_income = _split(_account_totals(period))
    _, prev_expenses, prev_income = _split(_account_totals(prev))
    net = total_income - total_expenses

    days_in_month = calendar.monthrange(period.year, period.month)[1]
    is_current = (today.year, today.month) == (period.year, period.month)
    days_elapsed = today.day if is_current else days_in_month

    categories = sorted(
        (
            {
                "name": r["account__name"],
                "amount": float(abs(r["total"])),
                "percentage": float(abs(r["total"]) / total_expenses * 100) if total_expenses else 0.0,
            }
            for r in expenses
        ),
        key=lambda c: c["amount"],
        reverse=True,
    )
    recurring = sum((abs(r["total"]) for r in expenses if r["account__account_type"] == Account.FIXED), ZERO)

    # ponytail: buckets by payment_date inside the period, using local_amount (single currency)
    month_tx = Transaction.objects.valid().filter(payment_date__year=period.year, payment_date__month=period.month)
    daily = {d: {"expenses": ZERO, "income": ZERO} for d in range(1, days_in_month + 1)}
    for payment_date, sign, amount in month_tx.values_list("payment_date", "account__sign", "local_amount"):
        key = "expenses" if sign < 0 else "income"
        daily[payment_date.day][key] += abs(amount)

    largest = (
        month_tx.filter(account__sign__lt=0)
        .select_related("account")
        .order_by("local_amount")  # most negative first
        .first()
    )

    return {
        "period": {"id": period.id, "year": period.year, "month": period.month},
        "prev_period": prev and {"id": prev.id, "year": prev.year, "month": prev.month},
        "total_expenses": float(total_expenses),
        "total_income": float(total_income),
        "net_balance": float(net),
        "savings_rate": float(net / total_income * 100) if total_income > 0 else 0.0,
        "prev_expenses": float(prev_expenses),
        "prev_income": float(prev_income),
        "mom_expenses": _pct_change(total_expenses, prev_expenses),
        "mom_income": _pct_change(total_income, prev_income),
        "daily_average": float(total_expenses / days_elapsed),
        "top_categories": categories[:TOP_CATEGORIES],
        "distribution": categories[:DISTRIBUTION_SIZE],
        "recurring_total": float(recurring),
        "one_off_total": float(total_expenses - recurring),
        "largest_expense": largest
        and {
            "amount": float(abs(largest.local_amount)),
            "description": largest.description,
            "account": largest.account.name,
            "payment_date": largest.payment_date,
        },
        "daily": [
            {"day": str(d), "expenses": float(v["expenses"]), "income": float(v["income"])} for d, v in daily.items()
        ],
    }


def upload_gaps(year: int, today: date) -> list[dict]:
    """Per identifier, gaps of MIN_GAP_DAYS+ between uploads that touch an open active period."""
    ranges_by_id: dict[str, list[tuple[date, date]]] = {}
    anonymous: list[tuple[date, date]] = []
    uploads = Upload.objects.filter(
        start_date__isnull=False, end_date__isnull=False, start_date__year__lte=year, end_date__year__gte=year
    ).values_list("identifier", "start_date", "end_date")
    for identifier, start, end in uploads:
        if identifier:
            ranges_by_id.setdefault(identifier, []).append((start, end))
        else:
            anonymous.append((start, end))

    open_periods = [
        (date(p.year, p.month, 1), date(p.year, p.month, calendar.monthrange(p.year, p.month)[1]))
        for p in Period.objects.filter(active=True, closed=False)
    ]

    result = []
    for identifier, ranges in ranges_by_id.items():
        merged: list[list[date]] = []
        for start, end in sorted(ranges + anonymous):
            if not merged or start > merged[-1][1]:
                merged.append([start, end])
            elif end > merged[-1][1]:
                merged[-1][1] = end

        gaps = []
        for (_, prev_end), (next_start, _) in zip(merged, merged[1:]):
            gap_start = prev_end + timedelta(days=1)
            days = (next_start - gap_start).days
            if days >= MIN_GAP_DAYS:
                gaps.append({"from": gap_start, "to": next_start, "days": days})
        last_end = merged[-1][1]
        if (today - last_end).days >= MIN_GAP_DAYS:
            gaps.append({"from": last_end + timedelta(days=1), "to": today, "days": (today - last_end).days})

        gaps = [g for g in gaps if any(g["from"] <= p_end and g["to"] >= p_start for p_start, p_end in open_periods)]
        if gaps:
            result.append({"identifier": identifier, "gaps": gaps})
    return result
