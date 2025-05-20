from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import json
import random
import hashlib
from .models import User, Student, OTP, LoginAttempt, StudentStatus
from difflib import SequenceMatcher
from django.contrib.auth.hashers import make_password

def similarity(a, b):
    return SequenceMatcher(None, a, b).ratio()

def recovery_view(request):
    return render(request, 'htmls/recovery.html')

def otp_login_view(request):
    return render(request, 'htmls/otp_login.html')

def credential_login_view(request):
    return render(request, 'htmls/credential_login.html')

def emergency_contact_login_view(request):
    return render(request, 'htmls/emergency_contact_login.html')

def generate_otp():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def generate_verification_token(email, method, data):
    # Create a unique token based on email, method, and timestamp
    timestamp = str(timezone.now().timestamp())
    token_data = f"{email}:{method}:{data}:{timestamp}"
    return hashlib.sha256(token_data.encode()).hexdigest()

def verify_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        otp = data.get('otp')
        
        if not email or not otp:
            return JsonResponse({'error': 'Email and OTP are required'}, status=400)
            
        # Get the OTP record
        try:
            user = User.objects.get(email=email)
            otp_record = OTP.objects.get(user=user, otp_code=otp, used=False)
        except (User.DoesNotExist, OTP.DoesNotExist):
            LoginAttempt.objects.create(
                user=None,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=False
            )
            return JsonResponse({
                'success': False,
                'message': 'Invalid OTP. Please try again.'
            })
            
        # Check if OTP is expired
        if timezone.now() > otp_record.expires_at:
            otp_record.delete()
            LoginAttempt.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=False
            )
            return JsonResponse({
                'success': False,
                'message': 'OTP has expired. Please request a new one.'
            })
            
        # OTP is valid, mark it as used and clear failed attempts
        otp_record.used = True
        otp_record.save()
        LoginAttempt.objects.filter(user=user).delete()
        
        # Generate verification token
        verification_token = generate_verification_token(email, 'otp', otp)
        request.session['recovery_token'] = verification_token
        request.session['recovery_email'] = email
        request.session['recovery_method'] = 'otp'
        
        return JsonResponse({
            'success': True,
            'redirect_url': f'/auth/recovery/new_password/{email}/'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def check_email(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
            
        # Check if email exists
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'exists': False})
            
        # Check for suspension based on login attempts in the last 3 days
        three_days_ago = timezone.now() - timedelta(days=3)
        recent_attempts = LoginAttempt.objects.filter(
            user=user,
            attempt_time__gte=three_days_ago,
            success=False
        ).count()

        if recent_attempts >= 5:
            return JsonResponse({
                'exists': True,
                'suspended': True
            })
            
        return JsonResponse({
            'exists': True,
            'suspended': False
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["POST"])
def send_otp(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        
        if not email:
            return JsonResponse({'error': 'Email is required'}, status=400)
            
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'User not found'}, status=404)
            
        # Generate 6-digit OTP
        otp = generate_otp()
        
        # Store OTP in database with 5-minute expiration
        expiration_time = timezone.now() + timedelta(minutes=5)
        OTP.objects.create(
            user=user,
            otp_code=otp,
            generated_at=timezone.now(),
            expires_at=expiration_time,
            used=False
        )
        
        # Send OTP via email
        send_mail(
            'Password Recovery OTP',
            f'Your OTP for password recovery is: {otp}. This OTP will expire in 5 minutes.',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        
        return JsonResponse({'success': True})
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
@require_POST
def credential_login(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        phone = data.get('phone')
        gender = data.get('gender')
        dob = data.get('dob')

        if not all([email, phone, gender, dob]):
            return JsonResponse({'success': False, 'error': 'All fields are required'})

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'})

        # Check for suspension based on login attempts in the last 3 days
        three_days_ago = timezone.now() - timedelta(days=3)
        recent_attempts = LoginAttempt.objects.filter(
            user=user,
            attempt_time__gte=three_days_ago,
            success=False
        ).count()

        if recent_attempts >= 5:
            return JsonResponse({
                'success': False,
                'error': 'Account is suspended for 3 days due to multiple failed login attempts.'
            })

        # Normalize phone numbers by removing spaces and special characters
        def normalize_phone(phone):
            return ''.join(filter(str.isdigit, phone))

        # Normalize gender values
        def normalize_gender(gender):
            gender = gender.lower().strip()
            if gender in ['male', 'm']:
                return 'M'
            elif gender in ['female', 'f']:
                return 'F'
            return 'O'

        # Normalize dates to YYYY-MM-DD format
        def normalize_date(date_str):
            try:
                return date_str.split('T')[0]  # Remove time part if present
            except:
                return date_str

        # Get normalized values
        normalized_phone = normalize_phone(phone)
        normalized_user_phone = normalize_phone(user.phone)
        normalized_gender = normalize_gender(gender)
        normalized_user_gender = user.gender
        normalized_dob = normalize_date(dob)
        normalized_user_dob = normalize_date(str(user.date_of_birth))

        # Verify credentials
        phone_match = normalized_phone == normalized_user_phone
        gender_match = normalized_gender == normalized_user_gender
        dob_match = normalized_dob == normalized_user_dob

        if all([phone_match, gender_match, dob_match]):
            # Clear failed attempts on successful login
            LoginAttempt.objects.filter(user=user).delete()
            
            # Generate verification token
            verification_token = generate_verification_token(email, 'credential', f"{phone}:{gender}:{dob}")
            request.session['recovery_token'] = verification_token
            request.session['recovery_email'] = email
            request.session['recovery_method'] = 'credential'

            return JsonResponse({
                'success': True,
                'redirect_url': f'/auth/recovery/new_password/{email}/'
            })
        else:
            # Record failed attempt
            LoginAttempt.objects.create(
                user=user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                success=False
            )
            
            attempts_remaining = 5 - (recent_attempts + 1)
            if attempts_remaining > 0:
                return JsonResponse({
                    'success': False,
                    'error': f'Invalid credentials. {attempts_remaining} attempts remaining.'
                })
            else:
                return JsonResponse({
                    'success': False,
                    'error': 'Account has been suspended for 3 days due to multiple failed login attempts.'
                })

    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

def new_password_view(request, email):
    # Verify the recovery token
    if not all([
        request.session.get('recovery_token'),
        request.session.get('recovery_email') == email,
        request.session.get('recovery_method')
    ]):
        return redirect('recovery_view')
        
    # Check if the token is still valid (not expired)
    try:
        user = User.objects.get(email=email)
        # You might want to add additional token validation here if needed
    except User.DoesNotExist:
        return redirect('recovery_view')
        
    return render(request, 'htmls/new_password.html', {'email': email})

@csrf_exempt
@require_http_methods(["POST"])
def change_password(request):
    try:
        data = json.loads(request.body)
        email = data.get('email')
        new_password = data.get('password')
        
        if not all([email, new_password]):
            return JsonResponse({'success': False, 'error': 'Email and new password are required'})
            
        # Verify the recovery token
        if not all([
            request.session.get('recovery_token'),
            request.session.get('recovery_email') == email,
            request.session.get('recovery_method')
        ]):
            print("invalid or expired recovery session")
            return JsonResponse({'success': False, 'error': 'Invalid or expired recovery session'})
            
        try:
            print("getting user")
            user = User.objects.get(email=email)
            print(user)
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'})
            
        # Update password
        user.set_password(new_password)
        user.save()
        
        # Clear recovery session
        del request.session['recovery_token']
        del request.session['recovery_email']
        del request.session['recovery_method']
        
        print("success")
        return JsonResponse({
            'success': True,
            'redirect_url': '/auth/login/'
        })
        
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Invalid JSON data'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

