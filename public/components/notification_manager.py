from django.shortcuts import render
from authorization.models import User, Notification
import json

def show_notifications(request, user_id):
    user = User.objects.filter(pk=user_id).first()
    notifications = Notification.objects.filter(
        user=user,
    )
    notification_data = []
    for notification in notifications:
        notification_data.append({
            "text": notification.notification.get("text"),
            "time": notification.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "seen": notification.seen,
            "destination": notification.notification.get("destination"),
        })
        notification.seen = True
        notification.save()
    data = {
        'notifications': json.dumps(notification_data),
    }
    return render(request, 'htmls/notifications.html', context=data)