import json
from django import template
from django.utils import timezone
from datetime import datetime, timedelta

register = template.Library()

@register.filter(name='json_loads')
def json_loads(value):
    """
    Custom template filter to load a JSON string into a Python object.
    Usage: {{ value|json_loads }}
    """
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return {}
    
@register.filter(name='get_noti_target')
def get_noti_target(noti):
    return 'comment' if noti.get('is_comment') else 'post'

@register.filter(name='get_noti_id')
def get_noti_id(noti):
    try:
        return noti.get('post')
    except (AttributeError, TypeError):
        return noti.get('comment')

@register.filter(name='time_since')
def time_since(value):
    """
    Custom template filter to display time since a given datetime.
    Usage: {{ datetime_value|time_since }}
    """
    if not value:
        return "Unknown time"

    try:
        # Handle string datetime values
        if isinstance(value, str):
            # Try to parse ISO format datetime string
            try:
                value = datetime.fromisoformat(value.replace('Z', '+00:00'))
            except ValueError:
                # Try other common formats
                try:
                    value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    return "Invalid date"

        # Make sure we have timezone-aware datetime
        if timezone.is_naive(value):
            value = timezone.make_aware(value)

        now = timezone.now()
        diff = now - value

        if diff.days > 0:
            if diff.days == 1:
                return "1 day ago"
            elif diff.days < 7:
                return f"{diff.days} days ago"
            elif diff.days < 30:
                weeks = diff.days // 7
                return f"{weeks} week{'s' if weeks > 1 else ''} ago"
            elif diff.days < 365:
                months = diff.days // 30
                return f"{months} month{'s' if months > 1 else ''} ago"
            else:
                years = diff.days // 365
                return f"{years} year{'s' if years > 1 else ''} ago"

        seconds = diff.seconds
        if seconds < 60:
            return "Just now"
        elif seconds < 3600:
            minutes = seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            hours = seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"

    except (ValueError, TypeError, AttributeError):
        return "Unknown time"