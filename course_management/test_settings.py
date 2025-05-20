from .settings import *

# Use SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'test_db.sqlite3',
    }
}

# Disable password hashing for faster tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable email sending during tests
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Use in-memory cache for testing
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Disable CSRF for testing
MIDDLEWARE = [
    m for m in MIDDLEWARE if m != 'django.middleware.csrf.CsrfViewMiddleware'
]

# Test media root
MEDIA_ROOT = os.path.join(BASE_DIR, 'test_media')

# Create test media directory if it doesn't exist
if not os.path.exists(MEDIA_ROOT):
    os.makedirs(MEDIA_ROOT)
    os.makedirs(os.path.join(MEDIA_ROOT, 'profile_pictures')) 