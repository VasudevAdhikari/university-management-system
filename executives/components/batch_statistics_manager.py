from django.shortcuts import render
from authorization.models import Student

def show_batch_statistics(request, batch_id):
    # to fix fix the students query
    students = Student.objects.all().select_related('user')
    data = {
        'students': students
    }
    return render(request, 'executives/batch_statistics.html', context=data)