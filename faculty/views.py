from django.shortcuts import render
from authorization.models import BatchInstructor

# Create your views here.
def faculty_dashboard(request):

    instructor = 4 # This should be replaced with the actual instructor ID, possibly from request.user
    
    batch_instructors = (
        BatchInstructor.objects 
        .filter(instructor=instructor)
        .select_related('batch__term', 'course', 'batch__semester')
        .order_by('batch__term__year', 'batch__term__term_name')  # optional: for nicer grouping
    )

    return render(request, 'faculty/faculty_home.html', {'batch_instructors': batch_instructors})
