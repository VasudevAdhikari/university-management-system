from django.shortcuts import render, redirect
from authorization.models import Student, User, SISForm
from django.http import JsonResponse
from django.contrib import messages
from django.utils import timezone

def show_sis_form(request):
    user_email = request.COOKIES.get('my_user')
    if not user_email:
        return JsonResponse({'success': False})

    sis_form = SISForm.objects.filter(
        student__user__email=user_email
    ).select_related(
        'student', 'student__user'
    ).first()

    data = {
        'sis_form': sis_form,
    }

    return render(request, 'students/personal/sis.html', context=data)

def save_sis_form(request):
    if request.method == 'POST':
        user_email= request.COOKIES.get('my_user')
        user = User.objects.get(email=user_email)
        student = Student.objects.get(user=user)

         # Get data from request.POST (IDs from your form)
        blood_group = request.POST.get('blood_group')
        ethnicity = request.POST.get('ethnicity')
        religion = request.POST.get('religion')
        NRC = request.POST.get('nrc')
        birthplace = request.POST.get('birthplace')
        
        father_name = request.POST.get('father_name')
        father_NRC = request.POST.get('father_NRC')
        father_birthplace = request.POST.get('father_birthplace')
        father_city = request.POST.get('father_city')
        father_phone = request.POST.get('father_phone')
        father_profession = request.POST.get('father_profession')
        father_gmail = request.POST.get('father_gmail')
        father_ethnicity = request.POST.get('father_ethnicity')
        father_religion = request.POST.get('father_religion')
        
        mother_name = request.POST.get('mother_name')
        mother_NRC = request.POST.get('mother_NRC')
        mother_birthplace = request.POST.get('mother_birthplace')
        mother_city = request.POST.get('mother_city')
        mother_phone = request.POST.get('mother_phone')
        mother_profession = request.POST.get('mother_profession')
        mother_gmail = request.POST.get('mother_gmail')
        mother_ethnicity = request.POST.get('mother_ethnicity')
        mother_religion = request.POST.get('mother_religion')
        
        matric_roll_no = request.POST.get('matric_roll_no')
        exam_dept = request.POST.get('exam_dept')
        passed_year = request.POST.get('passed_year')
        total_marks = request.POST.get('total_marks')
        
        has_spouse = request.POST.get('has_spouse') == 'on'
        spouse_name = request.POST.get('spouse_name') if has_spouse else ''

        # Create SISForm instance
        sis_form = SISForm(
            created_at=timezone.now(),
            student=student,
            blood_group=blood_group,
            ethnicity=ethnicity,
            religion=religion,
            NRC=NRC,
            birthplace=birthplace,
            
            father_name=father_name,
            father_NRC=father_NRC,
            father_birthplace=father_birthplace,
            father_city=father_city,
            father_phone=father_phone,
            father_profession=father_profession,
            father_gmail=father_gmail,
            father_ethnicity=father_ethnicity,
            father_religion=father_religion,

            mother_name=mother_name,
            mother_NRC=mother_NRC,
            mother_birthplace=mother_birthplace,
            mother_city=mother_city,
            mother_phone=mother_phone,
            mother_profession=mother_profession,
            mother_gmail=mother_gmail,
            mother_ethnicity=mother_ethnicity,
            mother_religion=mother_religion,

            matric_roll_no=matric_roll_no,
            exam_dept=exam_dept,
            passed_year=passed_year,
            total_marks=total_marks,

            has_spouse=has_spouse,
            spouse_name=spouse_name,
        )
        sis_form.save()
        messages.info(request, 'SIS Form Filling Successful')
        return redirect('/students/mailbox/')
    else:
        return JsonResponse({'success': False, 'error': 'Only Post Requests are allowed'})