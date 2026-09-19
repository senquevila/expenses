from django.db.models.signals import post_save
from django.dispatch import receiver

from expenses.models import Period
from expenses.utils.programmed import create_programmed_transactions


@receiver(post_save, sender=Period)
def user_post_save(sender, instance, created, **kwargs):
    if created:
        create_programmed_transactions(instance)
