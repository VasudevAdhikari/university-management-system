from django.shortcuts import render
from authorization.models import Student, User, MailboxPost, MailboxReport, Comment, MailboxPostStatus, MailboxAdmin, Notification, NotificationType, UniversityDetails
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods, require_POST
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.conf import settings
from django.utils import timezone
import json
import os
from datetime import datetime
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_GET
from django.core.files.storage import default_storage
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from .notifications import *

# Create your views here.
@ensure_csrf_cookie
def mailbox(request):
    latest_posts = MailboxPost.objects.order_by('-created_at')[:5]
    requester = Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user')))
    requester_post_count = MailboxPost.objects.filter(uploaded_by=requester).count()
    requester_pending_post_count = MailboxPost.objects.filter(uploaded_by=requester,status=MailboxPostStatus.PENDING).count()

    post_details = []
    for post in latest_posts:
        # Convert JSON fields to Python objects
        post_data = json.loads(post.post)  # Assuming 'post' is a JSON string
        reactions_data = json.loads(post.reactions) if post.reactions else None # Assuming 'reactions' is a JSON string
        # Append the data to the list
        post_details.append({
            'id': post.id,
            'created_at': post.created_at,
            'updated_at': post.updated_at,
            'post': post_data,
            'reactions': reactions_data,
            'approved_at': post.approved_at,
            'approved_by': post.approved_by,
            'uploaded_by': post.uploaded_by,
        })
    requester = Student.objects.get(user = User.objects.get(username=request.COOKIES.get('my_user')))
    notifications = Notification.objects.filter(type=NotificationType.STUDENT_MAILBOX,user=requester.user)
    is_admin = MailboxAdmin.objects.filter(student=requester).exists()

    # Get university details for banner and description
    university_details, created = UniversityDetails.objects.get_or_create(
        name='main_university',
        defaults={
            'details': {
                'mailbox_banner_photo': '',
                'mailbox_description': 'Welcome to the Student Mailbox - your central hub for academic discussions, resource sharing, and community engagement. Connect with fellow students, share your thoughts, and stay updated with the latest campus activities. This platform is designed to foster meaningful interactions and collaborative learning among students.'
            }
        }
    )

    data = {
        'students': Student.objects.all(),
        'most_active': Student.objects.all()[:5],
        'user': requester,
        'is_admin': is_admin,
        'posts': post_details,
        'current_page': 'mailbox',
        'post_count': MailboxPost.objects.all().count() if is_admin else requester_post_count,
        'pending_count': MailboxPost.objects.filter(status=MailboxPostStatus.PENDING).count() if is_admin else requester_pending_post_count,
        'notifications': notifications,
        'notification_count': notifications.count(),
        'university_details': university_details.details,
    }
    return render(request, 'students/mailbox/htmls/mailbox.html', context=data)

@require_http_methods(["POST"])
def handle_post(request):
    try:
        # Print the request data for debugging
        print("\n=== POST Request Debug Info ===")
        print("Content Type:", request.content_type)
        
        # For multipart form data (files), use request.POST and request.FILES
        if request.content_type.startswith('multipart/form-data'):
            post_text = request.POST.get('post_text', '')
            is_anonymous = request.POST.get('is_anonymous', 'false').lower() == 'true'
            print("\nPost Text:", post_text)
            print("\nIs Anonymous:", is_anonymous)
            print("\nPOST Data:", dict(request.POST))
            print("\nFiles:", dict(request.FILES))
            
            # Handle file uploads
            uploaded_files = []
            if request.FILES:
                for file in request.FILES.getlist('files'):
                    # Generate unique filename
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    filename = f"{timestamp}_{file.name}"
                    file_path = os.path.join(settings.POST_MEDIA_ROOT, filename)
                    
                    # Save the file
                    with open(file_path, 'wb+') as destination:
                        for chunk in file.chunks():
                            destination.write(chunk)
                    
                    # Store relative path for database
                    relative_path = os.path.join('posts', filename)
                    uploaded_files.append(relative_path)
                    print(f"Saved file: {relative_path}")
            
            # Create post data JSON
            post_data = {
                'post_text': post_text,
                'post_files': uploaded_files
            }
            
            # Save to database (you'll need to create this model)
            post = MailboxPost.objects.create(
                post=json.dumps(post_data),
                created_at=timezone.now(),
                updated_at=timezone.now(),
                uploaded_by=Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user'))),
                is_anonymous=is_anonymous
            )
            
            return JsonResponse({
                'status': 'success',
                'message': 'Post received successfully',
                'post_text': post_text,
                'files': uploaded_files
            })
            
        # For JSON data, use request.body
        else:
            print("\nRaw POST Data:", request.body.decode('utf-8'))
            
        print("\n============================\n")
        
    except Exception as e:
        print("Error in handle_post:", str(e))
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)

