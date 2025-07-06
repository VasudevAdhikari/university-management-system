from django.shortcuts import render, redirect
from authorization.models import Course, Department
from django.views.decorators.csrf import csrf_exempt


def show_course_management(request):
    departments = Department.objects.all()
    courses = {}
    for department in departments:
        courses[department] = []
        for course in Course.objects.filter(department=department):
            courses[department].append(course)
    data = {
        'departments': departments,
        'courses_by_departments': courses,
    }
    return render(request, 'executives/course_management.html', context=data)

@csrf_exempt
def add_course(request):
    if request.method != 'POST':
        return redirect('/executives/show_course_management')
    # Create a new Course instance with the submitted data
    department_id = request.POST.get('department')
    code = request.POST.get('code')
    hours = request.POST.get('hours')
    name = request.POST.get('name')
    credits = request.POST.get('credits')
    description = request.POST.get('description')

    # Create a new Course object
    new_course = Course(
        department=Department.objects.get(pk=int(department_id)) if department_id else None,
        course_code=code or '',
        course_hours=int(hours) if hours else 30,
        course_name=name or '',
        course_credits=int(credits) if credits else 3,
        description=description or ''
    )

    # Save the new course to the database
    new_course.save()
    return show_course_management(request)


@csrf_exempt
def edit_course(request, course_id):
    if request.method != 'POST':
        print('something')
        return redirect('/executives/show_course_management')
    print(request.POST)
    course = Course.objects.get(pk=int(course_id))
    course.department = Department.objects.get(pk=int(request.POST.get('department'))) if request.POST.get('department') else course.department
    course.course_code = request.POST.get('code') or course.course_code
    course.course_hours = int(request.POST.get('hours')) if request.POST.get('hours') else course.course_hours
    course.course_name = request.POST.get('name') or course.course_name
    course.course_credits = int(request.POST.get('credits')) if request.POST.get('credits') else course.course_credits
    course.description = request.POST.get('description') or course.description
    course.save()
    return redirect('/executives/show_course_management')

@csrf_exempt
def delete_course(request, course_id):
    print('something')
    if request.method != 'POST':
        return redirect('/executives/show_course_management')
    print(course_id)
    course = Course.objects.get(pk=int(course_id))
    course.delete()
    return redirect('/executives/show_course_management')