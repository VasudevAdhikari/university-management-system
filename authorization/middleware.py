from django.shortcuts import redirect
from django.core.cache import cache
from django.template.response import TemplateResponse
from .models import Student, Instructor, Admin

class UserRoleMiddleware:
    PUBLIC_PATHS = [
        '/auth/logout/',
        '/auth/login/',
        '/auth/login_submit/',
        '/auth/register/',
        '/auth/check_email/',
        '/auth/verify_mail/',
        '/auth/verify_otp/',
        '/auth/save_emergency_contact/',
        '/auth/save_student/',
        '/auth/otp_login/',
        '/auth/recovery/',
        '/auth/recovery/check_email/',
        '/auth/recovery/send_otp/',
        '/auth/recovery/verify_otp/',
        '/auth/recovery/new_password/',
        '/auth/recovery/change_password/',
        '/auth/credential_login/',
        '/auth/credential_login/submit/',
        '/auth/emergency_contact_login/',
        '/auth/mail_verification/',
        '/public/',
        '/public/degrees/',
        '/public/terms/',
        '/public/courses/',
        '/public/acces_denied/',
        '/public/lab_details/',
        # Add more public URLs as needed
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Step 1: Skip middleware for public paths
        for p in self.PUBLIC_PATHS:
            if path.startswith(p):
                return self.get_response(request)

        # Step 2: Check cache for user role
        user_email = request.COOKIES.get('my_user')
        cache_key = f"user_role:{user_email}"
        role = cache.get(cache_key)

        # Step 3: Redirect to login if role not found
        if not role:
            return redirect('/auth/login/')
        
        if request.path.startswith('/executives/') and role!='executive':
            return redirect('/public/access_denied/')

        # Step 4: Store role in request
        request.user_role = role

        # Step 5: Process response
        response = self.get_response(request)

        # Step 6: Inject role into template context if TemplateResponse
        if isinstance(response, TemplateResponse):
            response.context_data = response.context_data or {}
            response.context_data['user_role'] = role
        return response
