from django.shortcuts import render, redirect

def show_rating_review(request):
    return render(request, 'executives/rating_reviews.html')