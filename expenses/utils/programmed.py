from django.utils import timezone

from expenses.models import Period, ProgramTransaction, Transaction


def create_programmed_transactions(period: Period):
    programmed = ProgramTransaction.objects.filter(
        active=True, start_date__lte=timezone.now(), end_date__gte=timezone.now()
    )
    for program in programmed:
        transactions = Transaction.objects.filter(period=period, description__icontains=program.name)

        if not transactions.exists():
            Transaction.objects.create(
                period=period,
                account=program.account,
                description=program.name,
                amount=program.amount,
                currency=program.currency,
                payment_date=timezone.now(),
            )