@require_http_methods(["GET"])
def load_more_posts(request):
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 5))
        current_page = str(request.GET.get('current_page', 'mailbox'))
        is_admin = request.GET.get('is_admin')
        is_admin = {"true": True, "false": False}.get(is_admin.lower())
        print(f"is admin {is_admin}\n\n\n\n\n\n================================\n\n\n\n\n")
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get posts with pagination
        posts = []
        if current_page == 'mailbox':
            posts = MailboxPost.objects.filter(status=MailboxPostStatus.APPROVED).order_by('-created_at')[offset:offset + per_page]
        elif current_page == 'manage-your-posts':
            print("this is manage post page")
            requester = Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user')))
            posts = MailboxPost.objects.all().order_by('-created_at')[offset:offset + per_page] if is_admin else MailboxPost.objects.filter(uploaded_by=requester).order_by('-created_at')[offset:offset + per_page]
        
        # Format posts for response
        formatted_posts = []
        current_user = get_current_user(request)

        # Check if current user is a MailboxAdmin
        is_mailbox_admin = False
        try:
            student = Student.objects.get(user=current_user)
            is_mailbox_admin = MailboxAdmin.objects.filter(student=student).exists()
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            is_mailbox_admin = False

        for post in posts:
            comment_count = Comment.objects.filter(post=post).count()
            post_data = json.loads(post.post)
            reactions_data = json.loads(post.reactions) if post.reactions else {}
            user_ids = list(reactions_data.keys())
            # Fetch all relevant users at once to avoid many queries
            users = User.objects.filter(id__in=user_ids)
            user_map = {str(user.id): user for user in users}  # keys as strings matching user_ids keys
            # Build a new reactions dictionary with User objects as keys
            reactions = {}
            for user_id, reaction in reactions_data.items():
                reactions[user_id] = {
                    'reaction': reaction,
                    'reactor': User.objects.get(id=user_id).full_name,
                    'profile_picture': {
                        'url': User.objects.get(id=user_id).profile_picture.url
                    }
            }
            print(reactions)
            user_reaction = reactions.get(str(current_user.id))

            # Get report count for MailboxAdmins
            report_count = 0
            if is_mailbox_admin:
                report_count = MailboxReport.objects.filter(post=post).count()

            # Handle anonymous posts
            if post.is_anonymous:
                author_name = f"Anonymous {int(post.uploaded_by.user.id)*2}"
                author_id = post.uploaded_by.user.id
                profile_picture_url = "/static/students/mailbox/images/profile.png"  # Use existing profile image for anonymous
            else:
                author_name = post.uploaded_by.user.full_name
                author_id = post.uploaded_by.user.id
                profile_picture_url = post.uploaded_by.user.profile_picture.url
                print(f"author id {author_id}\n\n\n\n\n\n\n********************************************************")
            formatted_posts.append({
                'id': post.id,
                'post': post_data,
                'uploaded_by': {
                    'user': {
                        'full_name': author_name,
                        'id': author_id,
                        'profile_picture': {
                            'url': profile_picture_url
                        }
                    }
                },
                'updated_at': post.updated_at.strftime('%B %d, %Y, %I:%M%p'),
                'user_reaction': user_reaction,
                'reactions': reactions,
                'comment_count': comment_count,
                'report_count': report_count,
                'status': {
                    'status': post.status,
                    'status_text': post.get_status_display(),
                },
                'is_anonymous': post.is_anonymous
            })
        
        return JsonResponse({
            'status': 'success',
            'posts': formatted_posts
        })
        
    except Exception as e:
        print("Error in load_more_posts:", str(e))
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=400)

