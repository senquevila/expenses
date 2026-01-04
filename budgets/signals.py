from django.db.models.signals import post_save
from django.dispatch import receiver

from budgets.models import Budget, BudgetAssignment
from expenses.models import Period, Transaction


@receiver(post_save, sender=Budget)
def create_budget_from_expenses(sender, instance, created, **kwargs):
    if created:
        # Calculate the previous period
        year = instance.period.year
        month = instance.period.month

        previous_month = month - 1 if month > 1 else 12
        previous_year = year if month > 1 else year - 1

        try:
            previous_period = Period.objects.get(year=previous_year, month=previous_month)
        except Period.DoesNotExist:
            return

        # Fetch expenses from the previous period
        expenses = Transaction.objects.filter(period=previous_period)

        for expense in expenses:
            assignament, created = BudgetAssignment.objects.get_or_create(
                budget=instance,
                account=expense.account,
                defaults={
                    "budget_amount": 0,
                    "expense_amount": 0,
                },
            )

            assignament.budget_amount += expense.local_amount
            assignament.save()
