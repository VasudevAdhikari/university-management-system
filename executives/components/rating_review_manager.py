from django.shortcuts import render, redirect

def show_rating_review(request, batch_instructor_id):
    return render(request, 'executives/rating_reviews.html')