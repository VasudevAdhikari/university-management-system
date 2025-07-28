from django.shortcuts import render
from authorization.models import User, Student, Course, BatchInstructor, Assessment, AssessmentResult, AssessmentScheme, AssessmentType
from django.utils import timezone
from dateutil.relativedelta import relativedelta
import json

def show_course_details(request, batch_instructor_id):
    user_email = request.COOKIES.get('my_user')
    user = User.objects.get(username=user_email)
    student = Student.objects.get(user=user)

    batch_instructor = BatchInstructor.objects.get(id=batch_instructor_id)
    course = batch_instructor.course

    instructor = batch_instructor.instructor
    diff = relativedelta(timezone.now(), instructor.created_at)

    assessment_scheme = AssessmentScheme.objects.get(batch_instructor__id=batch_instructor_id)
    scheme = []
    assessments = []
    for assessment, percent in assessment_scheme.scheme.items():
        scheme.append({
            'type': assessment, 
            'mark': percent,
        })
        type = next(
            (member for member in AssessmentType if member.label == assessment),
            None
        )
        inner_assessment = Assessment.objects.filter(
            assessment_type=type, 
            assessment_scheme=assessment_scheme
        )
        
        assessments.append(inner_assessment)

    data = {
        'student_name': user.full_name,
        'course': course,
        'instructor': instructor.user,
        'instructor_role': instructor.position_in_university,
        'experience': diff.years,
        'scheme': json.dumps(scheme),
        'assessments': assessments,
    }
    print(data)
    return render(request, 'students/academic/batch_instructor.html', context=data)