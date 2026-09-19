from django.conf import settings
from django.db import models
from django.utils.timezone import now


class Budget(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    period = models.ForeignKey("expenses.Period", on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("user", "period")
        verbose_name = "Presupuesto"
        verbose_name_plural = "Presupuestos"
        ordering = ["-period"]

    def __str__(self):
        return str(self.period)

    @property
    def is_active(self) -> bool:
        """Return True if the budget is currently active."""
        return self.period.year == now().year and self.period.month == now().month


class BudgetAssignment(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE)
    account = models.ForeignKey("expenses.Account", blank=True, null=True, on_delete=models.CASCADE)
    budget_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    expense_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        unique_together = ("budget", "account")
        verbose_name = "Asignacion de presupuesto"
        verbose_name_plural = "Asignaciones de presupuesto"
