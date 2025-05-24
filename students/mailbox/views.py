from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.core.paginator import Paginator
from authorization.models import MailboxPost, Comment
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt

@login_required
def manage_posts_api(request):
    page = int(request.GET.get('page', 1))
    posts = MailboxPost.objects.filter(uploader=request.user).order_by('-created_at')
    paginator = Paginator(posts, 5)
    page_obj = paginator.get_page(page)
    post_list = []
    for post in page_obj:
        # Profile image
        profile_url = post.uploader.profile.image.url if hasattr(post.uploader, 'profile') and post.uploader.profile.image else '/static/default.png'
        # Uploader name
        uploader_name = post.uploader.get_full_name() or post.uploader.username
        # Timestamp (implement get_relative_time on MailboxPost if not present)
        timestamp = post.get_relative_time() if hasattr(post, 'get_relative_time') else post.created_at.strftime('%Y-%m-%d %H:%M')
        # Status display
        status_display = post.get_status_display() if hasattr(post, 'get_status_display') else post.status
        # Media (assume related_name='media' or use post.media_set.all())
        media_qs = post.media.all() if hasattr(post, 'media') else post.media_set.all()
        media = [
            {'url': m.file.url, 'type': 'image' if hasattr(m, 'is_image') and m.is_image() else 'video'}
            for m in media_qs
        ]
        # Reactions (assume post has a related_name 'reactions' or similar)
        reactions = []
        if hasattr(post, 'reactions'):
            for r in post.reactions.all().distinct('emoji'):
                users = r.users.all() if hasattr(r, 'users') else []
                reactions.append({
                    'emoji': r.emoji,
                    'names': [u.get_full_name() or u.username for u in users[:2]],
                    'count': users.count()
                })
        # Views
        views = post.views if hasattr(post, 'views') else 0
        # Comments count
        comments_count = post.comments.count() if hasattr(post, 'comments') else post.comment_set.count()
        post_list.append({
            'id': post.id,
            'profile_url': profile_url,
            'uploader_name': uploader_name,
            'timestamp': timestamp,
            'status': post.status,
            'status_display': status_display,
            'text': post.text,
            'media': media,
            'reactions': reactions,
            'views': views,
            'comments_count': comments_count,
        })
    return JsonResponse({'posts': post_list})

@login_required
def post_comments_api(request):
    post_id = request.GET.get('post_id')
    post = MailboxPost.objects.get(pk=post_id, uploader=request.user)
    def serialize_comment(comment):
        profile_url = comment.user.profile.image.url if hasattr(comment.user, 'profile') and comment.user.profile.image else '/static/default.png'
        children = comment.children.all() if hasattr(comment, 'children') else comment.comment_set.all()
        return {
            'id': comment.id,
            'user': comment.user.get_full_name() or comment.user.username,
            'profile_url': profile_url,
            'text': comment.text,
            'children': [serialize_comment(c) for c in children]
        }
    top_level_comments = post.comments.filter(parent=None) if hasattr(post, 'comments') else post.comment_set.filter(parent=None)
    comments = [serialize_comment(c) for c in top_level_comments]
    return JsonResponse({'comments': comments})

@csrf_exempt
@login_required
def edit_post_api(request):
    if request.method == 'POST':
        post_id = request.POST.get('post_id')
        text = request.POST.get('text', '')
        files = request.FILES.getlist('media')
        removed_indexes = request.POST.get('removed_indexes')
        try:
            post = MailboxPost.objects.get(pk=post_id, uploaded_by__user=request.user, status='P')
            post_files = post.post.get('post_files', [])
            # Remove media by indexes
            if removed_indexes:
                removed = set(map(int, json.loads(removed_indexes)))
                post_files = [f for i, f in enumerate(post_files) if i not in removed]
            # Add new files
            for f in files:
                from django.core.files.storage import default_storage
                filename = default_storage.save(f.name, f)
                post_files.append(filename)
            post.post['post_text'] = text
            post.post['post_files'] = post_files
            post.save()
            return JsonResponse({'success': True})
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found or not editable'})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@csrf_exempt
@login_required
def delete_post_api(request):
    if request.method == 'POST':
        import json
        data = json.loads(request.body)
        post_id = data.get('post_id')
        try:
            post = MailboxPost.objects.get(pk=post_id, uploaded_by__user=request.user)
            post.delete()
            return JsonResponse({'success': True})
        except MailboxPost.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Post not found'})
    return JsonResponse({'success': False, 'error': 'Invalid request'})