from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from authorization.models import Assessment, AssessmentResult, Student
import json
import os
from datetime import datetime

def show_assessment_submission(request, assessment_id):
    assessment = Assessment.objects.get(id=assessment_id)

    data = {
        'assessment': assessment,
    }

    return render(request, 'students/academic/assessment.html', context=data)

# @login_required
@csrf_exempt
def submit_assessment(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'message': 'Invalid request method'})
    
    try:
        assessment_id = request.POST.get('assessment_id')
        start_time = request.POST.get('start_time')
        total_time_taken = request.POST.get('total_time_taken')
        
        if not assessment_id:
            return JsonResponse({'success': False, 'message': 'Assessment ID is required'})
        
        # Get the assessment
        assessment = Assessment.objects.get(id=assessment_id)
        
        # Get the student
        student = Student.objects.get(user__username=request.COOKIES.get('my_user'))
        
        # Check if assessment result already exists
        existing_result = AssessmentResult.objects.filter(
            assessment=assessment,
            student=student
        ).first()

        print(existing_result)
        
        if existing_result:
            return JsonResponse({'success': False, 'message': 'Assessment already submitted'})
        
        # Handle file uploads
        uploaded_files = []
        uploaded_images = []
        
        # Process uploaded images
        for key in request.FILES:
            if key.startswith('images['):
                file = request.FILES[key]
                if file.content_type.startswith('image/'):
                    # Save image to media/assessment_submissions/images/
                    file_path = f'assessment_submissions/{assessment_id}_{student.pk}_{file.name.replace(" ", "")}'
                    with open(f'media/{file_path}', 'wb+') as destination:
                        for chunk in file.chunks():
                            destination.write(chunk)
                    uploaded_images.append(file_path)
        
        # Process uploaded files
        for key in request.FILES:
            if key.startswith('files['):
                file = request.FILES[key]
                # Save file to media/assessment_submissions/files/
                file_path = f'assessment_submissions/{assessment_id}_{student.pk}_{file.name.replace(" ","")}'
                with open(f'media/{file_path}', 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
                uploaded_files.append(file_path)
        
        # Create assessment result with timing data
        answer_data = {
            'images': uploaded_images,
            'files': uploaded_files,
            'submitted_at': datetime.now().isoformat(),
            'start_time': start_time,
            'total_time_taken': int(total_time_taken) if total_time_taken else 0,
            'total_time_taken_formatted': formatTimeTaken(int(total_time_taken)) if total_time_taken else '0 minutes'
        }

        print(answer_data)
        
        assessment_result = AssessmentResult.objects.create(
            assessment=assessment,
            student=student,
            answer=answer_data,
            mark=0  # Default mark, will be updated by instructor
        )
        
        return JsonResponse({
            'success': True,
            'message': 'Assessment submitted successfully',
            'result_id': assessment_result.id
        })
        
    except Assessment.DoesNotExist as e:
        print(e)
        return JsonResponse({'success': False, 'message': 'Assessment not found'})
    except Student.DoesNotExist as e:
        print(e)
        return JsonResponse({'success': False, 'message': 'Student not found'})
    except Exception as e:
        print(e)
        return JsonResponse({'success': False, 'message': f'Error: {str(e)}'})

def formatTimeTaken(milliseconds):
    """Format time taken in milliseconds to human readable format"""
    if milliseconds < 60000:  # Less than 1 minute
        seconds = milliseconds // 1000
        return f"{seconds} seconds"
    elif milliseconds < 3600000:  # Less than 1 hour
        minutes = milliseconds // 60000
        seconds = (milliseconds % 60000) // 1000
        return f"{minutes} minutes {seconds} seconds"
    else:  # 1 hour or more
        hours = milliseconds // 3600000
        minutes = (milliseconds % 3600000) // 60000
        return f"{hours} hours {minutes} minutes"
    

def show_submitted_assessment(request, assessment_id):
    try:
        print('something')
        result = AssessmentResult.objects.filter(
            pk=assessment_id
        ).select_related('student', 'student__user', 'assessment').first()
        print(result)
        return render(request, 'students/academic/submitted_assessment.html', {'result': result})
    except Student.DoesNotExist:
        return render(request, 'students/academic/submitted_assessment.html', {'result': None, 'error': 'Student not found.'})
    except AssessmentResult.DoesNotExist:
        return render(request, 'students/academic/submitted_assessment.html', {'result': None, 'error': 'Assessment result not found.'})
    except Exception as e:
        return render(request, 'students/academic/submitted_assessment.html', {'result': None, 'error': str(e)})