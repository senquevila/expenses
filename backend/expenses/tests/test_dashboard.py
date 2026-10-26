from datetime import date
from decimal import Decimal

from django.test import TestCase
from django.urls import reverse

from expenses.models import Account, Currency, Period, Transaction, Upload
from expenses.services.dashboard import period_dashboard, upload_gaps


class TestPeriodDashboard(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.currency = Currency.objects.create(alpha3="HNL", name="Lempira")
        cls.rent = Account.objects.create(name="Rent", sign=Account.DEBE, account_type=Account.FIXED)
        cls.food = Account.objects.create(name="Food", sign=Account.DEBE)
        cls.salary = Account.objects.create(name="Salary", sign=Account.HABER)
        cls.prev = Period.objects.create(month=1, year=2026)
        cls.period = Period.objects.create(month=2, year=2026)

    def _tx(self, period, account, amount, day):
        Transaction.objects.create(
            period=period,
            account=account,
            currency=self.currency,
            amount=Decimal(amount),
            payment_date=date(period.year, period.month, day),
        )

    def test_metrics(self):
        self._tx(self.prev, self.food, "200", 3)
        self._tx(self.period, self.rent, "300", 1)
        self._tx(self.period, self.food, "100", 1)
        self._tx(self.period, self.salary, "1000", 10)

        data = period_dashboard(self.period, date(2026, 3, 5))

        self.assertEqual(data["prev_period"]["id"], self.prev.id)
        self.assertEqual(data["total_expenses"], 400)
        self.assertEqual(data["total_income"], 1000)
        self.assertEqual(data["savings_rate"], 60)
        self.assertEqual(data["mom_expenses"], 100)
        self.assertIsNone(data["mom_income"])
        self.assertEqual(data["daily_average"], 400 / 28)
        self.assertEqual(data["recurring_total"], 300)
        self.assertEqual(data["one_off_total"], 100)
        self.assertEqual([c["name"] for c in data["top_categories"]], ["Rent", "Food"])
        self.assertEqual(data["largest_expense"]["account"], "Rent")
        self.assertEqual(len(data["daily"]), 28)
        self.assertEqual(data["daily"][0], {"day": "1", "expenses": 400, "income": 0})
        self.assertEqual(data["daily"][9]["income"], 1000)

    def test_endpoint(self):
        response = self.client.get(reverse("api-periods-dashboard", kwargs={"pk": self.period.pk}))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json()["largest_expense"])


class TestUploadGaps(TestCase):
    def test_gaps_only_in_open_periods(self):
        Period.objects.create(month=1, year=2026)
        Period.objects.create(month=3, year=2026, closed=True)
        Upload.objects.create(identifier="card", start_date=date(2026, 1, 1), end_date=date(2026, 1, 5))
        Upload.objects.create(identifier="card", start_date=date(2026, 2, 1), end_date=date(2026, 2, 28))
        Upload.objects.create(identifier="card", start_date=date(2026, 3, 20), end_date=date(2026, 3, 31))

        result = upload_gaps(2026, date(2026, 4, 2), include_current_month=True)

        # Jan gap kept; Mar gap dropped (closed period); trailing 2-day gap too short
        gap = {"from": date(2026, 1, 6), "to": date(2026, 1, 31), "days": 26}
        self.assertEqual(result, [{"identifier": "card", "gaps": [gap]}])

    def test_without_current_month_gaps_are_cut_at_previous_month_end(self):
        Period.objects.create(month=3, year=2026, closed=True)
        Period.objects.create(month=4, year=2026)
        Upload.objects.create(identifier="card", start_date=date(2026, 3, 1), end_date=date(2026, 3, 31))
        Upload.objects.create(identifier="cash", start_date=date(2026, 3, 1), end_date=date(2026, 3, 10))
        Upload.objects.create(identifier="short", start_date=date(2026, 3, 1), end_date=date(2026, 3, 20))

        # card: no gap before April; cash: cut at Mar 31 even though March is closed; short: 11 days < 15
        gap = {"from": date(2026, 3, 11), "to": date(2026, 3, 31), "days": 21}
        self.assertEqual(upload_gaps(2026, date(2026, 4, 25)), [{"identifier": "cash", "gaps": [gap]}])

    def test_current_month_included_on_request(self):
        Period.objects.create(month=4, year=2026)
        Upload.objects.create(identifier="card", start_date=date(2026, 3, 1), end_date=date(2026, 3, 31))

        gap = {"from": date(2026, 4, 1), "to": date(2026, 4, 25), "days": 25}
        self.assertEqual(upload_gaps(2026, date(2026, 4, 25), True), [{"identifier": "card", "gaps": [gap]}])

    def test_savings_account_upload_covers_whole_month(self):
        savings = Upload.UploadType.SAVINGS_ACCOUNT
        Upload.objects.create(
            identifier="savings", upload_type=savings, start_date=date(2026, 1, 30), end_date=date(2026, 1, 30)
        )
        Upload.objects.create(
            identifier="savings", upload_type=savings, start_date=date(2026, 2, 27), end_date=date(2026, 2, 27)
        )

        self.assertEqual(upload_gaps(2026, date(2026, 3, 10)), [])

    def test_savings_upload_of_a_credit_card_identifier_is_not_expanded(self):
        Upload.objects.create(
            identifier="card",
            upload_type=Upload.UploadType.CREDIT_CARD,
            start_date=date(2026, 1, 1),
            end_date=date(2026, 1, 31),
        )
        Upload.objects.create(
            identifier="card",
            upload_type=Upload.UploadType.SAVINGS_ACCOUNT,
            start_date=date(2026, 2, 20),
            end_date=date(2026, 2, 28),
        )

        gap = {"from": date(2026, 2, 1), "to": date(2026, 2, 19), "days": 19}
        self.assertEqual(upload_gaps(2026, date(2026, 3, 10)), [{"identifier": "card", "gaps": [gap]}])
