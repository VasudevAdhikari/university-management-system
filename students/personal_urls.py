from django.urls import path
from students.components import sis_manager

urlpatterns = [
    path('sis_form/', sis_manager.show_sis_form, name='show_sis_form'),
    path('save_sis_form/', sis_manager.save_sis_form, name='save_sis_form'),
]