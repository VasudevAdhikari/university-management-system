document.addEventListener('DOMContentLoaded', function () {
    let currentPage = 1;
    const postsPerPage = 5;
    const mainContent = document.querySelector('.main-content');
    let isLoading = false;
    let allLoaded = false;

    function getStatusClass(status) {
        if (status === 'approved') return 'status-approved';
        if (status === 'pending') return 'status-pending';
        if (status === 'rejected') return 'status-rejected';
        return '';
    }

    function renderPost(post) {
        const postContainer = document.createElement('div');
        postContainer.className = 'post-container';
        postContainer.dataset.postId = post.id;
        const filesData = JSON.stringify(post.post.post_files || []);
        const statusClass = getStatusClass(post.status);
        let editAllowed = post.status === 'pending';
        postContainer.innerHTML = `
            <div class="user-profile">
                <img src="${post.uploaded_by.user.profile_picture.url}" alt="${post.uploaded_by.user.full_name}">
                <div>
                    <p>${post.uploaded_by.user.full_name}</p>
                    <span>${post.updated_at}</span>
                </div>
            </div>
            <div class="manage-post-status ${statusClass}">${post.status.charAt(0).toUpperCase() + post.status.slice(1)}</div>
            <p class="post-text">${post.post.post_text}</p>
            <div class="multi-image-gallery" data-files='${filesData}'>
                ${(post.post.post_files || []).slice(0, 3).map((file, index) => {
                    const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
                    const showOverlay = index === 2 && post.post.post_files.length > 3;
                    return `
                        <div class="gallery-img ${showOverlay ? 'gallery-img-overlay' : ''}" 
                             data-index="${index}" 
                             data-type="${isVideo ? 'video' : 'image'}"
                             data-src="/media/${file}">
                            ${isVideo ? `
                                <video class="gallery-media" controls>
                                    <source src="/media/${file}" type="video/mp4">
                                    Your browser does not support the video tag.
                                </video>
                                <div class="play-button">▶</div>
                            ` : `
                                <img class="gallery-media" src="/media/${file}" alt="Post image" loading="lazy">
                            `}
                            ${showOverlay ? `
                                <div class="gallery-overlay-text">+${post.post.post_files.length - 2}</div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="manage-post-actions">
                <button class="delete-post-btn">Delete</button>
                ${editAllowed ? `<button class="edit-post-btn">Edit</button>` : ''}
            </div>
            <div class="post-row comments" style="display: flex;">
                <hr>
                <div class="comment-thread">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
        `;
        mainContent.appendChild(postContainer);

        // Lightbox for images/videos (reuse mailbox1.js logic)
        // mailbox1.js should already handle .gallery-img click

        // Delete post
        postContainer.querySelector('.delete-post-btn').addEventListener('click', async function () {
            if (!confirm('Are you sure you want to delete this post?')) return;
            try {
                const res = await fetch(`/students/manage_posts/delete/${post.id}/`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken }
                });
                if (res.ok) {
                    postContainer.remove();
                } else {
                    alert('Failed to delete post.');
                }
            } catch (e) {
                alert('Failed to delete post.');
            }
        });

        // Edit post (if allowed)
        if (editAllowed) {
            postContainer.querySelector('.edit-post-btn').addEventListener('click', function () {
                showEditForm(postContainer, post);
            });
        }

        // Load comments (view only, no reactions/comments)
        loadCommentsForManage(postContainer, post.id);
    }

    async function loadCommentsForManage(postContainer, postId) {
        try {
            const response = await fetch(`/students/mailbox/comments/${postId}/`);
            if (!response.ok) return;
            const data = await response.json();
            if (data.status === 'success') {
                const commentThread = postContainer.querySelector('.comment-thread');
                if (!commentThread) return;
                commentThread.innerHTML = '';
                data.comments.forEach(comment => {
                    const div = document.createElement('div');
                    div.className = 'comment-row';
                    div.innerHTML = `
                        <div class="comment-avatar-col">
                            <div class="comment-avatar">
                                <img src="${comment.user.profile_picture.url}" alt="profile" />
                            </div>
                            <div class="comment-connector"></div>
                        </div>
                        <div class="comment-box" data-comment-id="${comment.id}">
                            <div class="comment-header">
                                <span class="comment-author">${comment.user.full_name}</span>
                                <span class="comment-time">${formatTimeAgo(comment.created_at)}</span>
                            </div>
                            <div class="comment-text">${comment.comment}</div>
                        </div>
                    `;
                    commentThread.appendChild(div);
                });
            }
        } catch (e) {
            // ignore
        }
    }

    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(days / 365);
        return `${years}y ago`;
    }

    async function loadMorePosts() {
        if (isLoading || allLoaded) return;
        isLoading = true;
        try {
            const response = await fetch(`/students/manage_posts/load_more/?page=${currentPage}&per_page=${postsPerPage}`, {
                method: 'GET',
                headers: { 'X-CSRFToken': csrftoken }
            });
            if (!response.ok) throw new Error();
            const data = await response.json();
            if (data.posts && data.posts.length > 0) {
                data.posts.forEach(renderPost);
                if (data.posts.length < postsPerPage) {
                    allLoaded = true;
                } else {
                    currentPage++;
                }
            } else {
                allLoaded = true;
            }
        } catch (e) {
            // ignore
        } finally {
            isLoading = false;
        }
    }

    function handleInfiniteScroll() {
        if (allLoaded) return;
        const lastPost = document.querySelector('.main-content .post-container:last-of-type');
        if (!lastPost) return;
        const rect = lastPost.getBoundingClientRect();
        if (rect.bottom < window.innerHeight + 200) {
            loadMorePosts();
        }
    }

    window.addEventListener('scroll', handleInfiniteScroll);

    // Initial load
    loadMorePosts();

    // Edit post form logic
    function showEditForm(postContainer, post) {
        // Remove existing form if any
        let existingForm = postContainer.querySelector('.edit-post-form');
        if (existingForm) existingForm.remove();

        const form = document.createElement('form');
        form.className = 'edit-post-form';
        form.innerHTML = `
            <textarea>${post.post.post_text}</textarea>
            <div class="selected-media-preview"></div>
            <input type="file" class="edit-media-input" accept="image/*,video/*" multiple>
            <button type="submit">Save</button>
            <button type="button" class="cancel-edit-btn">Cancel</button>
        `;
        postContainer.appendChild(form);

        // Preview existing media
        const preview = form.querySelector('.selected-media-preview');
        (post.post.post_files || []).forEach(file => {
            const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
            if (isVideo) {
                const video = document.createElement('video');
                video.src = `/media/${file}`;
                video.controls = true;
                preview.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = `/media/${file}`;
                preview.appendChild(img);
            }
        });

        // Cancel edit
        form.querySelector('.cancel-edit-btn').onclick = function () {
            form.remove();
        };

        // Save edit
        form.onsubmit = async function (e) {
            e.preventDefault();
            const newText = form.querySelector('textarea').value.trim();
            const filesInput = form.querySelector('.edit-media-input');
            const files = filesInput.files;
            const formData = new FormData();
            formData.append('post_text', newText);
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
            try {
                const res = await fetch(`/students/manage_posts/edit/${post.id}/`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': csrftoken },
                    body: formData
                });
                if (res.ok) {
                    // Reload the post (or reload the page)
                    window.location.reload();
                } else {
                    alert('Failed to update post.');
                }
            } catch (e) {
                alert('Failed to update post.');
            }
        };
    }
});
