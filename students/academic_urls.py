from django.urls import path
from .components import quiz_manager, batch_instructor_manager, assessment_manager
from django.conf import settings

urlpatterns = [
    path('quiz/<int:quiz_id>/', quiz_manager.show_quiz, name='show_quiz'),
    path('quiz_answer/<int:quiz_id>/', quiz_manager.show_quiz_answer, name='show_quiz_answer'),
    path('quiz/submit/', quiz_manager.submit_quiz, name='submit_quiz'),

    path('assessment/<int:assessment_id>/', assessment_manager.show_assessment_submission, name='show_assessment_submission'),
    path('assessment/submit/', assessment_manager.submit_assessment, name='submit_assessment'),

    path('course/<int:batch_instructor_id>/', batch_instructor_manager.show_course_details, name='show_course_details'),

    path('submitted_assessment/<int:assessment_id>/', assessment_manager.show_submitted_assessment, name='show_submitted_assessment'),
]