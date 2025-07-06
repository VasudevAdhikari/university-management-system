from urllib.parse import urlparse
import os
from authorization.models import User, Instructor

def extract_filename_from_url(url):
    """
    Extracts the filename from a given URL.
    
    Args:
        url (str): The URL containing the filename (e.g., 'http://127.0.0.1:8000/media/orange.png')
    
    Returns:
        str: The extracted filename (e.g., 'orange.png')
    """
    parsed_url = urlparse(url)
    path = parsed_url.path  # Gets '/media/orange.png'
    return os.path.basename(path)


def get_formatted_lab_members(project_leaders):
    all_project_leaders = []
    all_project_leaders.extend(
        {
            'name': project_leader.full_name,
            'img': f"/media/{project_leader.profile_picture}",
            'id': project_leader.pk,
        }
        for project_leader in project_leaders
    )
    return all_project_leaders


def get_head_of_labs_department(head_of_lab: User):
    try:
        return Instructor.objects.get(user=head_of_lab).department.name
    except Exception as e:
        return 'Not Known'
    
def get_labs(project_dict):
    projects = []
    for project in project_dict:
        pass