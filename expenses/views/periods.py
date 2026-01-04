from typing import Any

from django.contrib import messages
from django.db.models.query import QuerySet
from django.shortcuts import redirect
from django.urls import reverse_lazy
from django.views.generic import ListView, edit
from rest_framework.views import APIView

from expenses.forms import PeriodForm
from expenses.models import Period, Transaction


class PeriodCreateView(edit.CreateView):
    model = Period
    form_class = PeriodForm
    template_name = "expenses/period_add.html"
    success_url = reverse_lazy("period-list")


class PeriodListView(ListView):
    model = Period
    template_name = "expenses/periods_list.html"
    context_object_name = "periods"

    def get_queryset(self) -> QuerySet[Any]:
        queryset = Period.objects.filter(active=True).order_by("-year", "-month")
        return queryset


class PeriodCloseView(APIView):
    def get(self, request, pk: int = None):
        try:
            period = Period.objects.get(pk=pk, closed=False)
            period.closed = True
            period.total = self._get_total(period)
            period.save()
        except Period.DoesNotExist:
            messages.error(request=request, message="Period is closed")
        return redirect("period-list")

    def _get_total(self, period: Period) -> float:
        expenses = Transaction.objects.filter(period=period)
        return sum(expense.local_amount for expense in expenses)


class PeriodOpenView(APIView):
    def get(self, request, pk: int = None):
        try:
            period = Period.objects.get(pk=pk, closed=True)
            period.closed = False
            period.total = 0
            period.save()
        except Period.DoesNotExist:
            messages.error(request=request, message="Period is already open or not exists")
        return redirect("period-list")
