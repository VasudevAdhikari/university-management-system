from django.shortcuts import redirect
from django.core.cache import cache
from django.template.response import TemplateResponse
from django.shortcuts import HttpResponse

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
        '/executives/terms/'
        # Add more public URLs as needed
    ]

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        # Step 2: Check cache for user role
        user_email = request.COOKIES.get('my_user')
        cache_key = f"user_role:{user_email}"
        role = cache.get(cache_key)

        # Step 4: Store role in request
        request.user_role = role

        # Step 1: Skip middleware for public paths
        for p in self.PUBLIC_PATHS:
            if path.startswith(p):
                return self.get_response(request)

        # Step 3: Redirect to login if role not found
        if not role:
            return redirect('/auth/login/')
        
        if request.path.startswith('/executives/') and role!='executive':
            return redirect('/public/access_denied/')

        # Step 5: Process response
        response = self.get_response(request)
        return response
    

    from django.utils.deprecation import MiddlewareMixin

class ImgFallbackMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # TemplateResponse: attach post-render callback
        if isinstance(response, TemplateResponse):
            response.add_post_render_callback(self.inject_script)
        # HttpResponse: inject immediately if HTML
        elif isinstance(response, HttpResponse):
            response = self.inject_script(response)

        return response

    def inject_script(self, response):
        """
        Inject the image fallback script into HTML responses.
        Works for both HttpResponse and TemplateResponse.
        """
        content_type = response.get('Content-Type', '')
        if (hasattr(response, 'content') 
            and content_type.startswith('text/html')):
            
            # Make content lowercase for safer </body> search
            content_lower = response.content.lower()
            body_index = content_lower.rfind(b'</body>')

            if body_index != -1:
                script = b"""
                <script>
                document.addEventListener("DOMContentLoaded", function() {
                    document.querySelectorAll("img").forEach(img => {
                        img.addEventListener("error", function handler() {
                            this.removeEventListener("error", handler);
                            this.src = "https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_hybrid&w=740&q=80";
                        });
                    });
                });
                </script>
                """
                # Insert script before </body>
                response.content = (response.content[:body_index] + script +
                                    response.content[body_index:])
                response['Content-Length'] = len(response.content)

        return response  