@require_http_methods(["POST"])
def handle_comment(request):
    try:
        # Print request data for debugging
        print("\n=== Comment Request Debug Info ===")
        print("Content Type:", request.content_type)
        print("Raw POST Data:", request.body.decode('utf-8'))
        
        # Parse JSON data
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError as e:
            print("JSON Decode Error:", str(e))
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid JSON data'
            }, status=400)

        # Extract and validate required fields
        post_id = data.get('post_id')
        comment_text = data.get('comment_text')
        parent_comment_id = data.get('parent_comment_id')
        is_anonymous = data.get('is_anonymous', False)

        print("Post ID:", post_id)
        print("Comment Text:", comment_text)
        print("Parent Comment ID:", parent_comment_id)
        print("Is Anonymous:", is_anonymous)

        if not post_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Post ID is required'
            }, status=400)

        if not comment_text:
            return JsonResponse({
                'status': 'error',
                'message': 'Comment text is required'
            }, status=400)

        # Get the post
        try:
            post = MailboxPost.objects.get(id=post_id)
        except MailboxPost.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': f'Post with ID {post_id} not found'
            }, status=404)
        
        # Get the current user
        try:
            current_user = User.objects.get(username=request.COOKIES.get('my_user'))
        except User.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'User not found'
            }, status=404)

        # Create the comment
        comment = Comment.objects.create(
            post=post,
            comment=comment_text,
            commented_by=current_user,
            parent_id=parent_comment_id if parent_comment_id else None,
            is_anonymous=is_anonymous
        )
        print(post.post)

        # Import notification functions
        from .notifications import notify_new_comment_on_post, notify_comment_reply

        # Get post text for notifications
        post_data = json.loads(post.post)
        post_text = post_data.get('post_text', '')

        # Check if this is a reply to another comment
        if parent_comment_id:
            # This is a reply - notify the parent comment author
            try:
                parent_comment = Comment.objects.get(id=parent_comment_id)
                # Don't notify if replying to own comment
                if parent_comment.commented_by != current_user:
                    notify_comment_reply(
                        user=parent_comment.commented_by,
                        comment_id=parent_comment_id,
                        replier_name=current_user.full_name,
                        comment_text=parent_comment.comment,
                        is_anonymous=is_anonymous
                    )
            except Comment.DoesNotExist:
                pass

        # Always notify post author about new comments (unless commenting on own post)
        if post.uploaded_by.user != current_user:
            notify_new_comment_on_post(
                user=post.uploaded_by.user,
                post_id=post.pk,
                commenter_name=current_user.full_name,
                post_text=post_text,
                is_anonymous=is_anonymous
            )

        # Keep the old notification for backward compatibility
        notify_new_comment(
            user=comment.post.uploaded_by.user,
            post_id=post.pk,
            commenter_name=comment.commented_by.full_name,
            post_text=post_text[:10]
        )

        print("Comment created successfully:", comment.id)
        print("============================\n")

        return JsonResponse({
            'status': 'success',
            'comment': {
                'id': comment.id,
                'comment': comment.comment,
                'created_at': comment.created_at.isoformat(),
                'user': {
                    'full_name': comment.commented_by.full_name,
                    'profile_picture': {
                        'url': comment.commented_by.profile_picture.url
                    }
                },
                'parent_id': comment.parent_id
            }
        })

    except Exception as e:
        print("Error in handle_comment:", str(e))
        return JsonResponse({
            'status': 'error',
            'message': str(e)}
        , status=400)

@require_http_methods(["GET"])
def get_comments(request, post_id):
    try:
        # Get all comments for the post
        comments = Comment.objects.filter(post_id=post_id).order_by('created_at')
        current_user = get_current_user(request)
        # Format comments for response
        formatted_comments = []
        for comment in comments:
            reaction_data = json.loads(comment.reactions) if comment.reactions else {}
            reactions = {}
            for user_id, reaction in reaction_data.items():
                user = User.objects.get(id=user_id)
                reactions[user_id] = {
                    'reaction': reaction,
                    'reactor': user.full_name,
                    'profile_picture': {
                        'url': user.profile_picture.url
                    }
                }
            user_reaction = reactions.get(str(current_user.id))

            # Handle anonymous comments
            if comment.is_anonymous:
                commenter_name = f"Anonymous {int(comment.commented_by.id)*2}"
                commenter_profile_url = "/static/students/mailbox/images/profile.png"
            else:
                commenter_name = comment.commented_by.full_name
                commenter_profile_url = comment.commented_by.profile_picture.url

            formatted_comments.append({
                'id': comment.id,
                'post': comment.post.id,  # Add post id for reply posting
                'comment': comment.comment,
                'created_at': comment.created_at.isoformat(),
                'user': {
                    'full_name': commenter_name,
                    'profile_picture': {
                        'url': commenter_profile_url
                    }
                },
                'parent_id': comment.parent_id,
                'level': get_comment_level(comment),  # Add level information
                'user_reaction': user_reaction,
                'reactions': reactions,
                'is_anonymous': comment.is_anonymous
            })

        return JsonResponse({
            'status': 'success',
            'comments': formatted_comments
        })

    except Exception as e:
        print("Error in get_comments:", str(e))
        return JsonResponse({
            'status': 'error',
            'message': str(e)}
        , status=400)

def get_comment_level(comment):
    """Calculate the nesting level of a comment"""
    level = 0
    current = comment
    while current.parent_id is not None:
        level += 1
        current = current.parent
    return level

def get_current_username(request):
    username = request.COOKIES.get('my_user')
    if not username:
        return None
    print(username)
    return username

def get_current_user(request):
    username = get_current_username(request)
    if not username:
        return None
    try:
        return User.objects.get(username=username)
    except User.DoesNotExist:
        return None
    
def is_current_user(request, user_id):
    cookie = request.COOKIES.get('my_user')
    username = User.objects.get(id=user_id).username
    return cookie == username

@require_http_methods(["POST"])
@csrf_exempt
def react_post(request):
    try:
        data = json.loads(request.body)
        post_id = data.get('post_id')
        reaction = data.get('reaction')
        user = get_current_user(request)
        post = MailboxPost.objects.get(id=post_id)
        reactions = json.loads(post.reactions) if post.reactions else {}
        reactions[str(user.id)] = reaction
        post.reactions = json.dumps(reactions)
        post.save()
        notify_new_post_reaction(post.uploaded_by.user, post.id, user.full_name, reaction)
        notify_trending_post_by_reactions(
            user=post.uploaded_by.user,
            post_id=post.id,
            post_text=json.loads(post.post).get('post_text', '')[:10],
            reaction_count=len(reactions),
        )
        return JsonResponse({'status': 'success', 'reaction': reaction})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@require_http_methods(["POST"])
