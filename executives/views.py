from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from authorization.models import *
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
import json
from authorization.models import UniversityDetails
from django.views.decorators.http import require_POST
from .additional_business_logics.additionals import *
from .lab_api import lab_edit_api, lab_delete_photo_api, lab_edit_project_api

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


@csrf_exempt
def uni_info_edit(request):
    print('Entered uni_info_edit page')

    if request.method != "POST":
        return JsonResponse({"success": False})

    try:
        # Extract data from the request
        data = {
            "name": request.POST.get("name", ""),
            "address": request.POST.get("address", ""),
            "contact_email": request.POST.get("contact_email", ""),
            "official_website": request.POST.get("official_website", ""),
            "facebook": request.POST.get("facebook", ""),
            "opening_time": request.POST.get("opening_time", ""),
            "description": request.POST.get("description", ""),
        }

        # Always update the first matching record, never create a new one if any exist
        university_info = UniversityDetails.objects.filter(name='university_info').first() or UniversityDetails.objects.create(name='university_info')

        # Delete old profile file if a new one is uploaded and old exists
        if profile_file := request.FILES.get("profile"):
            # Delete old file if exists
            old_profile = university_info.details.get("profile") if university_info.details else None
            if old_profile and default_storage.exists(old_profile):
                default_storage.delete(old_profile)
            profile_url = default_storage.save(profile_file.name, profile_file)
        else:
            profile_url = university_info.details.get("profile") if university_info.details else None

        data['profile'] = profile_url
        university_info.details = data
        university_info.save()

        return JsonResponse({'success': True})
    except Exception as e:
        import traceback
        print("Error in uni_info_edit:", e)
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=500)


def show_uni_info(request):
    university_info = UniversityDetails.objects.filter(name='university_info').first().details
    partnerships = UniversityDetails.objects.filter(name='partnerships').first()
    certificates = UniversityDetails.objects.filter(name='certificates').first()
    photos = UniversityDetails.objects.filter(name='photos').first()
    labs = UniversityDetails.objects.filter(name='labs').first()
    data = {
        'university_info': university_info,
        'partnerships': dict(partnerships.details).items() if partnerships else {},
        'certificates': dict(certificates.details).items() if certificates else {},
        'photos': dict(photos.details).items() if certificates else{},
        'labs': dict(labs.details).items() if labs else{}
    }
    return render(request, 'executives/uni_info.html', context=data)

def show_lab_details(request, lab_name):
    labs = UniversityDetails.objects.filter(name='labs').first().details
    current_lab = labs.get(lab_name)

    # project_leader ORM query has to be fixed to all admins and instructors
    project_leaders = User.objects.all()
    all_project_leaders = get_formatted_lab_members(project_leaders)

    project_members = User.objects.all()
    all_project_members = get_formatted_lab_members(project_members)

    # lab_heads ORM query has to be fixed to all admins
    lab_heads = User.objects.all()
    all_lab_heads = get_formatted_lab_members(lab_heads)

    head_of_lab = User.objects.get(pk=int(current_lab.get('head_of_lab')))
    lab_head_dept = get_head_of_labs_department(head_of_lab)
    projects = current_lab.get('projects')
    
    data = {
        'lab_data': current_lab,
        'lab_key': lab_name,
        'all_project_leaders': all_project_leaders,
        'all_project_members': all_project_members,
        'all_lab_heads': all_lab_heads,
        'head_of_lab': head_of_lab,
        'lab_head_dept': lab_head_dept,
        'projects': projects,
    }
    return render(request, 'executives/lab_details.html', context=data)

@csrf_exempt
def add_partnership_ajax(request):
    if request.method == "POST":
        old_name = request.POST.get('old_name')
        name = request.POST.get('name')
        description = request.POST.get('description')
        type_ = request.POST.get('type')
        image = request.FILES.get('image')

        # Save image and get its path
        image_url = None
        if image:
            image_url = default_storage.save(image.name, image)

        # Fetch or create the partnerships record
        partnerships_obj, _ = UniversityDetails.objects.get_or_create(name='partnerships')
        partnerships = partnerships_obj.details if partnerships_obj.details else {}

        # Ensure partnerships is a dict
        if isinstance(partnerships, str):
            try:
                partnerships = json.loads(partnerships)
            except Exception:
                partnerships = {}

        # Generate a unique partner key
        partner_key = name
        i = 1
        while partner_key in partnerships:
            i += 1
            partner_key = f"{name}_{i}"

        partnerships[partner_key] = {
            "type": type_,
            "description": description,
            "image": image_url
        }

        partnerships_obj.details = partnerships
        partnerships_obj.save()

        # print(partnerships_obj)

        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@csrf_exempt
