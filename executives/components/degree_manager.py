from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from authorization.models import Degree, Semester, Faculty
@csrf_exempt
def add_degree_api(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'POST required'}, status=405)
    try:
        data = json.loads(request.body)
        # Required fields: name, code, faculty (id), description, total_credits, total_hours, degree_image, semesters
        faculty = Faculty.objects.get(id=data['faculty'])
        degree = Degree.objects.create(
            name=data['name'],
            code=data['code'],
            faculty=faculty,
            description=data.get('description', ''),
            total_credits=data.get('total_credits', 0),
            total_courses=data.get('total_courses', 0),
            total_hours=data.get('total_hours', 0),
            degree_image=data.get('degree_image', 'default.jpg'),
        )
        # Save semesters
        for sem in data.get('semesters', []):
            Semester.objects.create(
                semester_name=sem['semester_name'],
                degree=degree,
                duration_weeks=sem.get('duration_weeks', 16),
                syllabus_structure=sem.get('syllabus_structure', []),
            )
        return JsonResponse({'success': True, 'degree_id': degree.id})
    except Faculty.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Faculty not found'}, status=400)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=500)
from django.shortcuts import render
from authorization.models import Course


def show_degree_management(request):
    course_models = Course.objects.all()
    all_courses = []
    for course in course_models:
        all_courses.append({
            "course_name": course.course_name,
            "course_code": course.course_code,
            "course_credits": course.course_credits,
            "course_hours": course.course_hours,
        })

    faculty_models = Faculty.objects.all()
    all_faculties = []
    for faculty in faculty_models:
        all_faculties.append({
            "id": faculty.pk,
            "name": faculty.name,
            "photo": faculty.faculty_photo.url,
        })
    

    # Query all degrees and structure as required
    all_degrees = []
    for degree in Degree.objects.all():
        # Get all semesters for this degree, ordered by pk (or semester_name if needed)
        semesters = Semester.objects.filter(degree=degree).order_by('pk')
        syllabus = []
        for idx, sem in enumerate(semesters):
            # Each semester's syllabus_structure is a list of course dicts
            courses = []
            for course in sem.syllabus_structure:
                courses.append({
                    "code": course.get("course_code", ""),
                    "title": course.get("course_name", ""),
                    "credit": course.get("course_credits", 0),
                    "hours": course.get("course_hours", 0),
                    "type": course.get("type", "Core")
                })
            syllabus.append({
                "semester": idx + 1,
                "courses": courses
            })
        all_degrees.append({
            "title": degree.name,
            "code": degree.code,
            "duration": f"{degree.duration}Yrs",
            "credit": degree.total_credits,
            "courses": degree.total_courses,
            "image": degree.degree_image.url if hasattr(degree.degree_image, 'url') else './img/bachelor.png',
            "syllabus": syllabus
        })

    data = {
        "all_courses": all_courses,
        "all_faculties": all_faculties,
        "all_degrees": all_degrees,
    }
    return render(request, 'executives/degree_management.html', context=data)