@csrf_exempt
def react_comment(request):
    try:
        data = json.loads(request.body)
        comment_id = data.get('comment_id')
        reaction = data.get('reaction')
        user = get_current_user(request)
        comment = Comment.objects.get(id=comment_id)
        reactions = json.loads(comment.reactions) if comment.reactions else {}
        reactions[str(user.id)] = reaction
        comment.reactions = json.dumps(reactions)
        comment.save()

        # Notify comment author about the reaction (unless reacting to own comment)
        if comment.commented_by != user:
            from .notifications import notify_comment_reaction
            notify_comment_reaction(
                user=comment.commented_by,
                comment_id=comment_id,
                reactor_name=user.full_name,
                reaction_type=reaction,
                comment_text=comment.comment
            )

        return JsonResponse({'status': 'success', 'reaction': reaction})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@ensure_csrf_cookie
def manage_posts(request):
    requester = Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user')))
    requester_post_count = MailboxPost.objects.filter(uploaded_by=requester).count()
    requester_pending_post_count = MailboxPost.objects.filter(uploaded_by=requester,status=MailboxPostStatus.PENDING).count()
    notifications = Notification.objects.filter(type=NotificationType.STUDENT_MAILBOX,
    user=requester.user)
    is_admin = MailboxAdmin.objects.filter(student=requester).exists()

    # Get university details for banner and description
    university_details, created = UniversityDetails.objects.get_or_create(
        name='main_university',
        defaults={
            'details': {
                'mailbox_banner_photo': '',
                'mailbox_description': 'Welcome to the Student Mailbox - your central hub for academic discussions, resource sharing, and community engagement. Connect with fellow students, share your thoughts, and stay updated with the latest campus activities. This platform is designed to foster meaningful interactions and collaborative learning among students.'
            }
        }
    )

    data = {
        'current_page': 'manage-your-posts',
        'post_count': MailboxPost.objects.all().count() if is_admin else requester_post_count,
        'pending_count': MailboxPost.objects.filter(status=MailboxPostStatus.PENDING).count() if is_admin else requester_pending_post_count,
        'requester': requester,
        'is_admin': is_admin,
        'notifications': notifications,
        'notification_count': notifications.count(),
        'university_details': university_details.details,
    }
    return render(request, 'students/mailbox/htmls/managePosts.html', context = data)

@require_GET
def manage_posts_load_more(request):
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 5))
        is_admin = bool(request.GET.get('is_admin', False))
        print(f"is admin {is_admin}\n\n\n\n\n\n================================\n\n\n\n\n")
        offset = (page - 1) * per_page
        user = get_current_user(request)
        if not user:
            return JsonResponse({'status': 'error', 'message': 'User not found (cookie missing or invalid).'}, status=401)
        # --- FIX: Robustly get Student object, handle missing Student gracefully ---
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            # If user is not a student, return empty posts (not 400)
            return JsonResponse({'status': 'success', 'posts': []})
        posts = MailboxPost.objects.filter(Q(status=MailboxPostStatus.PENDING) | Q(status=MailboxPostStatus.REJECTED) | Q(status=MailboxPostStatus.DISQUALIFIED)).order_by('-created_at')[offset:offset + per_page] if is_admin else MailboxPost.objects.filter(uploaded_by=student).order_by('-created_at')[offset:offset + per_page]
        formatted_posts = []
        for post in posts:
            post_data = json.loads(post.post)

            # Handle anonymous posts
            if post.is_anonymous:
                author_name = "Anonymous"
                profile_picture_url = "/static/students/mailbox/images/profile.png"
            else:
                author_name = post.uploaded_by.user.full_name
                profile_picture_url = post.uploaded_by.user.profile_picture.url

            formatted_posts.append({
                'id': post.id,
                'post': post_data,
                'uploaded_by': {
                    'user': {
                        'full_name': author_name,
                        'profile_picture': {
                            'url': profile_picture_url
                        }
                    }
                },
                'updated_at': post.updated_at.strftime('%B %d, %Y, %I:%M%p'),
                'status': post.status,
                'is_anonymous': post.is_anonymous
            })
        return JsonResponse({'status': 'success', 'posts': formatted_posts})
    except Exception as e:
        # Log the error for debugging
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@require_http_methods(["POST"])
@csrf_exempt
def manage_posts_delete(request, post_id):
    try:
        if not is_current_user(request, post_id):
            raise AttributeError("You do not have permission to delete this post.")
        try:
            student = Student.objects.get(User.objects.get(username=request.COOKIES.get('my_user')))
        except Student.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Student profile not found for user.'}, status=403)
        post = get_object_or_404(MailboxPost, id=post_id, uploaded_by=student)  

            
        # Load the post data from JSON
        post_data = json.loads(post.post)
        
        # Extract file paths
        post_files = post_data.get('post_files', [])
        
        # Delete each file from storage
        for file_path in post_files:
            full_file_path = os.path.join(settings.MEDIA_ROOT, file_path.replace('\\', '/'))  # Ensure correct path format
            if os.path.isfile(full_file_path):
                os.remove(full_file_path)  # Delete the file from the filesystem

        post.delete()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    