def edit_partnership_ajax(request):
    if request.method == "POST":
        old_name = request.POST.get('old_name')
        new_name = request.POST.get('name')
        description = request.POST.get('description')
        type_ = request.POST.get('type')
        image = request.FILES.get('image')

        partnerships_obj, _ = UniversityDetails.objects.get_or_create(name='partnerships')
        partnerships = partnerships_obj.details if partnerships_obj.details else {}

        # Ensure partnerships is a dict
        import json
        if isinstance(partnerships, str):
            try:
                partnerships = json.loads(partnerships)
            except Exception:
                partnerships = {}

        if not old_name or old_name not in partnerships:
            return JsonResponse({'success': False, 'error': 'Old partnership name not found'})

        # Save new image if provided, else keep old
        image_url = partnerships[old_name].get('image')
        if image:
            image_url = default_storage.save(image.name, image)

        # Remove old entry if name changed
        if old_name != new_name:
            partnerships.pop(old_name)
        partnerships[new_name] = {
            "type": type_,
            "description": description,
            "image": image_url
        }

        partnerships_obj.details = partnerships
        partnerships_obj.save()

        return JsonResponse({'success': True, 'id': new_name, 'image_url': image_url})
    return JsonResponse({'success': False})

@csrf_exempt
def delete_partnership_ajax(request):
    if request.method == "POST":
        partner_name = request.POST.get('name')
        partnerships_obj, _ = UniversityDetails.objects.get_or_create(name='partnerships')
        partnerships = partnerships_obj.details if partnerships_obj.details else {}

        import json
        if isinstance(partnerships, str):
            try:
                partnerships = json.loads(partnerships)
            except Exception:
                partnerships = {}

        if not partner_name or partner_name not in partnerships:  
            return JsonResponse({'success': False, 'error': 'Partnership not found'})

        # Optionally delete the image file from storage
        image_url = partnerships[partner_name].get('image')
        if image_url:
            from django.core.files.storage import default_storage
            if default_storage.exists(image_url):
                default_storage.delete(image_url)

        partnerships.pop(partner_name)
        partnerships_obj.details = partnerships
        partnerships_obj.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def add_certificate_ajax(request):
    if request.method == "POST":
        title = request.POST.get('title')
        description = request.POST.get('description')
        file = request.FILES.get('file')

        file_url = None
        file_type = None
        if file:
            file_url = default_storage.save(file.name, file)
            file_type = 'pdf' if file.name.lower().endswith('.pdf') else 'img'

        certs_obj, _ = UniversityDetails.objects.get_or_create(name='certificates')
        certs = certs_obj.details if certs_obj.details else {}

        if isinstance(certs, str):
            try:
                certs = json.loads(certs)
            except Exception:
                certs = {}

        cert_id = f"{title}_{int(json.dumps(description).__hash__())}"[:32]
        while cert_id in certs:
            cert_id += "_1"

        certs[cert_id] = {
            "title": title,
            "description": description,
            "file": file_url,
            "file_type": file_type
        }
        certs_obj.details = certs
        certs_obj.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False})

@csrf_exempt
def edit_certificate_ajax(request):
    if request.method == "POST":
        old_id = request.POST.get('old_id')
        title = request.POST.get('title')
        description = request.POST.get('description')
        file = request.FILES.get('file')

        certs_obj, _ = UniversityDetails.objects.get_or_create(name='certificates')
        certs = certs_obj.details if certs_obj.details else {}

        if isinstance(certs, str):
            try:
                certs = json.loads(certs)
            except Exception:
                certs = {}

        if not old_id or old_id not in certs:
            return JsonResponse({'success': False, 'error': 'Certificate not found'})

        # Only update file if a new one is uploaded, else keep the old one
        file_url = certs[old_id].get('file')
        file_type = certs[old_id].get('file_type')
        if file:
            file_url = default_storage.save(file.name, file)
            file_type = 'pdf' if file.name.lower().endswith('.pdf') else 'img'

        cert_id = f"{title}_{int(json.dumps(description).__hash__())}"[:32]
        if old_id != cert_id:
            certs.pop(old_id)
        certs[cert_id] = {
            "title": title,
            "description": description,
            "file": file_url,
            "file_type": file_type
        }
        certs_obj.details = certs
        certs_obj.save()
        return JsonResponse({'success': True, 'id': cert_id, 'file_url': file_url, 'file_type': file_type})
    return JsonResponse({'success': False})

