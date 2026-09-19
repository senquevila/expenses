# Django Imports
from django.db import models
from django.utils.timezone import now as timezone_now
from django.utils.translation import gettext_lazy as _


class CreationModificationDateMixin(models.Model):
    """
    Clase abstracta para el manejo de fecha de creación y de última modicación en todos los datos
    que lleven esta clase.
    """

    created = models.DateTimeField(_("Fecha de Creación"), default=timezone_now, editable=False)
    modified = models.DateTimeField(_("Fecha de última modificación"), null=True, editable=False)

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        if not self.pk:
            self.created = timezone_now()
        else:
            if not self.created:
                self.created = timezone_now()
            self.modified = timezone_now()
        super().save(*args, **kwargs)

    save.alters_data = True
