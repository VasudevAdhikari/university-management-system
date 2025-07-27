from django.urls import path, include
from . import views
from students.mailbox import views as mailbox_views

app_name = 'students'

urlpatterns = [
    path('academics/', include('students.academic_urls')),
    path('mailbox/', views.mailbox, name='mailbox'),
    path('mailbox/post/', views.handle_post, name='handle_post'),
    path('mailbox/load_more/', views.load_more_posts, name='load_more_posts'),
    path('mailbox/comment/', views.handle_comment, name='handle_comment'),
    path('mailbox/comments/<int:post_id>/', views.get_comments, name='get_comments'),
    path('mailbox/react_post/', views.react_post, name='react_post'),
    path('mailbox/react_comment/', views.react_comment, name='react_comment'),
    path('mailbox/report_post/', views.report_post, name='report_post'),
    path('manage_posts/', views.manage_posts, name='manage_posts'),
    path('manage_posts/load_more/', views.manage_posts_load_more, name='manage_posts_load_more'),
    path('manage_posts/delete/<int:post_id>/', views.manage_posts_delete, name='manage_posts_delete'),
    path('manage_posts/edit/<int:post_id>/', views.manage_posts_edit, name='manage_posts_edit'),
    path('increment_post_view/', views.increment_post_view, name='increment_post_view'),
    path('manage-posts-api/', mailbox_views.manage_posts_api, name='manage_posts_api'),
    path('delete_post/', views.delete_post, name='delete_post'),
    path('post-comments-api/', mailbox_views.post_comments_api, name='post_comments_api'),
    path('edit-post-api/', views.edit_post_api, name='edit_post_api'),
    path('delete-post-api/', mailbox_views.delete_post_api, name='delete_post_api'),
    path('mailbox/edit_post/', mailbox_views.edit_post_api, name='edit_post_api'),
    path('mailbox/delete_post/', mailbox_views.delete_post_api, name='delete_post_api'),
    path('check_mailbox_admin_status/', views.check_mailbox_admin_status, name='check_mailbox_admin_status'),
    path('approve_post/', views.approve_post, name='approve_post'),
    path('reject_post/', views.reject_post, name='reject_post'),
    path('disqualify_post/', views.disqualify_post, name='disqualify_post'),
    path('get_post_reports/', views.get_post_reports, name='get_post_reports'),
    path('check_admin_status/', views.check_admin_status, name='check_admin_status'),
    path('get_university_details/', views.get_university_details, name='get_university_details'),
    path('update_university_details/', views.update_university_details, name='update_university_details'),
    path('get_non_admin_students/', views.get_non_admin_students, name='get_non_admin_students'),
    path('add_mailbox_admin/', views.add_mailbox_admin, name='add_mailbox_admin'),
    path('leave_mailbox_admin/', views.leave_mailbox_admin, name='leave_mailbox_admin'),
    path('mark_notification_seen/', views.mark_notification_seen, name='mark_notification_seen'),
    path('mark_all_notifications_seen/', views.mark_all_notifications_seen, name='mark_all_notifications_seen'),
]