@require_http_methods(['POST'])
@csrf_exempt
def delete_post(request):
    post_id = None
    if request.method == 'POST':
        data = json.loads(request.body)
        post_id = data.get('post_id')
    try:
        requester = request.COOKIES.get('my_user')
        post = MailboxPost.objects.get(id=post_id)
        post_author = post.uploaded_by.user.username
        if requester != post_author:
            return JsonResponse({'status': 'error', 'message': 'You do not have permission to delete this post.'}, status=403)
        
        if not post:
            return JsonResponse({'status': 'error', 'message': 'Post not found.'}, status=404)
        
        post_data = json.loads(post.post)
        post_files = post_data.get('post_files', [])

        for file_path in post_files:
            full_file_path = os.path.join(settings.MEDIA_ROOT, file_path.replace('\\', '/'))
            if os.path.isfile(full_file_path):
                os.remove(full_file_path)

        post.delete()
        return JsonResponse({'status': 'success', 'message': 'Post deleted successfully.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    

@require_http_methods(["POST"])
@csrf_exempt
def manage_posts_edit(request, post_id):
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'status': 'error', 'message': 'User not found (cookie missing or invalid).'}, status=401)
        try:
            student = Student.objects.get(user=user)
        except Student.DoesNotExist:
            return JsonResponse({'status': 'error', 'message': 'Student profile not found for user.'}, status=403)
        post = get_object_or_404(MailboxPost, id=post_id, uploaded_by=student)
        if post.status != 'pending':
            return JsonResponse({'status': 'error', 'message': 'Cannot edit approved/rejected post.'}, status=403)
        post_text = request.POST.get('post_text', '')
        uploaded_files = []
        if request.FILES:
            for file in request.FILES.getlist('files'):
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{file.name}"
                file_path = os.path.join(settings.POST_MEDIA_ROOT, filename)
                with open(file_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
                relative_path = os.path.join('posts', filename)
                uploaded_files.append(relative_path)
        post_data = json.loads(post.post)
        post_data['post_text'] = post_text
        if uploaded_files:
            post_data['post_files'] = post_data.get('post_files', []) + uploaded_files
        post.post = json.dumps(post_data)
        post.updated_at = timezone.now()
        post.save()
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@csrf_exempt  # Use this only if you are sure about the security implications
@require_POST
def increment_post_view(request):
    try:
        data = json.loads(request.body)
        post_id = data.get('post_id')
        post = get_object_or_404(MailboxPost, id=post_id)
        # Parse the post JSON field
        post_data = json.loads(post.post)
        # Use 'views' as the key (not 'view')
        if 'views' in post_data:
            post_data['views'] += 1
        else:
            post_data['views'] = 1
        # Save back to the model
        post.post = json.dumps(post_data)
        post.save()
        notify_trending_post(
            user=post.uploaded_by.user,
            post_id=post.id,
            post_text=post_data.get('post_text', '')[:10],
            view_count=post_data['views']
        )

        # Notify when post reaches exactly 1001 views
        if post_data['views'] == 1001:
            from .notifications import notify_post_1001_views
            notify_post_1001_views(
                user=post.uploaded_by.user,
                post_id=post.id,
                post_text=post_data.get('post_text', '')
            )
        return JsonResponse({'success': True, 'view_count': post_data['views']})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)

