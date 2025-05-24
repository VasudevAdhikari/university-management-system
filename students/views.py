from django.shortcuts import render
from authorization.models import Student, User, MailboxPost, MailboxReport, Comment, MailboxPostStatus
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
    data = {
        'students': Student.objects.all(),
        'most_active': Student.objects.all()[0:5],
        'user': Student.objects.get(user = User.objects.get(username=request.COOKIES.get('my_user'))),
        'posts': post_details,
        'current_page': 'mailbox',
        'post_count': requester_post_count,
        'pending_count': requester_pending_post_count,
        
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
            print("\nPost Text:", post_text)
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
                uploaded_by=Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user')))
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
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Get posts with pagination
        posts = []
        if current_page == 'mailbox':
            posts = MailboxPost.objects.filter(status=MailboxPostStatus.APPROVED).order_by('-created_at')[offset:offset + per_page]
        elif current_page == 'manage-your-posts':
            print("this is manage post page")
            requester = Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user')))
            posts = MailboxPost.objects.filter(uploaded_by=requester).order_by('-created_at')[offset:offset + per_page]
        
        # Format posts for response
        formatted_posts = []
        current_user = get_current_user(request)
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
            formatted_posts.append({
                'id': post.id,
                'post': post_data,
                'uploaded_by': {
                    'user': {
                        'full_name': post.uploaded_by.user.full_name,
                        'profile_picture': {
                            'url': post.uploaded_by.user.profile_picture.url
                        }
                    }
                },
                'updated_at': post.updated_at.strftime('%B %d, %Y, %I:%M%p'),
                'user_reaction': user_reaction,
                'reactions': reactions,
                'comment_count': comment_count,
                'status': {
                    'status': post.status,
                    'status_text': post.get_status_display(),
                }
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

        print("Post ID:", post_id)
        print("Comment Text:", comment_text)
        print("Parent Comment ID:", parent_comment_id)

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
            parent_id=parent_comment_id if parent_comment_id else None
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
            formatted_comments.append({
                'id': comment.id,
                'post': comment.post.id,  # Add post id for reply posting
                'comment': comment.comment,
                'created_at': comment.created_at.isoformat(),
                'user': {
                    'full_name': comment.commented_by.full_name,
                    'profile_picture': {
                        'url': comment.commented_by.profile_picture.url
                    }
                },
                'parent_id': comment.parent_id,
                'level': get_comment_level(comment),  # Add level information
                'user_reaction': user_reaction,
                'reactions': reactions
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
        return JsonResponse({'status': 'success', 'reaction': reaction})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

@ensure_csrf_cookie
def manage_posts(request):
    requester = Student.objects.get(user=User.objects.get(username=request.COOKIES.get('my_user')))
    requester_post_count = MailboxPost.objects.filter(uploaded_by=requester).count()
    requester_pending_post_count = MailboxPost.objects.filter(uploaded_by=requester,status=MailboxPostStatus.PENDING).count()
    data = {
        'current_page': 'manage-your-posts',
        'post_count': requester_post_count,
        'pending_count': requester_pending_post_count,
        'requester': requester,
    }
    return render(request, 'students/mailbox/htmls/managePosts.html', context = data)

@require_GET
def manage_posts_load_more(request):
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 5))
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
        posts = MailboxPost.objects.filter(uploaded_by=student).order_by('-created_at')[offset:offset + per_page]
        formatted_posts = []
        for post in posts:
            post_data = json.loads(post.post)
            formatted_posts.append({
                'id': post.id,
                'post': post_data,
                'uploaded_by': {
                    'user': {
                        'full_name': post.uploaded_by.user.full_name,
                        'profile_picture': {
                            'url': post.uploaded_by.user.profile_picture.url
                        }
                    }
                },
                'updated_at': post.updated_at.strftime('%B %d, %Y, %I:%M%p'),
                'status': post.status,
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
@login_required
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
