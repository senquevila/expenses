from django import template

register = template.Library()


@register.filter
def difference(value, arg):
    try:
        return round(float(value) - float(arg), 2)
    except ValueError:
        return None


@register.filter
def round_to_n(value):
    try:
        return round(value, 1)
    except (ValueError, TypeError):
        return value