@require_http_methods(["POST"])
@csrf_exempt
def report_post(request):
    try:
        data = json.loads(request.body)
        post_id = data.get('post_id')
        report_text = data.get('report_text')
        user = get_current_user(request)
        if not user:
            return JsonResponse({'status': 'error', 'message': 'User not authenticated'}, status=401)
        post = get_object_or_404(MailboxPost, id=post_id)
        # Store reports as a list of dicts in a JSONField or TextField
        MailboxReport.objects.create(
            post=post,
            reporter=Student.objects.get(user=user),
            report_text=report_text,
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        return JsonResponse({'status': 'success'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def check_mailbox_admin_status(request):
    """Check if the current user is a MailboxAdmin"""
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'is_mailbox_admin': False})

        try:
            student = Student.objects.get(user=user)
            is_mailbox_admin = MailboxAdmin.objects.filter(student=student).exists()
            return JsonResponse({'is_mailbox_admin': is_mailbox_admin})
        except Student.DoesNotExist:
            return JsonResponse({'is_mailbox_admin': False})
    except Exception as e:
        return JsonResponse({'is_mailbox_admin': False, 'error': str(e)})

@csrf_exempt
@require_http_methods(["POST"])
def approve_post(request):
    """Approve a post (MailboxAdmin only)"""
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

        # Check if user is a MailboxAdmin
        try:
            student = Student.objects.get(user=user)
            mailbox_admin = MailboxAdmin.objects.get(student=student)
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'You are not authorized to approve posts'}, status=403)

        print(request.body)
        data = json.loads(request.body)
        post_id = data.get('post_id')

        if not post_id:
            return JsonResponse({'success': False, 'error': 'Post ID is required'}, status=400)

        try:
            post = MailboxPost.objects.get(id=post_id)
            post.status = MailboxPostStatus.APPROVED
            post.approved_by = mailbox_admin
            post.approved_at = timezone.now()
            post.save()

            # Create notification for post author
            Notification.objects.create(
                user=post.uploaded_by.user,
                type=NotificationType.STUDENT_MAILBOX,
                notification=json.dumps({
                    "is_approved": True,
                    "post": post_id,
                    "text": f"Your post has been approved by an admin!",
                }),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            return JsonResponse({'success': True, 'message': 'Post approved successfully'})
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def reject_post(request):
    """Reject a post (MailboxAdmin only)"""
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

        # Check if user is a MailboxAdmin
        try:
            student = Student.objects.get(user=user)
            mailbox_admin = MailboxAdmin.objects.get(student=student)
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'You are not authorized to reject posts'}, status=403)

        data = json.loads(request.body)
        post_id = data.get('post_id')

        if not post_id:
            return JsonResponse({'success': False, 'error': 'Post ID is required'}, status=400)

        try:
            post = MailboxPost.objects.get(id=post_id)
            post.status = MailboxPostStatus.REJECTED
            post.approved_by = mailbox_admin
            post.approved_at = timezone.now()
            post.save()

            # Create notification for post author
            Notification.objects.create(
                user=post.uploaded_by.user,
                type=NotificationType.STUDENT_MAILBOX,
                notification=json.dumps({
                    "is_rejected": True,
                    "post": post_id,
                    "text": f"Your post has been rejected by an admin!",
                }),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            return JsonResponse({'success': True, 'message': 'Post rejected successfully'})
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def disqualify_post(request):
    """Disqualify a post (MailboxAdmin only)"""
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

        # Check if user is a MailboxAdmin
        try:
            student = Student.objects.get(user=user)
            mailbox_admin = MailboxAdmin.objects.get(student=student)
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'You are not authorized to disqualify posts'}, status=403)

        data = json.loads(request.body)
        post_id = data.get('post_id')

        if not post_id:
            return JsonResponse({'success': False, 'error': 'Post ID is required'}, status=400)

        try:
            post = MailboxPost.objects.get(id=post_id)
            post.status = MailboxPostStatus.DISQUALIFIED
            post.approved_by = mailbox_admin
            post.approved_at = timezone.now()
            post.save()

            # Create notification for post author
            Notification.objects.create(
                user=post.uploaded_by.user,
                type=NotificationType.STUDENT_MAILBOX,
                notification=json.dumps({
                    "is_disqualified": True,
                    "post": post_id,
                    "text": f"Your post has been disqualified by an admin!",
                }),
                created_at=timezone.now(),
                updated_at=timezone.now()
            )

            return JsonResponse({'success': True, 'message': 'Post disqualified successfully'})
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_post_reports(request):
    """Get all reports for a specific post (MailboxAdmin only)"""
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

        # Check if user is a MailboxAdmin
        try:
            student = Student.objects.get(user=user)
            MailboxAdmin.objects.get(student=student)
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'You are not authorized to view reports'}, status=403)

        post_id = request.GET.get('post_id')

        if not post_id:
            return JsonResponse({'success': False, 'error': 'Post ID is required'}, status=400)

        try:
            post = MailboxPost.objects.get(id=post_id)
            reports = MailboxReport.objects.filter(post=post).order_by('-created_at')

            formatted_reports = []
            for report in reports:
                formatted_reports.append({
                    'id': report.id,
                    'report_text': report.report_text,
                    'created_at': report.created_at.strftime('%B %d, %Y, %I:%M%p'),
                    'reporter': {
                        'full_name': report.reporter.user.full_name,
                        'profile_picture': {
                            'url': report.reporter.user.profile_picture.url
                        }
                    }
                })

            return JsonResponse({
                'success': True,
                'reports': formatted_reports,
                'total_reports': len(formatted_reports)
            })
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
def edit_post_api(request):
    print("============================\n\n\n\n\n\n\n\n\n\n\n\n\n\n")
    if request.method == 'POST':
        post_id = request.POST.get('post_id')
        text = request.POST.get('text', '')
        files = request.FILES.getlist('media')
        removed_indexes = request.POST.get('removed_indexes')
        try:
            requester = Student.objects.get(user=User .objects.get(username=request.COOKIES.get('my_user')))
            post_author = MailboxPost.objects.get(pk=post_id).uploaded_by
            if requester != post_author:
                return JsonResponse({'success': False, 'error': 'You do not have permission to edit this post.'}, status=403)
            
            post = MailboxPost.objects.get(pk=post_id)
            loaded_post = json.loads(post.post)
            post_files = loaded_post.get('post_files', [])
            
            # Remove media by indexes and delete files from storage
            if removed_indexes:
                removed = set(map(int, json.loads(removed_indexes)))
                for i in removed:
                    if i < len(post_files):  # Check if index is valid
                        file_to_remove = post_files[i]
                        # Delete the file from storage
                        if default_storage.exists(file_to_remove):
                            default_storage.delete(file_to_remove)
                        # Remove the file from the list
                        post_files[i] = None  # Mark for removal
                # Filter out None values
                post_files = [f for f in post_files if f is not None]
            
            # Add new files
            for f in files:
                filename = default_storage.save(f.name, f)
                post_files.append(filename)
            
            # Update the loaded post dictionary
            loaded_post['post_text'] = text
            loaded_post['post_files'] = post_files
            
            # Save the modified dictionary back to the post as a JSON string
            post.post = json.dumps(loaded_post)
            post.updated_at = timezone.now()
            post.save()
            return JsonResponse({'success': True})
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found or not editable'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
@require_http_methods(["GET"])
def check_admin_status(request):
    """Check if the current user is a MailboxAdmin"""
    try:
        user = User.objects.get(username=request.COOKIES.get('my_user'))
        if not user:
            return JsonResponse({'is_admin': False})

        try:
            student = Student.objects.get(user=user)
            MailboxAdmin.objects.get(student=student)
            return JsonResponse({'is_admin': True})
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            return JsonResponse({'is_admin': False})
    except Exception as e:
        return JsonResponse({'is_admin': False, 'error': str(e)})

