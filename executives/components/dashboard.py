from django.shortcuts import render

def show_dashboard(request):
    return render(request, 'executives/dashboard.html')