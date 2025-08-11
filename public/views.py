from django.shortcuts import render
from django.views.generic import TemplateView
from authorization.models import UniversityDetails, Faculty, Department, Instructor, Admin

# Create your views here.

class HomeView(TemplateView):
    template_name = 'htmls/home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Add any additional context data here
        return context
    
def show_public_page(request):
    university_info = UniversityDetails.objects.filter(
        name='university_info',
    ).first().details
    
    labs = UniversityDetails.objects.filter(
        name='labs',
    ).first().details

    certificates = UniversityDetails.objects.filter(
        name='certificates',
    ).first().details

    photos = UniversityDetails.objects.filter(
        name='photos',
    ).first().details

    partnerships = UniversityDetails.objects.filter(
        name='partnerships',
    ).first().details

    faculties = Faculty.objects.all().select_related('head_of_faculty')

    departments = Department.objects.all().select_related('head_of_department')
    department_data = {}

    for faculty in faculties:
        faculty_departments = departments.filter(faculty=faculty)
        department_data[faculty.name]=faculty_departments

    instructors = Instructor.objects.all().select_related('user')
    instructor_data = {}
    for department in departments:
        instructor_data[department.name]=instructors.filter(department=department)

    executives = Admin.objects.all().select_related('user')

    data = {
        'labs': labs,
        'certificates': certificates,
        'photos': photos,
        'partnerships': partnerships,
        'university_info': university_info,
        'faculties': faculties,
        'department_data': department_data,
        'instructor_data': instructor_data,
        'executives': executives,
    }

    return render(request, 'htmls/home.html', context=data)
