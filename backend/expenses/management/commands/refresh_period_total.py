from django.core.management.base import BaseCommand
from django.db.models import Sum

from expenses.models import Period, Transaction


class Command(BaseCommand):
    help = "Recalculate the period total"

    def handle(self, *args, **options):
        for expense in Transaction.objects.values("period").annotate(total=Sum("local_amount")):
            period = Period.objects.get(pk=expense["period"])
            period.total = expense["total"]
            period.save()
            print(f"Update period {str(period)} with {expense['total']}")
        print("Done!")
        return 0
