from django.urls import path
from . import views
from public.components import notification_manager

urlpatterns = [
    path('', views.show_public_page, name='home'),

    path('notifications/<int:user_id>', notification_manager.show_notifications, name='show_notifications'),
] 