@csrf_exempt
def delete_certificate_ajax(request):
    if request.method == "POST":
        cert_id = request.POST.get('id')
        certs_obj, _ = UniversityDetails.objects.get_or_create(name='certificates')
        certs = certs_obj.details if certs_obj.details else {}

        if isinstance(certs, str):
            try:
                certs = json.loads(certs)
            except Exception:
                certs = {}

        if not cert_id or cert_id not in certs:
            return JsonResponse({'success': False, 'error': 'Certificate not found'})

        file_url = certs[cert_id].get('file')
        if file_url and default_storage.exists(file_url):
            default_storage.delete(file_url)
        certs.pop(cert_id)
        certs_obj.details = certs
        certs_obj.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
def add_photo_ajax(request):
    if request.method == "POST":
        caption = request.POST.get('caption')
        image = request.FILES.get('image')

        image_url = None
        if image:
            image_url = default_storage.save(image.name, image)

        photos_obj, _ = UniversityDetails.objects.get_or_create(name='photos')
        photos = photos_obj.details if photos_obj.details else {}

        if isinstance(photos, str):
            try:
                photos = json.loads(photos)
            except Exception:
                photos = {}

        photo_id = f"{caption}_{int(json.dumps(caption).__hash__())}"[:32]
        while photo_id in photos:
            photo_id += "_1"

        photos[photo_id] = {
            "caption": caption,
            "image": image_url
        }
        photos_obj.details = photos
        photos_obj.save()
        return JsonResponse({'success': True, 'id': photo_id, 'image_url': image_url})
    return JsonResponse({'success': False})

@csrf_exempt
def add_lab_ajax(request):
    if request.method == "POST":
        lab_name = request.POST.get('lab_name')
        image = request.FILES.get('lab_photo')

        print(request.POST)

        image_url = None
        if image:
            image_url = default_storage.save(image.name, image)

        labs_obj, _ = UniversityDetails.objects.get_or_create(name='labs')
        labs = labs_obj.details if labs_obj.details else {}

        if isinstance(labs, str):
            try:
                labs = json.loads(labs)
            except Exception:
                labs = {}

        lab_id = f"{lab_name}_{int(json.dumps(lab_name).__hash__())}"[:32]
        while lab_id in labs:
            photo_id += "_1"

        labs[lab_id] = {
            "lab_name": lab_name,
            "images": [image_url,]
        }
        labs_obj.details = labs
        labs_obj.save()
        return redirect('/executives/uni_info/')
    return JsonResponse({'success': False})

@csrf_exempt
def delete_lab_ajax(request, lab_id):
    labs = UniversityDetails.objects.filter(name='labs').first()
    lab_details = labs.details
    lab_details.pop(lab_id)
    labs.details = lab_details
    labs.save()
    return redirect('/executives/uni_info/')
    
    

@csrf_exempt
def edit_photo_ajax(request):
    if request.method == "POST":
        old_id = request.POST.get('old_id')
        caption = request.POST.get('caption')
        image = request.FILES.get('image')

        photos_obj, _ = UniversityDetails.objects.get_or_create(name='photos')
        photos = photos_obj.details if photos_obj.details else {}

        if isinstance(photos, str):
            try:
                photos = json.loads(photos)
            except Exception:
                photos = {}

        if not old_id or old_id not in photos:
            return JsonResponse({'success': False, 'error': 'Photo not found'})

        # Only update image if a new one is uploaded, else keep the old one
        image_url = photos[old_id].get('image')
        if image:
            image_url = default_storage.save(image.name, image)

        photo_id = f"{caption}_{int(json.dumps(caption).__hash__())}"[:32]
        if old_id != photo_id:
            photos.pop(old_id)
        photos[photo_id] = {
            "caption": caption,
            "image": image_url
        }
        photos_obj.details = photos
        photos_obj.save()
        return JsonResponse({'success': True, 'id': photo_id, 'image_url': image_url})
    return JsonResponse({'success': False})

@csrf_exempt
def delete_photo_ajax(request):
    if request.method == "POST":
        photo_id = request.POST.get('id')
        photos_obj, _ = UniversityDetails.objects.get_or_create(name='photos')
        photos = photos_obj.details if photos_obj.details else {}

        if isinstance(photos, str):
            try:
                photos = json.loads(photos)
            except Exception:
                photos = {}

        if not photo_id or photo_id not in photos:
            return JsonResponse({'success': False, 'error': 'Photo not found'})

        image_url = photos[photo_id].get('image')
        if image_url and default_storage.exists(image_url):
            default_storage.delete(image_url)
        photos.pop(photo_id)
        photos_obj.details = photos
        photos_obj.save()
        return JsonResponse({'success': True})
    return JsonResponse({'success': False, 'error': 'Invalid request'})


def show_department_management(request):
    return render(request, 'executives/department_management.html')

def show_unapproved_instructors(request):
    return render(request, 'executives/unapproved_instructors.html')
