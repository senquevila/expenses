import re

from django.conf import settings

from expenses.models import Account, AccountAssociation, Currency, Period, Transaction, Upload
from expenses.serializers import TransactionSerializer
from expenses.utils.identifier import make_transaction_identifier
from expenses.utils.tools import str_to_date

# Codes banks print inside the amount text that are not ISO alpha3
CURRENCY_ALIASES = {"L": "HNL", "LPS": "HNL", "$": "USD"}


def _fail(upload: Upload, error: str):
    upload.fails = [{"error": error}]
    upload.upload_status = Upload.UploadStatus.FAILED
    upload.save(update_fields=["fails", "upload_status"])


def process_upload_result(upload: Upload):
    upload.upload_status = Upload.UploadStatus.PROCESSING
    upload.save(update_fields=["upload_status"])

    rows = upload.result
    if not rows:
        _fail(upload, "No result data to process")
        return

    upload_type = upload.upload_type
    if not upload_type:
        _fail(upload, "upload_type is not set")
        return

    defaults = _get_defaults()
    associations = list(AccountAssociation.objects.only("token", "account").select_related("account"))
    fails = []
    created = 0

    for row in rows:
        row_number = row.get("row_number")
        description = row.get("description", "")

        try:
            payment_date = str_to_date(row.get("date", ""))
        except ValueError as e:
            fails.append({"row_number": row_number, "description": description, "reason": str(e)})
            continue

        period = Period.get_period_from_date(payment_date)
        if not period or period.closed:
            fails.append({"row_number": row_number, "description": description, "reason": "Period not found or closed"})
            continue

        amount, currency, is_income = _parse_row(row, defaults["currency"])

        if not amount:
            fails.append({"row_number": row_number, "description": description, "reason": "Amount is zero or invalid"})
            continue

        identifier = make_transaction_identifier(payment_date, description, amount, currency.alpha3)
        if Transaction.objects.filter(identifier=identifier).exists():
            fails.append({"row_number": row_number, "description": description, "reason": "Duplicate transaction"})
            continue

        account = defaults["income_account"] if is_income else defaults["expense_account"]
        for assoc in associations:
            if assoc.token.lower() in description.lower():
                account = assoc.account
                break

        serializer = TransactionSerializer(
            data={
                "payment_date": payment_date,
                "description": description,
                "period": period.pk,
                "account": account.pk,
                "currency": currency.pk,
                "amount": abs(amount),
                "upload": upload.pk,
                "identifier": identifier,
            }
        )
        if serializer.is_valid():
            serializer.save()
            created += 1
        else:
            fails.append({"row_number": row_number, "description": description, "reason": str(serializer.errors)})

    _update_fields = []
    if fails:
        upload.fails = fails
        _update_fields.append("fails")

    upload.upload_status = Upload.UploadStatus.DONE
    _update_fields.append("upload_status")
    upload.save(update_fields=_update_fields)
    _update_interval_dates(upload, rows)


def _get_defaults() -> dict:
    default_currency = Currency.objects.filter(alpha3=settings.DEFAULT_CURRENCY).first()
    if not default_currency:
        raise ValueError("Default currency not configured")
    expense_account = Account.objects.filter(name=settings.DEFAULT_EXPENSE_ACCOUNT).first()
    if not expense_account:
        raise ValueError("Default expense account not configured")
    income_account = Account.objects.filter(name=settings.DEFAULT_INCOME_ACCOUNT).first()
    if not income_account:
        raise ValueError("Default income account not configured")
    return {
        "currency": default_currency,
        "expense_account": expense_account,
        "income_account": income_account,
    }


def _parse_amount_field(field: dict, default_currency: Currency) -> tuple[float | None, Currency | None]:
    raw = field.get("amount", "")
    if not raw:
        return None, None

    cleaned = str(raw).strip()
    cleaned = re.sub(r"\s+", "", cleaned)
    sign = ""
    if cleaned.startswith("-"):
        sign = "-"
        cleaned = cleaned[1:]
    symbol = re.search(r"[A-Za-z$€£¥₡]+", cleaned)
    embedded = symbol.group().upper() if symbol else ""
    cleaned = re.sub(r"^[A-Za-z$€£¥₡]+", "", cleaned)
    cleaned = re.sub(r"[A-Za-z$€£¥₡]+$", "", cleaned)
    dot_pos = cleaned.rfind(".")
    comma_pos = cleaned.rfind(",")
    if dot_pos >= 0 and comma_pos > dot_pos:
        cleaned = cleaned.replace(".", "").replace(",", ".")
    else:
        cleaned = cleaned.replace(",", "")

    if not re.fullmatch(r"\d+(?:\.\d+)?", cleaned):
        return None, None

    try:
        amount = float(sign + cleaned)
    except (ValueError, AttributeError):
        return None, None
    if not amount:
        return None, None
    code = field.get("currency") or CURRENCY_ALIASES.get(embedded, embedded)
    currency = Currency.objects.filter(alpha3=code).first() or default_currency
    return amount, currency


def _parse_row(row: dict, default_currency: Currency) -> tuple[float | None, Currency | None, bool]:
    """First non-empty amount wins. A credit column is income, a debit column an expense.

    When the row has both debit and credit columns the column decides alone (some banks print debits as negatives).
    Otherwise a negative amount flips it, e.g. a card payment in a debit column is income.
    """
    amounts = row.get("amounts", [])
    has_both_kinds = len({a.get("kind") for a in amounts}) > 1
    for field in amounts:
        amount, currency = _parse_amount_field(field, default_currency)
        if amount:
            is_income = field.get("kind") == "credit"
            if amount < 0 and not has_both_kinds:
                is_income = not is_income
            return abs(amount), currency, is_income
    return None, None, False


def _update_interval_dates(upload: Upload, rows: list[dict]):
    dates = []
    for row in rows:
        try:
            dates.append(str_to_date(row.get("date", "")))
        except ValueError:
            pass
    if dates:
        upload.start_date = min(dates)
        upload.end_date = max(dates)
        upload.save(update_fields=["start_date", "end_date"])
