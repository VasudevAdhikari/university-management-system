from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseNotAllowed
from django.views.decorators.csrf import csrf_exempt
from authorization.models import BatchInstructor, AssessmentType, AssessmentScheme, Assessment, Instructor, Document
import json

def show_course_management(request, batch_instructor_id):
    batch_instructor = BatchInstructor.objects.filter(
        pk=int(batch_instructor_id)).select_related('batch__term', 'course', 'batch__semester'
    ).values(
        "id", 
        "course__id", 
        "course__course_code",
        "course__course_name",
        "course__description",
    ).first() 

    marking_types = [label for _, label in AssessmentType.choices]
    other_instructor_ids = list(
        Document.objects
        .exclude(uploaded_by__email=request.COOKIES.get('my_user'))
        .values_list('uploaded_by__id', flat=True)
        .distinct()
    )

    data = {
        'batch_instructor': batch_instructor,
        'assessment_types': marking_types,
        'instructor': Instructor.objects.filter(user__email=request.COOKIES.get('my_user')).select_related('user').first(),
        'other_instructor_ids': other_instructor_ids,
    }
    return render(request, 'faculty/instructor_course_management.html', context=data)

@csrf_exempt
def marking_scheme_api(request, batch_id):
    # Only allow GET and POST
    if request.method == 'GET':
        try:
            scheme_obj = AssessmentScheme.objects.filter(batch_instructor_id=batch_id).first()
            scheme = scheme_obj.scheme if scheme_obj and scheme_obj.scheme else {}
            return JsonResponse({'scheme': scheme})
        except Exception as e:
            return JsonResponse({'scheme': {}}, status=200)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            scheme = data.get('scheme', {})
            if not isinstance(scheme, dict):
                return HttpResponseBadRequest('Scheme must be a dictionary')
            scheme_obj, created = AssessmentScheme.objects.get_or_create(batch_instructor_id=batch_id)
            scheme_obj.scheme = scheme
            scheme_obj.save()
            return JsonResponse({'success': True, 'scheme': scheme_obj.scheme})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])

@csrf_exempt
def assessments_api(request, batch_id):
    if request.method == 'GET':
        # Group assessments by type
        assessments = Assessment.objects.filter(
            assessment_scheme__batch_instructor__id=batch_id
        )

        result = {}
        for a in assessments:
            result.setdefault(a.get_assessment_type_display(), []).append({
                'id': a.id,
                'title': a.assessment.get('title'),
                # Add other fields as needed
            })
        return JsonResponse(result)
    elif request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            type_ = data.get('type')

            if not type_:
                return HttpResponseBadRequest('Missing assessment type')
            
            scheme = AssessmentScheme.objects.filter(
                batch_instructor_id=batch_id
            ).first()

            if not scheme:
                return HttpResponseBadRequest('No assessment scheme found')
            
            assessment_type = next(
                (member for member in AssessmentType if member.label == type_),
                None
            )

            assessment = {
                "title": f"{type_} {Assessment.objects.filter(assessment_scheme=scheme, assessment_type=assessment_type).count() + 1}"
            }

            # Create new assessment
            assessment = Assessment.objects.create(
                assessment_scheme=scheme,
                assessment_type=assessment_type,
                assessment=assessment,
            )
            return JsonResponse({'success': True, 'id': assessment.id})
        except Exception as e:
            print(e)
            return JsonResponse({'success': False, 'error': str(e)}, status=400)
    else:
        return HttpResponseNotAllowed(['GET', 'POST'])
    


def delete_assessment(request, assessment_id):
    print(assessment_id)
    try:
        assessment = Assessment.objects.get(id=assessment_id)
        print(assessment)
        assessment.delete()
        return JsonResponse({'success': True})
    except Assessment.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'There is no assessment with the provided id'})
