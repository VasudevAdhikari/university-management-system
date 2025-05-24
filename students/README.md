# Student Mailbox

A modern, interactive Django-based social platform for students to share, discuss, and engage with academic and campus life through posts, comments, media, and reactions.

---

## Table of Contents

- [Description](#description)
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [File Structure](#file-structure)
- [Dependencies](#dependencies)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

---

## Description

**Student Mailbox** is a feature-rich, user-friendly web application designed for university and college students to connect, share posts, upload images/videos, comment, react, and collaborate in a secure and moderated environment. With a focus on usability and interactivity, Mailbox offers a seamless experience for academic and social engagement.

---

## Features

- **Post Creation**: Upload text, images, and videos (multiple media per post).
- **Media Lightbox**: Click any image/video to view in a beautiful, swipeable lightbox gallery.
- **Post Moderation**: All new posts are marked as *Pending* and only visible to the author until approved by a mailbox admin.
- **Edit & Delete**: Edit your pending posts or delete any of your posts at any time, regardless of status.
- **Reactions**: React to posts and comments with emojis (Like, Love, Care, Sad, Disgusted, etc.).
- **Comments & Replies**: Comment on posts and reply recursively to any comment or reply (threaded discussions).
- **Comment Reactions**: React to any comment or reply.
- **Infinite Scroll**: Loads 5 posts at a time as you scroll, for a smooth, modern feed experience.
- **Notifications**: Stay updated with post status and interactions.
- **Responsive Design**: Works beautifully on desktop and mobile devices.
- **Secure & Moderated**: Only approved posts are visible to others; robust permission checks.

---

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/VasudevAdhikari/university-management-system.git
   cd student-mailbox
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure your database and environment variables in `settings.py`.**

4. **Apply migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run the development server:**
   ```bash
   python manage.py runserver
   ```

---

## Configuration

- **Database**: Update your `settings.py` with your preferred database (default: SQLite, recommended: MySQL/PostgreSQL).
- **Media Storage**: Configure `MEDIA_ROOT` and `MEDIA_URL` for file uploads.
- **Email**: Set up SMTP settings for notifications (optional).
- **Environment Variables**: Use `.env` or set directly in `settings.py` for secrets and credentials.

---

## Usage

### Posting

- Click "Write Post" to create a new post.
- Enter your text and upload multiple images and/or videos.
- Submit your post. It will be marked as **Pending** and only visible to you.
- Once approved by the mailbox admin, your post becomes visible to all users.
- If rejected, you will be notified and can edit or delete your post.

### Media Lightbox

- Click any image or video in a post to open the media lightbox.
- Swipe or use arrows to navigate through all media in the post.
- Videos play inline in the lightbox; images are shown in full resolution.

### Editing & Deleting

- **Edit**: You can edit your post while it is pending. Click the edit icon on your post.
- **Delete**: You can delete any of your posts at any time, regardless of status.

### Reactions

- React to any post or comment with a variety of emojis.
- See who reacted and which emojis are most popular on each post/comment.

### Comments & Replies

- Comment on any post.
- Reply to any comment or reply, with unlimited nesting (threaded discussions).
- React to any comment or reply.

### Infinite Scroll

- The feed loads 5 posts at a time as you scroll down.
- No need to click "next page"—just keep scrolling for more content.

### Moderation

- Only mailbox admins can approve or reject posts.
- Pending posts are visible only to their authors.
- All actions are permission-checked for security.

---

## API Endpoints

| Endpoint                        | Method | Description                                 |
|----------------------------------|--------|---------------------------------------------|
| `/students/mailbox/`            | GET    | Main mailbox feed                           |
| `/students/mailbox/post/`       | POST   | Create a new post (with media)              |
| `/students/mailbox/load_more/`  | GET    | Infinite scroll: load more posts            |
| `/students/mailbox/edit_post/`  | POST   | Edit a post (pending only)                  |
| `/students/mailbox/delete_post/`| POST   | Delete a post                               |
| `/students/mailbox/react_post/` | POST   | React to a post                             |
| `/students/mailbox/comment/`    | POST   | Add a comment or reply                      |
| `/students/mailbox/comments/`   | GET    | Get comments for a post                     |
| `/students/mailbox/react_comment/`| POST | React to a comment                          |
| `/students/mailbox/report_post/`| POST   | Report a post                               |

---

## Security Features

- **CSRF Protection**: All forms and AJAX requests are CSRF-protected.
- **Authentication**: Only logged-in users can post, comment, or react.
- **Authorization**: Only post authors can edit/delete their posts.
- **Moderation**: Only admins can approve/reject posts.
- **File Validation**: Only images/videos are accepted for upload.
- **Rate Limiting**: (Optional) Can be enabled for posting/commenting.

---

## File Structure

```
students/
├── mailbox/
│   ├── templates/
│   │   └── students/mailbox/htmls/
│   │       └── managePosts.html
│   ├── static/
│   │   └── students/mailbox/
│   │       ├── styles/
│   │       │   ├── mailbox.css
│   │       │   └── managePosts.css
│   │       └── javascripts/
│   │           ├── mailbox2.js
│   │           ├── managePosts.js
│   │           └── comments.js
│   ├── views.py
│   └── ...
├── authorization/
│   ├── models.py
│   └── ...
└── manage.py
```

---

## Dependencies

- Django 5.x
- Python 3.8+
- MySQL or PostgreSQL (recommended)
- Bootstrap 5.x (for UI)
- FontAwesome (for icons)
- JavaScript (ES6+)
- [Other dependencies as listed in `requirements.txt`]

---

## Contact

For support or questions, please contact the project maintainer.

- **Name**: Moe Thiha  
- **Phone**: +959 989377380  
- **Telegram**: [@moethihaAdk](https://t.me/moethihaAdk)  
- **Facebook**: Vasudev Adhikari  
- **YouTube**: MM Logic Gallery

---

## Acknowledgments

- Django Documentation
- Bootstrap Documentation
- MySQL Documentation
- Special thanks to **GitHub Copilot** for providing assistance and suggestions throughout the development of this project.
