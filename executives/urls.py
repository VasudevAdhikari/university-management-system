from django.urls import path
from . import views

app_name = 'executives'

urlpatterns = [
    # Dashboard and Home
    path('', views.executive_home, name='executive_home'),
    path('dashboard/', views.executive_dashboard, name='executive_dashboard'),
    path('unapproved_students/', views.get_unapproved_students, name='unapproved_students'),
    path('approve_student/', views.approve_student, name='approve_student'),

    # University Management
    path('university/info/', views.university_info, name='university_info'),
    path('university/info/edit/', views.edit_university_info, name='edit_university_info'),
    
    # Faculty Management
    path('faculty/', views.faculty_list, name='faculty_list'),
    path('faculty/add/', views.add_faculty, name='add_faculty'),
    path('faculty/<int:faculty_id>/edit/', views.edit_faculty, name='edit_faculty'),
    path('faculty/<int:faculty_id>/delete/', views.delete_faculty, name='delete_faculty'),
    
    # Degree Management
    path('degrees/', views.degree_list, name='degree_list'),
    path('degrees/add/', views.add_degree, name='add_degree'),
    path('degrees/<int:degree_id>/edit/', views.edit_degree, name='edit_degree'),
    path('degrees/<int:degree_id>/delete/', views.delete_degree, name='delete_degree'),
    
    # Department Management
    path('departments/', views.department_list, name='department_list'),
    path('departments/add/', views.add_department, name='add_department'),
    path('departments/<int:dept_id>/edit/', views.edit_department, name='edit_department'),
    path('departments/<int:dept_id>/delete/', views.delete_department, name='delete_department'),
    
    # Semester Management
    path('semesters/', views.semester_list, name='semester_list'),
    path('semesters/add/', views.add_semester, name='add_semester'),
    path('semesters/<int:semester_id>/edit/', views.edit_semester, name='edit_semester'),
    path('semesters/<int:semester_id>/delete/', views.delete_semester, name='delete_semester'),
    
    # Course Management
    path('courses/', views.course_list, name='course_list'),
    path('courses/add/', views.add_course, name='add_course'),
    path('courses/<int:course_id>/edit/', views.edit_course, name='edit_course'),
    path('courses/<int:course_id>/delete/', views.delete_course, name='delete_course'),
    
    # Mailbox Admin Management
    path('mailbox-admin/', views.mailbox_admin, name='mailbox_admin'),
    path('mailbox-admin/assign/', views.assign_mailbox_admin, name='assign_mailbox_admin'),
    
    # Notice Management
    path('notices/', views.notice_list, name='notice_list'),
    path('notices/add/', views.add_notice, name='add_notice'),
    path('notices/<int:notice_id>/edit/', views.edit_notice, name='edit_notice'),
    path('notices/<int:notice_id>/delete/', views.delete_notice, name='delete_notice'),
    path('notices/<int:notice_id>/approve/', views.approve_notice, name='approve_notice'),
    
    # Registration/Enrollment Approvals
    path('approvals/', views.approval_list, name='approval_list'),
    path('approvals/<int:approval_id>/approve/', views.approve_registration, name='approve_registration'),
    path('approvals/<int:approval_id>/reject/', views.reject_registration, name='reject_registration'),
    
    # Admin Management
    path('admins/', views.admin_list, name='admin_list'),
    path('admins/add/', views.add_admin, name='add_admin'),
    
    # Term Management
    path('terms/', views.term_list, name='term_list'),
    path('terms/new/', views.start_new_term, name='start_new_term'),
    path('terms/<int:term_id>/', views.term_details, name='term_details'),
    
    # Profile Management
    path('profile/', views.executive_profile, name='executive_profile'),
    path('profile/edit/', views.edit_executive_profile, name='edit_executive_profile'),
]
