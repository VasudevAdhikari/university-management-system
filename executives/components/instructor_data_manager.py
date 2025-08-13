from django.shortcuts import render
from authorization.models import Instructor, BatchInstructor, EnrollmentCourse
from collections import defaultdict
from django.shortcuts import get_object_or_404


def show_instructor_data(request, instructor_id):
    # Fetch instructor with related user, department, emergency contact
    instructor = get_object_or_404(
        Instructor.objects.select_related('user', 'user__emergency_contact', 'department'),
        pk=instructor_id
    )

    # Total courses taught
    total_courses_taught = BatchInstructor.objects.filter(instructor=instructor).count()

    # Total students taught (via EnrollmentCourse)
    total_students_taught = EnrollmentCourse.objects.filter(
        batch_instructor__instructor=instructor
    ).count()

    # Fetch all BatchInstructor entries for this instructor with related info
    batch_instructors = BatchInstructor.objects.filter(
        instructor=instructor
    ).select_related(
        'course',
        'batch__semester__degree',
        'batch__term'
    )

    # Group courses by Term
    terms_dict = defaultdict(list)
    for bi in batch_instructors:
        term = bi.batch.term
        terms_dict[term].append(bi)

    # Convert to a sorted list for template
    terms_list = sorted(terms_dict.items(), key=lambda x: x[0].start_date)

    # Prepare context for template
    terms = []
    for term, courses in terms_list:
        term_courses = []
        for bi in courses:
            term_courses.append({
                'id': bi.course.id,
                'batch_instructor_id': bi.id,
                'course_code': bi.course.course_code,
                'course_name': bi.course.course_name,
                'batch': {
                    'degree_name': bi.batch.semester.degree.name,
                    'semester_name': bi.batch.semester.semester_name
                }
            })
        terms.append({
            'name': term.term_name,
            'start_date': term.start_date,
            'end_date': term.end_date,
            'courses': term_courses
        })

    data = {
        'instructor': instructor,
        'total_courses_taught': total_courses_taught,
        'total_students_taught': total_students_taught,
        'terms': terms
    }

    return render(request, 'executives/instructor_data.html', context=data)
