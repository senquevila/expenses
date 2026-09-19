from django.urls import path

from budgets import views

urlpatterns = [
    path("", views.BudgetListView.as_view(), name="budget-list"),
    path("add/", views.BudgetCreateView.as_view(), name="budget-add"),
    path("<int:pk>/edit/", views.BudgetUpdateView.as_view(), name="budget-edit"),
    path(
        "<int:pk>/update-expenses/",
        views.BudgetUpdateExpensesView.as_view(),
        name="budget-update-expense",
    ),
    path(
        "<int:pk>/assignments/",
        views.BudgetAssigmentListView.as_view(),
        name="budget-assignment-list",
    ),
    path(
        "assignments/add/",
        views.BudgetAssignmentCreateView.as_view(),
        name="assignment-add",
    ),
    path(
        "assignments/<int:pk>/edit/",
        views.BudgetAssignmentUpdateView.as_view(),
        name="assignment-edit",
    ),
]
