 # Authorization App

## Description
The Authorization App is a Django-based authentication and authorization system that provides secure user management, registration, and login functionality. It includes features like email verification, OTP-based authentication, and password recovery mechanisms.

## Features
- User Registration with Email Verification
- Secure Login System
- Password Recovery with Multiple Methods:
  - OTP-based Recovery
  - Credential-based Recovery
  - Emergency Contact-based Recovery
- Profile Management
- Session Management
- Password Strength Validation
- Account Security Features:
  - Login Attempt Tracking
  - Account Suspension for Failed Attempts
  - Secure Password Hashing

## Installation
1. Ensure you have Python 3.8+ installed
2. Install required packages:
   ```bash
   pip install django
   pip install mysqlclient  # For MySQL database
   ```

## Configuration
1. Database Configuration:
   - Update settings.py with your MySQL credentials
   - Set up the database connection parameters

2. Email Configuration:
   - Configure SMTP settings in settings.py
   - Set up email templates for verification and recovery

3. Environment Variables:
   ```python
   DEBUG=True
   SECRET_KEY='your-secret-key'
   DB_PASSWORD='your-database-password'
   EMAIL_HOST_USER='your-email@example.com'
   EMAIL_HOST_PASSWORD='your-email-password'
   ```

## Usage
### Registration Process
1. User enters email
2. System sends OTP for verification
3. After OTP verification, user completes profile
4. Account is created upon successful registration

### Login Process
1. User enters email and password
2. System validates credentials
3. On successful login, user is redirected to dashboard
4. Failed attempts are tracked and may lead to account suspension

### Password Recovery
1. User selects recovery method:
   - OTP via email
   - Security questions
2. System verifies identity
3. User sets new password
4. Account is unlocked
5. Failed recovery attempts are also tracked and may lead to account suspension

## API Endpoints
- `/auth/register/` - User registration
- `/auth/login/` - User login
- `/auth/verify_mail/` - Email verification
- `/auth/otp_verification/` - OTP verification
- `/auth/recovery/` - Password recovery
- `/auth/profile/` - Profile management

## Security Features
- Password hashing using Django's default hasher
- CSRF protection
- Session management
- Rate limiting for login attempts
- Secure password requirements:
  - Minimum 8 characters
  - Uppercase and lowercase letters
  - Numbers
  - Special characters

## File Structure
```
authorization/
├── migrations/
├── templates/
│   ├── htmls/
│   ├── stylesheets/
│   └── javascripts/
├── __init__.py
├── admin.py
├── apps.py
├── models.py
├── recovery_views.py
├── urls.py
└── views.py
```

## Dependencies
- Django 5.1.1+
- MySQL
- Bootstrap 5.3.0
- JavaScript (ES6+)

## Testing
To run tests:
```bash
python manage.py test authorization
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License.

## Contact
For support or questions, please contact the project maintainer.
Name              : Moe Thiha
Phone             : +959 989377380
Telegram username : @moethihaAdk
Facebook          : Vasudev Adhikari
Youtube           : MM Logic Gallery

## Acknowledgments
- Django Documentation
- Bootstrap Documentation
- MySQL Documentation