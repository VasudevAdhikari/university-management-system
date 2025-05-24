from django.urls import path
from . import views
from students.mailbox import views as mailbox_views

app_name = 'students'

urlpatterns = [
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
    path('edit-post-api/', mailbox_views.edit_post_api, name='edit_post_api'),
    path('delete-post-api/', mailbox_views.delete_post_api, name='delete_post_api'),
    path('mailbox/edit_post/', mailbox_views.edit_post_api, name='edit_post_api'),
    path('mailbox/delete_post/', mailbox_views.delete_post_api, name='delete_post_api'),
]