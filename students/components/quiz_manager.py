from django.shortcuts import render, redirect
from authorization.models import Assessment, AssessmentResult, Student, User
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
import unicodedata

def clean_cookie_email(cookie_value):
    if not cookie_value:
        return ''
    return unicodedata.normalize("NFKC", cookie_value.strip())


def show_quiz(request, quiz_id):
    assessment = Assessment.objects.get(id=int(quiz_id))
    user_email = request.COOKIES.get('my_user')
    user = User.objects.get(username=user_email)
    student = Student.objects.get(user=user)
    assessment_result = AssessmentResult.objects.filter(
        assessment=assessment, student=student
    ).first()
    if assessment_result:
        return redirect(f"/students/academics/quiz_answer/{quiz_id}/")
    quiz_data = assessment.assessment  # This is already a dict if using JSONField
    return render(request, 'students/academic/quiz.html', {
        'assessment': assessment,
        'quiz_data': json.dumps(quiz_data),  # Pass as JSON string for JS
    })

def show_quiz_answer(request, quiz_id):
    assessment = AssessmentResult.objects.get(assessment__id=quiz_id)
    quiz_data = assessment.answer  # This is already a dict if using JSONField

    return render(request, 'students/academic/quiz_answer.html', {
        'assessment': assessment,
        'quiz_data': json.dumps(quiz_data),  # Pass as JSON string for JS
    })

@csrf_exempt
def submit_quiz(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        print(data)
        assessment_id = data.get('assessment_id')
        answer = data.get('answer')
        mark = answer.get('total_score', 0)
        assessment = Assessment.objects.get(id=assessment_id)
        user_email = clean_cookie_email(request.COOKIES.get('my_user').strip())
        print(user_email, end='\n\n========================\n\n')
        user = User.objects.get(username=user_email)
        print(user)
        student = Student.objects.get(user=user)
        print(user)

        AssessmentResult.objects.create(
            assessment=assessment,
            student=student,
            answer=answer,
            mark=mark
        )
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)