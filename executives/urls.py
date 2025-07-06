from django.urls import path
from . import views, lab_api
from executives.components import faculty_manager, department_manager, course_manager, degree_manager

app_name = 'executives'

urlpatterns = [
    # Dashboard and Home
    path('', views.executive_home, name='executive_home'),
    path('unapproved_students/', views.get_unapproved_students, name='unapproved_students'),
    path('approve_student/', views.approve_student, name='approve_student'),
    path('unapproved_instructors/', views.show_unapproved_instructors, name='unapproved_instructors'),
    path('uni_info/', views.show_uni_info, name='show_uni_info'),
    path('uni_info_edit/', views.uni_info_edit, name='uni_info_edit'),
    path('show_lab_details/<str:lab_name>', views.show_lab_details, name='show_lab_details'),
    path('show_degree_management', degree_manager.show_degree_management, name='show_degree_management'),
    path('show_course_management', course_manager.show_course_management, name='show_course_management'),
    path('course/add', course_manager.add_course, name='add_course'),
    path('course/edit/<str:course_id>', course_manager.edit_course, name='edit_course'),
    path('course/delete/<str:course_id>', course_manager.delete_course, name='delete_course'),
    # path('show_department_management', views.show_department_management, name='show_department_management'),
    path('show_faculty_management', faculty_manager.show_faculty_management, name='show_faculty_management'),

    # Degree API
    path('api/degree/add/', degree_manager.add_degree_api, name='add_degree_api'),

    # API Endpoints for Partnerships
    path('partnerships/add/', views.add_partnership_ajax, name='add_partnership_ajax'),
    path('partnerships/edit/', views.edit_partnership_ajax, name='edit_partnership_ajax'),
    path('partnerships/delete/', views.delete_partnership_ajax, name='delete_partnership_ajax'),

    # API Endpoints for Certificates
    path('certificates/add/', views.add_certificate_ajax, name='add_certificate_ajax'),
    path('certificates/edit/', views.edit_certificate_ajax, name='edit_certificate_ajax'),
    path('certificates/delete/', views.delete_certificate_ajax, name='delete_certificate_ajax'),

    # API Endpoints for University Photos
    path('photos/add/', views.add_photo_ajax, name='add_photo_ajax'),
    path('photos/edit/', views.edit_photo_ajax, name='edit_photo_ajax'),
    path('photos/delete/', views.delete_photo_ajax, name='delete_photo_ajax'),

    # API Endpoints for Labs
    path('labs/create/', views.add_lab_ajax, name='add_lab_ajax'),
    path('labs/delete/<str:lab_id>', views.delete_lab_ajax, name='delete_lab_ajax'),

    # API Endpoints for Lab Details
    path('labs/edit/<str:lab_name>', views.show_lab_details, name='show_lab_details'),

    # API Endpoints for Lab Details Editing
    path('api/labs/edit/<str:lab_key>/', lab_api.lab_edit_api, name='lab_edit_api'),
    path('api/labs/delete_photo/<str:lab_key>/', lab_api.lab_delete_photo_api, name='lab_delete_photo_api'),
    path('api/labs/edit_project/<str:lab_key>/<str:project_id>/', lab_api.lab_edit_project_api, name='lab_edit_project_api'),
    path('api/labs/add_photo/<str:lab_key>/', lab_api.lab_add_photo_api, name='lab_add_photo_api'),
    path('api/labs/add_project/<str:lab_id>/', lab_api.LabAddProjectAPI.as_view(), name='lab_add_project_api'),

    # API Endpoints for Faculty Management
    # path('api/faculty/list/', faculty_manager.faculty_list, name='faculty_list_api'),
    path('api/faculty/add/', faculty_manager.faculty_add, name='faculty_add_api'),
    path('api/faculty/edit/<int:faculty_id>/', faculty_manager.faculty_edit, name='faculty_edit_api'),
    path('api/faculty/delete/<int:faculty_id>/', faculty_manager.faculty_delete, name='faculty_delete_api'),

    # API Endpoints for Department Management
    path('show_department_management/', department_manager.show_department_management, name='show_department_management'),
    path('api/department/list/', department_manager.department_list, name='department_list_api'),
    path('api/department/add/', department_manager.department_add, name='department_add_api'),
    path('api/department/edit/<int:department_id>/', department_manager.department_edit, name='department_edit_api'),
    path('api/department/delete/<int:department_id>/', department_manager.department_delete, name='department_delete_api'),
]
