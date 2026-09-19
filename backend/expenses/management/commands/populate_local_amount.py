from django.core.management.base import BaseCommand

from expenses.models import Transaction


class Command(BaseCommand):
    help = "Populate the expenses' local amounts"

    def handle(self, *args, **options):
        for expense in Transaction.objects.exclude(local_amount=0, currency__alpha3="HND"):
            expense.local_amount = expense.get_local_amount
            expense.save()
            print(f"Updated expense {expense.id}")
        print("Done!")
        return 0
