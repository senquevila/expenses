from typing import Any

from django.db.models import ExpressionWrapper, F, FloatField, Sum
from django.shortcuts import get_object_or_404, redirect
from django.urls import reverse_lazy
from django.views.generic.edit import CreateView, UpdateView
from django.views.generic.list import ListView
from rest_framework.views import APIView

from budgets.forms import BudgetAssignmentForm, BudgetForm
from budgets.models import Budget, BudgetAssignment
from expenses.models import Transaction


class BudgetCreateView(CreateView):
    model = Budget
    form_class = BudgetForm
    template_name = "budgets/budget_form.html"
    success_url = reverse_lazy("budget-list")


class BudgetUpdateView(UpdateView):
    model = Budget
    form_class = BudgetForm
    template_name = "budgets/budget_form.html"
    success_url = reverse_lazy("budget-list")


class BudgetListView(ListView):
    model = Budget
    template_name = "budget_list.html"
    context_object_name = "budgets"


class BudgetAssignmentCreateView(CreateView):
    model = BudgetAssignment
    form_class = BudgetAssignmentForm
    template_name = "budgets/budget_assignment_form.html"
    success_url = reverse_lazy("budget-list")


class BudgetAssignmentUpdateView(UpdateView):
    model = BudgetAssignment
    form_class = BudgetAssignmentForm
    template_name = "budgets/budget_assignment_form.html"
    success_url = reverse_lazy("budget-list")


class BudgetUpdateExpensesView(APIView):
    def get(self, request, pk=None):
        budget = get_object_or_404(Budget, pk=pk)

        # Fetch expenses from the previous period
        expenses = Transaction.objects.filter(period=budget.period)
        BudgetAssignment.objects.filter(
            budget=budget,
        ).update(expense_amount=0)

        for expense in expenses:

            try:
                assignament = BudgetAssignment.objects.get(
                    budget=budget,
                    account=expense.account,
                )
                assignament.expense_amount += expense.local_amount
                assignament.save()
            except BudgetAssignment.DoesNotExist:
                print(expense.account)

        return redirect("budget-list")


class BudgetAssigmentListView(ListView):
    model = BudgetAssignment
    template_name = "budgets/budget_assignment_list.html"
    context_object_name = "budget_assignments"

    def get_queryset(self):
        budget = get_object_or_404(Budget, pk=self.kwargs["pk"])
        queryset = (
            BudgetAssignment.objects.filter(budget=budget)
            .annotate(
                difference=ExpressionWrapper(
                    (F("expense_amount") - F("budget_amount")) / F("budget_amount") * 100,
                    output_field=FloatField(),
                )
            )
            .order_by("expense_amount")
        )
        return queryset

    def get_context_data(self, **kwargs: Any) -> dict[str, Any]:
        context = super().get_context_data(**kwargs)
        budget = get_object_or_404(Budget, pk=self.kwargs["pk"])
        context["period"] = budget.period
        total = BudgetAssignment.objects.filter(budget__pk=self.kwargs["pk"]).aggregate(
            total_budget=Sum("budget_amount"),
            total_expense=Sum("expense_amount"),
        )
        context["total_budget"] = round(total.get("total_budget", 0), 2)
        context["total_expense"] = round(total.get("total_expense", 0), 2)
        return context
