from authorization.models import User, Instructor, Admin, BaseModel
from django.db import models 

class NoticeStatus(models.TextChoices):
    UNAPPROVED = 'U', 'Unapproved'
    REJECTED = 'R', 'Rejected'
    PENDING = 'P', 'Pending'

class Notice(BaseModel):
    notice = models.JSONField(default=dict)
    # notice = {
    #     "caption": "ldakjf",
    #     "files": "alfdjadakl",
    # }
    uploaded_by = models.ForeignKey(User, default=None, null=True, blank=True, on_delete=models.CASCADE)
    handled_by = models.ForeignKey(Admin, default=None, null=True, blank=True, on_delete=models.CASCADE)
    status = models.CharField(max_length=1, default=NoticeStatus.PENDING)

