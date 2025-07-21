from authorization.models import User, Student, StudentStatus, EmergencyContact

def get_student_for_approval(student: Student):
    user = student.user
    data = {
        "id": user.pk,
        "name": user.full_name,
        "email": user.email,
        "profile": user.profile_picture.url,
        "phone": user.phone,
        "city": user.city,
        "date_of_birth": user.date_of_birth,
        "telegram_username": user.telegram_username,
        "outlook_mail": user.outlook_email,
        "gender": user.get_gender_display(),
        "emergency_contact": {
            "name": user.emergency_contact.contact_name,
            "email": user.emergency_contact.email,
            "phone": user.emergency_contact.phone,
        }if user and user.emergency_contact else '',
    }

    return data