from django.core.exceptions import ValidationError
from django.test import TestCase

from expenses.models import Upload, UploadTemplate


class UploadTemplateCleanTest(TestCase):
    def make(self, upload_type, columns):
        return UploadTemplate(name="Bank", upload_type=upload_type, columns=columns)

    def test_valid_credit_card(self):
        cols = {
            "date": 1,
            "description": 2,
            "amounts": [{"col": 3, "kind": "debit", "currency": "HNL"}, {"col": 4, "kind": "debit", "currency": "USD"}],
        }
        self.make(Upload.UploadType.CREDIT_CARD, cols).clean()

    def test_valid_savings_with_currency_column(self):
        cols = {
            "date": 1,
            "description": 4,
            "currencyCol": 5,
            "amounts": [{"col": 6, "kind": "debit"}, {"col": 7, "kind": "credit"}],
        }
        self.make(Upload.UploadType.SAVINGS_ACCOUNT, cols).clean()

    def test_missing_amounts_fails(self):
        with self.assertRaises(ValidationError):
            self.make(Upload.UploadType.CREDIT_CARD, {"date": 1, "description": 2, "amounts": []}).clean()

    def test_currency_col_zero_means_absent(self):
        cols = {"date": 1, "description": 2, "currencyCol": 0, "amounts": [{"col": 3, "kind": "debit"}]}
        self.make(Upload.UploadType.SAVINGS_ACCOUNT, cols).clean()

    def test_currency_col_negative_fails(self):
        cols = {"date": 1, "description": 2, "currencyCol": -1, "amounts": [{"col": 3, "kind": "debit"}]}
        with self.assertRaises(ValidationError):
            self.make(Upload.UploadType.SAVINGS_ACCOUNT, cols).clean()

    def test_unknown_kind_fails(self):
        cols = {"date": 1, "description": 2, "amounts": [{"col": 3, "kind": "local"}]}
        with self.assertRaises(ValidationError):
            self.make(Upload.UploadType.CREDIT_CARD, cols).clean()

    def test_api_active_filter(self):
        UploadTemplate.objects.create(name="old", upload_type=Upload.UploadType.CREDIT_CARD, active=False)
        UploadTemplate.objects.create(name="new", upload_type=Upload.UploadType.CREDIT_CARD)
        names = [t["name"] for t in self.client.get("/api/expenses/upload_templates/?active=true").json()]
        self.assertEqual(names, ["new"])
        self.assertEqual(len(self.client.get("/api/expenses/upload_templates/").json()), 2)

    def test_api_rejects_invalid_columns(self):
        data = {"name": "Bank", "upload_type": "CREDIT_CARD", "columns": {"date": 1, "description": 2, "amounts": []}}
        response = self.client.post("/api/expenses/upload_templates/", data, content_type="application/json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("columns", response.json())

    def test_api_creates_valid_template(self):
        data = {
            "name": "Bank",
            "upload_type": "SAVINGS_ACCOUNT",
            "columns": {"date": 1, "description": 4, "currencyCol": 5, "amounts": [{"col": 6, "kind": "debit"}]},
        }
        response = self.client.post("/api/expenses/upload_templates/", data, content_type="application/json")
        self.assertEqual(response.status_code, 201)
