from django.contrib import admin
from .models import User, Student, Instructor, Admin, Faculty, Department, Course, Degree, UniversityDetails, MailboxPost, Comment
# Register your models here.
admin.site.register(User)
admin.site.register(Student)
admin.site.register(Instructor)
admin.site.register(Admin)
admin.site.register(Faculty)
admin.site.register(Department)
admin.site.register(Course)
admin.site.register(Degree)
admin.site.register(UniversityDetails)
admin.site.register(MailboxPost)
admin.site.register(Comment)