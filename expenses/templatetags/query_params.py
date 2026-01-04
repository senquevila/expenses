from django import template

register = template.Library()


@register.simple_tag(takes_context=True)
def query_transform(context, **kwargs):
    request = context["request"]
    query_params = request.GET.copy()

    if "page" in query_params:
        query_params.pop("page")

    for key, value in kwargs.items():
        query_params[key] = value

    return query_params.urlencode()