@csrf_exempt
@require_http_methods(["GET"])
def get_university_details(request):
    """Get university details - accessible to all users"""
    try:
        print(f"get_university_details called by user: {request.COOKIES.get('my_user', 'No cookie')}")

        # Get or create university details (allow all users to view)
        university_details, created = UniversityDetails.objects.get_or_create(
            name='main_university',
            defaults={
                'details': {
                    'mailbox_banner_photo': '',
                    'mailbox_description': 'Welcome to the Student Mailbox'
                }
            }
        )

        print(f"University details found: {university_details.details}")

        return JsonResponse({
            'success': True,
            'details': university_details.details
        })
    except Exception as e:
        print(f"Error in get_university_details: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def update_university_details(request):
    """Update university details (MailboxAdmin only)"""
    try:
        user = get_current_user(request)
        if not user:
            return JsonResponse({'success': False, 'error': 'User not authenticated'}, status=401)

        # Check if user is a MailboxAdmin
        try:
            student = Student.objects.get(user=user)
            MailboxAdmin.objects.get(student=student)
        except (Student.DoesNotExist, MailboxAdmin.DoesNotExist):
            return JsonResponse({'success': False, 'error': 'You are not authorized to update university details'}, status=403)

        # Handle file upload for banner photo
        banner_photo_url = None
        if 'mailbox_banner_photo' in request.FILES:
            banner_photo = request.FILES['mailbox_banner_photo']
            # Save the file
            import os
            from django.core.files.storage import default_storage
            from django.core.files.base import ContentFile

            # Generate unique filename
            import uuid
            file_extension = os.path.splitext(banner_photo.name)[1]
            unique_filename = f"mailbox_banners/{uuid.uuid4()}{file_extension}"

            # Save file
            file_path = default_storage.save(unique_filename, ContentFile(banner_photo.read()))
            banner_photo_url = default_storage.url(file_path)

        # Get description from POST data
        mailbox_description = request.POST.get('mailbox_description', '')

        # Get or create university details
        university_details, created = UniversityDetails.objects.get_or_create(
            name='main_university',
            defaults={'details': {}}
        )

        # Update details
        if banner_photo_url:
            university_details.details['mailbox_banner_photo'] = banner_photo_url

        if mailbox_description:
            university_details.details['mailbox_description'] = mailbox_description

        university_details.save()

        return JsonResponse({
            'success': True,
            'message': 'University details updated successfully',
            'details': university_details.details
        })
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def get_non_admin_students(request):
    """Get list of students who are not MailboxAdmins for admin selection"""
    try:
        print("get_non_admin_students called")
        # Check if current user is a MailboxAdmin
        current_user = User.objects.get(username=request.COOKIES.get('my_user'))
        current_student = Student.objects.get(user=current_user)

        if not MailboxAdmin.objects.filter(student=current_student).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'You are not authorized to perform this action'
            })

        # Check current admin count
        current_admin_count = MailboxAdmin.objects.count()
        if current_admin_count >= 5:
            return JsonResponse({
                'status': 'error',
                'message': 'Maximum number of MailboxAdmins (5) already reached'
            })

        # Get search query if provided
        search_query = request.GET.get('search', '').strip()

        # Get all students who are not MailboxAdmins
        admin_student_ids = MailboxAdmin.objects.values_list('student_id', flat=True)
        non_admin_students = Student.objects.exclude(pk__in=admin_student_ids)

        # Apply search filter if provided
        if search_query:
            non_admin_students = non_admin_students.filter(
                Q(user__full_name__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(user__username__icontains=search_query)
            )

        # Format student data
        students_data = []
        students_data.extend(
            {
                'id': student.pk,
                'full_name': student.user.full_name,
                'username': student.user.username,
                'profile_picture': (
                    student.user.profile_picture.url
                    if student.user.profile_picture
                    else '/static/students/mailbox/images/profile.png'
                ),
                'student_id': student.pk,
            }
            for student in non_admin_students[:50]
        )
        return JsonResponse({
            'status': 'success',
            'students': students_data,
            'current_admin_count': current_admin_count,
            'max_admins': 5
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

@csrf_exempt
@require_http_methods(["POST"])
def add_mailbox_admin(request):
    """Add a new MailboxAdmin"""
    try:
        # Check if current user is a MailboxAdmin
        current_user = User.objects.get(username=request.COOKIES.get('my_user'))
        current_student = Student.objects.get(user=current_user)

        current_admin = MailboxAdmin.objects.filter(student=current_student).first()
        if not current_admin:
            return JsonResponse({
                'status': 'error',
                'message': 'You are not authorized to perform this action'
            })

        # Check current admin count
        current_admin_count = MailboxAdmin.objects.count()
        if current_admin_count >= 5:
            return JsonResponse({
                'status': 'error',
                'message': 'Maximum number of MailboxAdmins (5) already reached'
            })

        # Get student ID from request
        data = json.loads(request.body)
        student_id = data.get('student_id')

        if not student_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Student ID is required'
            })

        # Get the student to be made admin
        try:
            student_to_add = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Student not found'
            })

        # Check if student is already an admin
        if MailboxAdmin.objects.filter(student=student_to_add).exists():
            return JsonResponse({
                'status': 'error',
                'message': 'Student is already a MailboxAdmin'
            })

        # Create new MailboxAdmin
        new_admin = MailboxAdmin.objects.create(
            student=student_to_add,
            added_by=current_admin,
            appointed_date=timezone.now().date()
        )

        return JsonResponse({
            'status': 'success',
            'message': f'{student_to_add.user.full_name} has been added as a MailboxAdmin',
            'new_admin': {
                'id': new_admin.id,
                'student_name': student_to_add.user.full_name,
                'appointed_date': new_admin.appointed_date.strftime('%B %d, %Y')
            }
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

@csrf_exempt
@require_http_methods(["POST"])
def leave_mailbox_admin(request):
    """Allow a MailboxAdmin to leave their admin role"""
    try:
        # Check if current user is a MailboxAdmin
        current_user = User.objects.get(username=request.COOKIES.get('my_user'))
        current_student = Student.objects.get(user=current_user)

        current_admin = MailboxAdmin.objects.filter(student=current_student).first()
        if not current_admin:
            return JsonResponse({
                'status': 'error',
                'message': 'You are not currently a MailboxAdmin'
            })

        # Check if this is the last admin
        total_admins = MailboxAdmin.objects.count()
        if total_admins <= 1:
            return JsonResponse({
                'status': 'error',
                'message': 'Cannot leave admin role. At least one MailboxAdmin must remain.'
            })

        # Store admin info before deletion
        admin_name = current_student.user.full_name
        appointed_date = current_admin.appointed_date

        # Delete the MailboxAdmin record
        current_admin.delete()

        return JsonResponse({
            'status': 'success',
            'message': f'You have successfully left the MailboxAdmin role. Thank you for your service!',
            'admin_info': {
                'name': admin_name,
                'appointed_date': appointed_date.strftime('%B %d, %Y') if appointed_date else 'Unknown',
                'remaining_admins': total_admins - 1
            }
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

@csrf_exempt
@require_http_methods(["POST"])
def mark_notification_seen(request):
    """Mark a notification as seen"""
    try:
        # Get current user
        current_user = User.objects.get(username=request.COOKIES.get('my_user'))

        # Get notification ID from request
        data = json.loads(request.body)
        notification_id = data.get('notification_id')

        if not notification_id:
            return JsonResponse({
                'status': 'error',
                'message': 'Notification ID is required'
            })

        # Get the notification and verify it belongs to the current user
        try:
            notification = Notification.objects.get(
                id=notification_id,
                user=current_user
            )
        except Notification.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Notification not found or access denied'
            })

        # Mark as seen if not already seen
        if not notification.seen:
            notification.seen = True
            notification.updated_at = timezone.now()
            notification.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Notification marked as seen',
                'notification_id': notification_id
            })
        else:
            return JsonResponse({
                'status': 'success',
                'message': 'Notification was already seen',
                'notification_id': notification_id
            })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

@csrf_exempt
@require_http_methods(["POST"])
def mark_all_notifications_seen(request):
    """Mark all notifications as seen for the current user"""
    try:
        # Get current user
        current_user = User.objects.get(username=request.COOKIES.get('my_user'))

        # Mark all unseen notifications as seen
        unseen_notifications = Notification.objects.filter(
            user=current_user,
            type=NotificationType.STUDENT_MAILBOX,
            seen=False
        )

        updated_count = unseen_notifications.update(
            seen=True,
            updated_at=timezone.now()
        )

        return JsonResponse({
            'status': 'success',
            'message': f'{updated_count} notifications marked as seen',
            'updated_count': updated_count
        })

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })
