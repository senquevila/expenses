from django import forms

from budgets.models import Budget, BudgetAssignment


class BudgetForm(forms.ModelForm):
    class Meta:
        model = Budget
        fields = ["user", "period", "total"]


class BudgetAssignmentForm(forms.ModelForm):
    class Meta:
        model = BudgetAssignment
        fields = ["budget", "account", "budget_amount", "expense_amount"]
