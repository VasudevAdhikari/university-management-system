from django.urls import path
from .views import faculty_dashboard

urlpatterns = [
    path('', faculty_dashboard, name='faculty_dashboard'),
    ]