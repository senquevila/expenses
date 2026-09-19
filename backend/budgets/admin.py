from django.contrib import admin

from budgets.models import Budget, BudgetAssignment


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ["user", "period", "total", "is_active"]


@admin.register(BudgetAssignment)
class BudgetAssignmentAdmin(admin.ModelAdmin):
    list_display = ["budget", "account", "budget_amount", "expense_amount"]
