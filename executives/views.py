from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from authorization.models import *

def is_executive(user):
    return user.is_authenticated and hasattr(user, 'executive')

# Decorator for executive-only views
def executive_required(view_func):
    decorated_view = user_passes_test(is_executive, login_url='auth:login')(view_func)
    return login_required(decorated_view)

# Dashboard and Home Views
def executive_home(request):
    data = {
        'unapproved_student_count': Student.objects.filter(status=StudentStatus.UNAPPROVED).count(),
        'unapproved_instructor_count': Instructor.objects.filter(employment_status=EmploymentStatus.UNAPPROVED).count(),
    }
    return render(request, 'executives/home.html', context=data)

def get_unapproved_students(request):
    data = {
        'unapproved_students': Student.objects.select_related('user').all().filter(status=StudentStatus.UNAPPROVED)
    }
    for student in data['unapproved_students']:
        print(student.user.username)
    return render(request, 'executives/unapproved_students.html', context=data)

def approve_student(request):
    print(request.POST)
    if request.method == 'POST':
        data = request.body.decode('utf-8')
        data = json.loads(data)
        student_id = data.get('student_id')
        print(f'student id is {student_id}')
        student = Student.objects.get(student_number=student_id)
        print(student.status)
        student.status = StudentStatus.ACTIVE
        print(student.status)
        student.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@executive_required
def executive_dashboard(request):
    context = {
        'pending_approvals': 0,  # To be implemented
        'pending_notices': 0,    # To be implemented
    }
    return render(request, 'executives/dashboard.html', context)

# University Management Views
@executive_required
def university_info(request):
    return render(request, 'executives/university/info.html')

@executive_required
def edit_university_info(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/university/edit_info.html')

# Faculty Management Views
@executive_required
def faculty_list(request):
    return render(request, 'executives/faculty/list.html')

@executive_required
def add_faculty(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/faculty/add.html')

@executive_required
def edit_faculty(request, faculty_id):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/faculty/edit.html')

@executive_required
def delete_faculty(request, faculty_id):
    if request.method == 'POST':
        # Handle deletion
        pass
    return redirect('executives:faculty_list')

# Degree Management Views
@executive_required
def degree_list(request):
    return render(request, 'executives/degrees/list.html')

@executive_required
def add_degree(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/degrees/add.html')

@executive_required
def edit_degree(request, degree_id):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/degrees/edit.html')

@executive_required
def delete_degree(request, degree_id):
    if request.method == 'POST':
        # Handle deletion
        pass
    return redirect('executives:degree_list')

# Department Management Views
@executive_required
def department_list(request):
    return render(request, 'executives/departments/list.html')

@executive_required
def add_department(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/departments/add.html')

@executive_required
def edit_department(request, dept_id):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/departments/edit.html')

@executive_required
def delete_department(request, dept_id):
    if request.method == 'POST':
        # Handle deletion
        pass
    return redirect('executives:department_list')

# Semester Management Views
@executive_required
def semester_list(request):
    return render(request, 'executives/semesters/list.html')

@executive_required
def add_semester(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/semesters/add.html')

@executive_required
def edit_semester(request, semester_id):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/semesters/edit.html')

@executive_required
def delete_semester(request, semester_id):
    if request.method == 'POST':
        # Handle deletion
        pass
    return redirect('executives:semester_list')

# Course Management Views
@executive_required
def course_list(request):
    return render(request, 'executives/courses/list.html')

@executive_required
def add_course(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/courses/add.html')

@executive_required
def edit_course(request, course_id):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/courses/edit.html')

@executive_required
def delete_course(request, course_id):
    if request.method == 'POST':
        # Handle deletion
        pass
    return redirect('executives:course_list')

# Mailbox Admin Management Views
@executive_required
def mailbox_admin(request):
    return render(request, 'executives/mailbox/admin.html')

@executive_required
def assign_mailbox_admin(request):
    if request.method == 'POST':
        # Handle assignment
        pass
    return redirect('executives:mailbox_admin')

# Notice Management Views
@executive_required
def notice_list(request):
    return render(request, 'executives/notices/list.html')

@executive_required
def add_notice(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/notices/add.html')

@executive_required
def edit_notice(request, notice_id):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/notices/edit.html')

@executive_required
def delete_notice(request, notice_id):
    if request.method == 'POST':
        # Handle deletion
        pass
    return redirect('executives:notice_list')

@executive_required
def approve_notice(request, notice_id):
    if request.method == 'POST':
        # Handle approval
        pass
    return redirect('executives:notice_list')

# Registration/Enrollment Approval Views
@executive_required
def approval_list(request):
    return render(request, 'executives/approvals/list.html')

@executive_required
def approve_registration(request, approval_id):
    if request.method == 'POST':
        # Handle approval
        pass
    return redirect('executives:approval_list')

@executive_required
def reject_registration(request, approval_id):
    if request.method == 'POST':
        # Handle rejection
        pass
    return redirect('executives:approval_list')

# Admin Management Views
@executive_required
def admin_list(request):
    return render(request, 'executives/admins/list.html')

@executive_required
def add_admin(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/admins/add.html')

# Term Management Views
@executive_required
def term_list(request):
    return render(request, 'executives/terms/list.html')

@executive_required
def start_new_term(request):
    if request.method == 'POST':
        # Handle new term creation
        pass
    return render(request, 'executives/terms/new.html')

@executive_required
def term_details(request, term_id):
    return render(request, 'executives/terms/details.html')

# Profile Management Views
@executive_required
def executive_profile(request):
    return render(request, 'executives/profile/view.html')

@executive_required
def edit_executive_profile(request):
    if request.method == 'POST':
        # Handle form submission
        pass
    return render(request, 'executives/profile/edit.html')
