document.addEventListener('DOMContentLoaded', function () {
    // Lightbox variables
    const lightbox = document.getElementById('image-lightbox');
    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const lightboxVideo = lightbox.querySelector('.lightbox-video');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const counter = lightbox.querySelector('.lightbox-counter');

    let currentGallery = null;
    let currentIndex = 0;
    let mediaItems = []; 
 
    function pauseAllVideos(exceptVideo = null) {
        // Pause all videos in the DOM except the one passed as exceptVideo
        document.querySelectorAll('video').forEach(video => {
            if (video !== exceptVideo) {
                video.pause();
            }
        });
        // Also pause the lightbox video if it's not the exceptVideo
        if (lightboxVideo && lightboxVideo !== exceptVideo) {
            lightboxVideo.pause();
        }
    }

    function showMedia(index) {
        try {
            if (!mediaItems || !mediaItems[index]) {
                console.error('Invalid media item at index:', index);
                return;
            }

            const item = mediaItems[index];
            // Pause all other videos except the lightbox video
            pauseAllVideos(lightboxVideo);

            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'none';

            if (item.type === 'video') {
                lightboxVideo.style.display = 'block';
                const source = lightboxVideo.querySelector('source');
                source.src = item.src;
                lightboxVideo.load();
                lightboxVideo.currentTime = 0;
            } else {
                lightboxImg.style.display = 'block';
                lightboxImg.src = item.src;
            }

            counter.textContent = `${index + 1} / ${mediaItems.length}`;
        } catch (error) {
            console.error('Error showing media:', error);
        }
    }

    function nextMedia() {
        if (!mediaItems || mediaItems.length === 0) return;
        if (lightboxVideo.style.display === 'block') {
            lightboxVideo.pause();
        }
        currentIndex = (currentIndex + 1) % mediaItems.length;
        showMedia(currentIndex);
    }

    function prevMedia() {
        if (!mediaItems || mediaItems.length === 0) return;
        if (lightboxVideo.style.display === 'block') {
            lightboxVideo.pause();
        }
        currentIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
        showMedia(currentIndex);
    }

    // Lightbox event listeners
    closeBtn.addEventListener('click', () => {
        if (lightboxVideo.style.display === 'block') {
            lightboxVideo.pause();
        }
        lightbox.style.display = 'none';
    });

    prevBtn.addEventListener('click', prevMedia);
    nextBtn.addEventListener('click', nextMedia);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (lightbox.style.display === 'block') {
            if (e.key === 'ArrowLeft') prevMedia();
            if (e.key === 'ArrowRight') nextMedia();
            if (e.key === 'Escape') {
                if (lightboxVideo.style.display === 'block') {
                    lightboxVideo.pause();
                }
                lightbox.style.display = 'none';
            }
        }
    });

    // Close lightbox when clicking outside
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            if (lightboxVideo.style.display === 'block') {
                lightboxVideo.pause();
            }
            lightbox.style.display = 'none';
        }
    });

    let currentPage = 1;
    const postsPerPage = 5;
    const mainContent = document.querySelector('.main-content');
    let isLoading = false;
    let allLoaded = false;

    function renderPost(post) {
        const postContainer = document.createElement('div');
        postContainer.className = 'post-container';
        postContainer.dataset.postId = post.id || post.post.id || post.post_id;
        const filesData = JSON.stringify(post.post.post_files || []);
        // --- Determine user's reaction ---
        const userReaction = post.user_reaction;
        const distinctReactions =  (post.reactions)?[...new Set(Object.values(post.reactions).map(r => r.reaction))]:[];
        topTwoReactors = Object.values(post.reactions).slice(0,2).map(r => r.reactor);
        console.log(post.status);
        reactionEmojis = ""
        for (let i = 0; i < distinctReactions.length; i++) {
            reactionEmojis += getReactionEmoji(distinctReactions[i]);
        }
        topTwoReactorNames = ""
        for (let i=0; i < topTwoReactors.length; i++) {
            topTwoReactorNames += topTwoReactors[i]+", ";  
        }
        remainingReactorCount = Object.keys(post.reactions).length - topTwoReactors.length;
        // Add status badge and action buttons
        const statusMap = {
            'P': { text: 'Pending', class: 'status-pending' },
            'A': { text: 'Approved', class: 'status-approved' },
            'R': { text: 'Rejected', class: 'status-rejected' },
            'D': { text: 'Disqualified', class: 'status-disqualified' }
        };
        const status = statusMap[post.status.status] || { text: post.status.status, class: '' };
        postContainer.innerHTML = `
            <div class="user-profile">
                <img src="${post.uploaded_by.user.profile_picture.url}" alt="${post.uploaded_by.user.full_name}">
                <div>
                    <p>${post.uploaded_by.user.full_name}
                        <span class="post-status-badge ${status.class}">${post.status.status_text}</span>
                    </p>
                    <span>${post.updated_at}</span>
                </div>
                ${
                current_page == 'manage-your-posts'?
                `
                <div class="post-actions">
                    <button class="edit-post-btn" title="Edit Post" ${post.status.status !== 'P' ? 'disabled' : ''}>
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="delete-post-btn" title="Delete Post">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                `
                : ""
                }
            </div>
            <p class="post-text">
                ${post.post.post_text}
            </p>
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
            <div class="post-row">
                <div class="reacts">
                    ${reactionEmojis?reactionEmojis + " " + topTwoReactorNames:"No reactions yet"}${remainingReactorCount!=0?" + " + remainingReactorCount+" others": ""}
                </div>
                <div class="react-details">
                    ${post.post.views?post.post.views:0} views &nbsp;&nbsp; ${post.comment_count} comments
                </div>
            </div>
            ${current_page=='mailbox'?
                `<div class="post-row">
                    <div class="reaction-picker">
                        <span class="reaction" value="Like">👍</span>
                        <span class="reaction" value="Love">❤️</span>
                        <span class="reaction" value="Care">🤗</span>
                        <span class="reaction" value="Sad">😢</span>
                        <span class="reaction" value="Disgusted">🤮</span>
                    </div>
                </div>
                `: ``
            }
            <hr>
            <div class="post-row">
                ${
                current_page == 'mailbox' ?
                `
                <div class="img-parent">
                    <span class="to-react">${userReaction ? getReactionEmoji(userReaction.reaction) : '👍'}</span>${userReaction ? userReaction.reaction : 'React'}
                    <div class="reaction-picker">
                        <span class="reaction" value="Like">👍</span>
                        <span class="reaction" value="Love">❤️</span>
                        <span class="reaction" value="Care">🤗</span>
                        <span class="reaction" value="Sad">😢</span>
                        <span class="reaction" value="Disgusted">🤮</span>
                    </div>
                </div>
                `:""
                }
                <div class="comment-button">
                    <img src="${STATIC_URLS.commentsImage}">Comment
                </div>
                ${current_page == 'mailbox' ?
                `
                <div class"report-img">
                    <img src="${STATIC_URLS.shareImage}">Report
                </div>
                `:""
                }
            </div>
            <div class="post-row comments" style="display: none;">
                ${current_page == 'mailbox' ?
                `
                <div class="comment-input">
                    <textarea placeholder="Write a comment"></textarea>
                </div>
                <div class="comment-buttons">
                    <button class="comment-btn">Comment</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
                `:""
                }
                
                <hr>
                <div class="comment-thread">
                    <!-- Comments will be loaded here -->
                </div>
            </div>
        `;
        mainContent.appendChild(postContainer);
        initializePostEvents(postContainer);
        if (window.MailboxComments) {
            window.MailboxComments.initializeCommentFunctionality(postContainer);
            window.MailboxComments.loadComments(postContainer);
        }
        // --- Truncate post text to 50 chars with show more/less ---
        truncatePostText50(postContainer);

        // --- Reaction Lightbox trigger ---
        const reactsDiv = postContainer.querySelector('.reacts');
        if (reactsDiv) {
            reactsDiv.style.cursor = "pointer";
            reactsDiv.addEventListener('click', function() {
                openReactionLightbox(post.reactions);
            });
        }

        if (current_page == 'mailbox') {
            // --- Report Popup trigger (fix) ---
            const reportBtn = postContainer.querySelector('img[src="/static/students/mailbox/images/share.png"]');
            if (reportBtn) {
                reportBtn.style.cursor = "pointer";
                // Only trigger popup when clicking the report icon itself
                const reportIcon = reportBtn;
                if (reportIcon) {
                    reportIcon.style.cursor = "pointer";
                    reportIcon.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const popup = document.getElementById('report-popup');
                        if (popup) {
                            popup.style.display = 'flex';
                            popup.classList.add('active');
                        }
                        openReportPopup(post.id);
                    });
                }
            }
        

            // --- Reinitialize view tracking for this post ---
            if (window.trackPostViews) {
                window.trackPostViews();
            }
        }

        // Add event listeners for edit/delete
        const editBtn = postContainer.querySelector('.edit-post-btn');
        const deleteBtn = postContainer.querySelector('.delete-post-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                openEditPostPopup(post);
            });
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this post?')) {
                    fetch(`/students/delete_post/`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({ post_id: post.id || post.post.id || post.post_id })
                    }).then(res => res.json()).then(data => {
                        if (data.success) {
                            postContainer.remove();
                        } else {
                            console.error(`status: ${data.status}, message: ${data.message}`);
                            alert('Failed to delete post.');
                        }
                    });
                }
            });
        }
    }

    // --- Reaction Lightbox logic ---
    function openReactionLightbox(reactions) {
        const lightbox = document.getElementById('reaction-lightbox');
        const closeBtn = lightbox.querySelector('.reaction-lightbox-close');
        const listDiv = lightbox.querySelector('.reaction-list');
        listDiv.innerHTML = '';

        // --- Style the lightbox for overlay, background, border radius, shadow, scroll ---
        lightbox.style.position = 'fixed';
        lightbox.style.top = '0';
        lightbox.style.left = '0';
        lightbox.style.width = '100vw';
        lightbox.style.height = '100vh';
        lightbox.style.background = 'rgba(255,255,255,0.96)';
        lightbox.style.zIndex = '99999';
        lightbox.style.display = 'flex';
        lightbox.style.alignItems = 'center';
        lightbox.style.justifyContent = 'center';

        const content = lightbox.querySelector('.reaction-lightbox-content');
        if (content) {
            content.style.background = '#fff';
            content.style.borderRadius = '18px';
            content.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)';
            content.style.padding = '32px 24px 24px 24px';
            content.style.maxWidth = '400px';
            content.style.width = '90vw';
            content.style.maxHeight = '70vh';
            content.style.overflow = 'hidden';
            content.style.position = 'relative';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
        }
        if (listDiv) {
            listDiv.style.overflowY = 'auto';
            listDiv.style.maxHeight = '40vh';
            listDiv.style.marginTop = '16px';
        }
        if (closeBtn) {
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '12px';
            closeBtn.style.right = '18px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.fontSize = '2em';
            closeBtn.style.color = '#888';
        }

        // reactions: { user_id: {reaction, reactor, profile_picture:{url}} }
        if (reactions && Object.keys(reactions).length > 0) {
            Object.values(reactions).forEach(r => {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.marginBottom = '10px';
                row.innerHTML = `
                    <img src="${r.profile_picture.url}" alt="profile" style="width:32px;height:32px;border-radius:50%;margin-right:10px;">
                    <span style="font-weight:bold;margin-right:10px;">${r.reactor}</span>
                    <span style="font-size:1.5em;">${getReactionEmoji(r.reaction)}</span>
                `;
                listDiv.appendChild(row);
            });
        } else {
            listDiv.innerHTML = '<div>No reactions yet.</div>';
        }

        // Show the lightbox
        lightbox.style.display = 'flex';

        // Close logic
        closeBtn.onclick = function() {
            lightbox.style.display = 'none';
        };
        lightbox.onclick = function(e) {
            if (e.target === lightbox) lightbox.style.display = 'none';
        };
    }

    // --- Report Popup logic ---
    function openReportPopup(postId) {
        const popup = document.getElementById('report-popup');
        popup.style.display = 'flex';
        popup.classList.add('active');
        const textarea = popup.querySelector('textarea');
        textarea.value = '';
        textarea.focus();

        // Remove previous listeners to avoid duplicates
        const submitBtn = popup.querySelector('.report-submit-btn');
        const cancelBtn = popup.querySelector('.report-cancel-btn');
        const newSubmitBtn = submitBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newSubmitBtn.onclick = async function() {
            const text = textarea.value.trim();
            if (!text) {
                alert('Please enter report details before submitting.');
                return;
            }
            try {
                const res = await fetch('/students/mailbox/report_post/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify({ post_id: postId, report_text: text })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    alert('Report submitted successfully.');
                    popup.style.display = 'none';
                    popup.classList.remove('active');
                } else {
                    alert(data.message || 'Failed to submit report.');
                }
            } catch (e) {
                alert('Failed to submit report.');
            }
        };
        newCancelBtn.onclick = function() {
            popup.style.display = 'none';
            popup.classList.remove('active');
        };
        // Close popup when clicking outside
        popup.onclick = function(e) {
            if (e.target === popup) {
                popup.style.display = 'none';
                popup.classList.remove('active');
            }
        };
    }

    function getReactionEmoji(reaction) {
        switch (reaction) {
            case 'Like': return '👍';
            case 'Love': return '❤️';
            case 'Care': return '🤗';
            case 'Sad': return '😢';
            case 'Disgusted': return '🤮';
            default: return '👍';
        }
    }

    async function loadMorePosts() {
        if (isLoading || allLoaded) return;
        isLoading = true;
        try {
            const response = await fetch(`/students/mailbox/load_more/?page=${currentPage}&per_page=${postsPerPage}&current_page=${current_page}`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': csrftoken
                }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
        } catch (error) {
            console.error('Error loading posts:', error);
            alert('Error loading posts. Please try again.');
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

    // Function to initialize all event listeners for a post container
    function initializePostEvents(postContainer) {
        // Initialize lightbox for gallery images
        postContainer.querySelectorAll('.gallery-img').forEach(item => {
            item.addEventListener('click', function () {
                const gallery = this.closest('.multi-image-gallery');
                currentGallery = gallery;

                // Pause any playing videos in the gallery
                gallery.querySelectorAll('video').forEach(video => {
                    video.pause();
                    video.currentTime = 0;
                    video.muted = true;
                    video.volume = 0;
                });

                try {
                    const filesStr = gallery.dataset.files;
                    if (!filesStr) {
                        console.error('No files data found in gallery');
                        return;
                    }

                    let allFiles;
                    try {
                        allFiles = JSON.parse(filesStr);
                    } catch (parseError) {
                        console.error('Error parsing files data:', parseError);
                        return;
                    }

                    if (!Array.isArray(allFiles) || allFiles.length === 0) {
                        console.error('No files found in gallery data');
                        return;
                    }

                    mediaItems = allFiles.map(file => {
                        const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
                        return {
                            src: `/media/${file}`,
                            type: isVideo ? 'video' : 'image'
                        };
                    });

                    currentIndex = parseInt(this.dataset.index);

                    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= mediaItems.length) {
                        console.error('Invalid index:', currentIndex);
                        return;
                    }

                    showMedia(currentIndex);
                    lightbox.style.display = 'block';
                } catch (error) {
                    console.error('Error opening lightbox:', error);
                }
            });
        });

        if (current_page == 'mailbox') {
            // Initialize reaction picker
            postContainer.querySelectorAll('.to-react').forEach(element => {
                let pressTimer = null;

                function startPressTimer() {
                    if (pressTimer === null) {
                        pressTimer = setTimeout(() => {
                            let parent = element.closest('.img-parent');
                            let reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
                            if (!reactionPicker) {
                                parent = element.closest('.post-container');
                                reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
                            }
                            if (!reactionPicker) return;
                            reactionPicker.style.display = 'block';

                            reactionPicker.addEventListener('mouseleave', () => {
                                reactionPicker.style.display = 'none';
                            });

                            reactionPicker.querySelectorAll('.reaction').forEach(reaction => {
                                reaction.addEventListener('click', async () => {
                                    reactionPicker.style.display = 'none';
                                    // Update only the .to-react span and label, not the whole .img-parent
                                    element.textContent = reaction.textContent;
                                    // Update the label after the emoji
                                    if (element.nextSibling && element.nextSibling.nodeType === Node.TEXT_NODE) {
                                        element.nextSibling.textContent = reaction.getAttribute("value");
                                    }
                                    // Save reaction to backend for post
                                    let postCont = element.closest('.post-container');
                                    let postId = postCont ? postCont.dataset.postId : null;
                                    if (postId) {
                                        try {
                                            await fetch('/students/mailbox/react_post/', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-CSRFToken': csrftoken
                                                },
                                                body: JSON.stringify({
                                                    post_id: postId,
                                                    reaction: reaction.getAttribute('value')
                                                })
                                            });
                                            // Optionally: reload reactions UI, or reload post
                                        } catch (err) {
                                            alert('Failed to save reaction. Please try again.');
                                        }
                                    }
                                });
                            });

                            pressTimer = null;
                        }, 300);
                    }
                }

                function cancelPressTimer() {
                    if (pressTimer !== null) {
                        let parent = element.closest('.img-parent');
                        let reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
                        if (!reactionPicker) {
                            parent = element.closest('.post-container');
                            reactionPicker = parent ? parent.querySelector('.reaction-picker') : null;
                        }
                        if (reactionPicker) reactionPicker.style.display = 'none';
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                }

                element.addEventListener('mousedown', startPressTimer);
                element.addEventListener('mouseup', cancelPressTimer);
                element.addEventListener('mouseleave', cancelPressTimer);
            });
        

            // Initialize report functionality
            const reportButton = postContainer.querySelector('.post-row div:last-child');
            if (reportButton) {
                reportButton.addEventListener('click', function() {
                    const reportPopup = document.getElementById('report-popup');
                    if (reportPopup) {
                        // Show the popup
                        reportPopup.style.display = 'flex';
                        reportPopup.classList.add('active');
                        
                        const reportTextarea = reportPopup.querySelector('textarea');
                        reportTextarea.value = '';

                        // Add event listeners for the report popup buttons
                        const submitBtn = reportPopup.querySelector('.report-submit-btn');
                        const cancelBtn = reportPopup.querySelector('.report-cancel-btn');

                        // Remove any existing event listeners
                        const newSubmitBtn = submitBtn.cloneNode(true);
                        const newCancelBtn = cancelBtn.cloneNode(true);
                        submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
                        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

                        // Add new event listeners
                        newSubmitBtn.addEventListener('click', function() {
                            const reportText = reportTextarea.value.trim();
                            if (reportText) {
                                // Here you can add the logic to submit the report
                                // console.log('Report submitted:', reportText);
                                reportPopup.style.display = 'none';
                                reportPopup.classList.remove('active');
                            }
                        });

                        newCancelBtn.addEventListener('click', function() {
                            reportPopup.style.display = 'none';
                            reportPopup.classList.remove('active');
                        });

                        // Close popup when clicking outside
                        const closePopup = function(event) {
                            if (event.target === reportPopup) {
                                reportPopup.style.display = 'none';
                                reportPopup.classList.remove('active');
                                window.removeEventListener('click', closePopup);
                            }
                        };
                        window.addEventListener('click', closePopup);
                    }
                });
            }

            // Initialize reply functionality
            postContainer.querySelectorAll('.comment-reply').forEach(replyLink => {
                replyLink.addEventListener('click', function (e) {
                    e.preventDefault();
                    const replyPopup = document.getElementById('reply-popup');
                    replyPopup.classList.add('active');
                    const replyTextarea = replyPopup.querySelector('textarea');
                    replyTextarea.value = '';
                });
            });
        }

        // Hide/show play icon on gallery video play/pause
        postContainer.querySelectorAll('.gallery-img video.gallery-media').forEach(video => {
            const playButton = video.parentElement.querySelector('.play-button');
            if (playButton) {
                video.addEventListener('play', function() {
                    // Pause all other videos except this one
                    pauseAllVideos(video);
                    playButton.style.display = 'none';
                });
                video.addEventListener('pause', function() {
                    playButton.style.display = '';
                });
            } else {
                // Still pause all other videos on play
                video.addEventListener('play', function() {
                    pauseAllVideos(video);
                });
            }
        });

        // Pause all other videos when lightbox video is played
        if (lightboxVideo) {
            lightboxVideo.addEventListener('play', function() {
                pauseAllVideos(lightboxVideo);
            });
        }
    }

    // Post creation functionality
    const postInput = document.getElementById('post-input-text');
    const postButtons = document.querySelector('.post-buttons');
    const postSubmitBtn = document.getElementById('post-submit-btn');
    const postCancelBtn = document.querySelector('.post-cancel-btn');
    const selectedMediaPreview = document.querySelector('.selected-media-preview');

    if (postInput) {
        postInput.addEventListener('input', function() {
            postButtons.style.display = this.value.trim() || selectedMediaPreview.children.length > 0 ? 'flex' : 'none';
        });
    }

    // Add a circular progress bar overlay to the write-post-container (not global)
    function ensureUploadProgressBarOverlay() {
        let container = document.querySelector('.write-post-container');
        if (!container) return;
        if (container.querySelector('#upload-progress-bar')) return;
        const bar = document.createElement('div');
        bar.id = 'upload-progress-bar';
        bar.style.position = 'absolute';
        bar.style.top = '0';
        bar.style.left = '0';
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.display = 'none';
        bar.style.background = 'rgba(255,255,255,0.7)';
        bar.style.zIndex = '10';
        bar.style.justifyContent = 'center';
        bar.style.alignItems = 'center';
        bar.style.transition = 'opacity 0.2s';
        bar.style.pointerEvents = 'none';
        bar.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;">
                <svg width="60" height="60" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" stroke="#eee" stroke-width="4" fill="none"/>
                    <circle id="upload-progress-circle" cx="20" cy="20" r="18" stroke="#1876f2" stroke-width="4" fill="none"
                        stroke-dasharray="113.097" stroke-dashoffset="113.097" style="transition:stroke-dashoffset 0.2s;"/>
                </svg>
                <span id="upload-progress-text" style="margin-top:8px;font-weight:bold;">0%</span>
                <span style="font-size:12px;color:#555;">Uploading...</span>
            </div>
        `;
        bar.style.position = 'absolute';
        bar.style.top = '0';
        bar.style.left = '0';
        bar.style.width = '100%';
        bar.style.height = '100%';
        bar.style.display = 'none';
        container.style.position = 'relative';
        container.appendChild(bar);
    }
    ensureUploadProgressBarOverlay();

    function showUploadProgressBar(percent) {
        const container = document.querySelector('.write-post-container');
        const bar = container ? container.querySelector('#upload-progress-bar') : null;
        const circle = bar ? bar.querySelector('#upload-progress-circle') : null;
        const text = bar ? bar.querySelector('#upload-progress-text') : null;
        if (bar && circle && text) {
            bar.style.display = 'flex';
            // Fade the write-post-container except the overlay
            container.style.opacity = '0.5';
            bar.style.pointerEvents = 'auto';
            // Circle circumference = 2 * PI * r = ~113.097
            const offset = 113.097 - (113.097 * percent / 100);
            circle.setAttribute('stroke-dashoffset', offset);
            text.textContent = `${Math.round(percent)}%`;
        }
    }
    function hideUploadProgressBar() {
        const container = document.querySelector('.write-post-container');
        const bar = container ? container.querySelector('#upload-progress-bar') : null;
        if (bar) bar.style.display = 'none';
        if (container) container.style.opacity = '1';
        if (bar) bar.style.pointerEvents = 'none';
    }

    if (postSubmitBtn) {
        postSubmitBtn.addEventListener('click', async function() {
            const postText = postInput.value.trim();
            if (!postText && selectedMediaPreview.children.length === 0) return;

            // --- Hide controls and disable input during upload ---
            const writePostContainer = document.querySelector('.write-post-container');
            const videoIcon = writePostContainer.querySelector('.video-upload');
            const photoIcon = writePostContainer.querySelector('.photo-upload');
            postSubmitBtn.style.display = 'none';
            if (videoIcon) videoIcon.style.display = 'none';
            if (photoIcon) photoIcon.style.display = 'none';
            postCancelBtn.style.display = 'none';
            postInput.disabled = true;

            try {
                const formData = new FormData();
                formData.append('post_text', postText);
                
                // Get all file inputs
                const fileInputs = document.querySelectorAll('.post-input-container input[type="file"]');
                
                // Add files from each input
                fileInputs.forEach(input => {
                    if (input.files.length > 0) {
                        Array.from(input.files).forEach(file => {
                            formData.append('files', file);
                        });
                    }
                });

                // --- Show progress bar before upload ---
                showUploadProgressBar(0);

                // Use XMLHttpRequest for progress events
                await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/students/mailbox/post/', true);
                    xhr.setRequestHeader('X-CSRFToken', csrftoken);

                    xhr.upload.onprogress = function(e) {
                        if (e.lengthComputable) {
                            const percent = (e.loaded / e.total) * 100;
                            showUploadProgressBar(percent);
                        }
                    };
                    xhr.onload = function() {
                        hideUploadProgressBar();
                        // Restore controls
                        if (videoIcon) videoIcon.style.display = '';
                        if (photoIcon) photoIcon.style.display = '';
                        postSubmitBtn.style.display = '';
                        postCancelBtn.style.display = '';
                        postInput.disabled = false;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                if (data.status === 'success') {
                                    alert('Post uploaded successfully!');
                                    // Clear the input and media preview
                                    postInput.value = '';
                                    selectedMediaPreview.innerHTML = '';
                                    postButtons.style.display = 'none';
                                    // Clear file inputs
                                    fileInputs.forEach(input => { input.value = ''; });
                                    // Reload the page to show the new post
                                    window.location.reload();
                                    resolve();
                                } else {
                                    alert(data.message || 'Failed to create post');
                                    reject();
                                }
                            } catch (err) {
                                alert('Error parsing server response.');
                                reject();
                            }
                        } else {
                            alert('Error creating post. Please try again.');
                            reject();
                        }
                    };
                    xhr.onerror = function() {
                        hideUploadProgressBar();
                        // Restore controls
                        if (videoIcon) videoIcon.style.display = '';
                        if (photoIcon) photoIcon.style.display = '';
                        postSubmitBtn.style.display = '';
                        postCancelBtn.style.display = '';
                        postInput.disabled = false;
                        alert('Error creating post. Please try again.');
                        reject();
                    };
                    xhr.send(formData);
                });
            } catch (error) {
                hideUploadProgressBar();
                // Restore controls
                const writePostContainer = document.querySelector('.write-post-container');
                const videoIcon = writePostContainer.querySelector('.video-upload');
                const photoIcon = writePostContainer.querySelector('.photo-upload');
                if (videoIcon) videoIcon.style.display = '';
                if (photoIcon) photoIcon.style.display = '';
                postSubmitBtn.style.display = '';
                postCancelBtn.style.display = '';
                postInput.disabled = false;
                console.error('Error creating post:', error);
                alert('Error creating post. Please try again.');
            }
        });
    }

    if (postCancelBtn) {
        postCancelBtn.addEventListener('click', function() {
            postInput.value = '';
            selectedMediaPreview.innerHTML = '';
            postButtons.style.display = 'none'; 
        });
    }

    // Fix: Only add event listeners if the element exists
    // Close/cancel edit-lightbox
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    if (editCancelBtn) {
        editCancelBtn.onclick = function(e) {
            e.preventDefault();
            const lightbox = document.getElementById('edit-lightbox');
            lightbox.style.display = 'none';
            lightbox.classList.remove('active');
        };
    }
    const editLightboxClose = document.getElementById('edit-lightbox-close');
    if (editLightboxClose) {
        editLightboxClose.onclick = function(e) {
            e.preventDefault();
            const lightbox = document.getElementById('edit-lightbox');
            lightbox.style.display = 'none';
            lightbox.classList.remove('active');
        };
    }

    // If you have edit-photo-input and edit-video-input, check before adding listeners
    const editPhotoInput = document.getElementById('edit-photo-input');
    if (editPhotoInput) {
        editPhotoInput.addEventListener('change', function() {
            updateEditMediaPreview();
        });
    }
    const editVideoInput = document.getElementById('edit-video-input');
    if (editVideoInput) {
        editVideoInput.addEventListener('change', function() {
            updateEditMediaPreview();
        });
    }
});

// Add this function at the end of the file or before renderPost
function truncatePostText50(container) {
    const postText = container.querySelector('.post-text');
    if (!postText) return;
    const fullText = postText.innerHTML;
    // Use plain text length for truncation logic
    let div = document.createElement('div');
    div.innerHTML = fullText;
    let plain = div.textContent || div.innerText || '';
    if (plain.length <= 50) return; // Do not show "show more" if <= 50 chars
    function getTruncated(text) {
        let truncated = plain.slice(0, 50);
        return truncated + '... <span class="show-more-post" style="color:#1876f2;cursor:pointer;">show more</span>';
    }
    function setTruncated() {
        postText.innerHTML = getTruncated(fullText);
        postText.querySelector('.show-more-post').onclick = function() {
            setExpanded();
        };
    }
    function setExpanded() {
        postText.innerHTML = fullText + ' <span class="show-less-post" style="color:#1876f2;cursor:pointer;">show less</span>';
        postText.querySelector('.show-less-post').onclick = function() {
            setTruncated();
        };
    }
    setTruncated();
}

// --- Remove import, use global function if available ---
if (window.trackPostViews) {
    window.trackPostViews();
}

// Edit Post Popup logic
function openEditPostPopup(post) {
    let popup = document.getElementById('edit-post-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'edit-post-popup';
        popup.className = 'edit-post-popup';
        popup.innerHTML = `
            <div class="edit-post-popup-content">
                <span class="edit-post-popup-close">&times;</span>
                <form id="edit-post-form">
                    <textarea id="edit-post-text" maxlength="1000"></textarea>
                    <div id="edit-media-preview"></div>
                    <input type="file" id="edit-media-input" multiple accept="image/*,video/*">
                    <button type="submit">Save Changes</button>
                </form>
            </div>
        `;
        document.body.appendChild(popup);
    }
    popup.style.display = 'flex';
    popup.classList.add('active');
    // Fill form with current post data
    const textarea = popup.querySelector('#edit-post-text');
    textarea.value = post.post.post_text;
    const mediaPreview = popup.querySelector('#edit-media-preview');
    mediaPreview.innerHTML = (post.post.post_files || []).map(file => {
        const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
        return isVideo
            ? `<video src="/media/${file}" controls style="width:60px;height:60px;border-radius:8px;margin:4px;"></video>`
            : `<img src="/media/${file}" style="width:60px;height:60px;border-radius:8px;margin:4px;">`;
    }).join('');
    // Remove popup on close
    popup.querySelector('.edit-post-popup-close').onclick = function() {
        popup.style.display = 'none';
        popup.classList.remove('active');
    };
    // Handle form submit
    popup.querySelector('#edit-post-form').onsubmit = function(e) {
        e.preventDefault();
        const newText = textarea.value.trim();
        const files = popup.querySelector('#edit-media-input').files;
        const formData = new FormData();
        formData.append('post_id', post.id || post.post.id || post.post_id);
        formData.append('text', newText);
        for (let i = 0; i < files.length; i++) {
            formData.append('media', files[i]);
        }
        fetch(`/students/mailbox/edit_post/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            body: formData
        }).then(res => res.json()).then(data => {
            if (data.success) {
                popup.style.display = 'none';
                popup.classList.remove('active');
                window.location.reload();
            } else {
                alert('Failed to update post.');
            }
        });
    };
}

// Open edit-lightbox and populate with post data
function openEditLightbox(post) {
    const lightbox = document.getElementById('edit-lightbox');
    const textArea = document.getElementById('edit-post-text');
    const preview = document.getElementById('edit-selected-media-preview');
    textArea.value = post.post.post_text;
    preview.innerHTML = '';
    (post.post.post_files || []).forEach(file => {
        const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
        if (isVideo) {
            preview.innerHTML += `<video src="/media/${file}" controls></video>`;
        } else {
            preview.innerHTML += `<img src="/media/${file}" />`;
        }
    });
    lightbox.style.display = 'flex';
    lightbox.classList.add('active');
    // Store post id for submit
    lightbox.dataset.postId = post.id || post.post.id || post.post_id;
}

// Close/cancel edit-lightbox
const editCancelBtn = document.getElementById('edit-cancel-btn');
if (editCancelBtn) {
    editCancelBtn.onclick = function(e) {
        e.preventDefault();
        const lightbox = document.getElementById('edit-lightbox');
        lightbox.style.display = 'none';
        lightbox.classList.remove('active');
    };
}
const editLightboxClose = document.getElementById('edit-lightbox-close');
if (editLightboxClose) {
    editLightboxClose.onclick = function(e) {
        e.preventDefault();
        const lightbox = document.getElementById('edit-lightbox');
        lightbox.style.display = 'none';
        lightbox.classList.remove('active');
    };
}

// Handle media file input and preview for edit
// document.getElementById('edit-photo-input').addEventListener('change', function() {
//     updateEditMediaPreview();
// });
document.getElementById('edit-video-input').addEventListener('change', function() {
    updateEditMediaPreview();
});
function updateEditMediaPreview() {
    const preview = document.getElementById('edit-selected-media-preview');
    preview.innerHTML = ''; 
    const photoFiles = document.getElementById('edit-photo-input').files;
    const videoFiles = document.getElementById('edit-video-input').files;
    for (let file of photoFiles) {
        const url = URL.createObjectURL(file);
        preview.innerHTML += `<img src="${url}" />`;
    }
    for (let file of videoFiles) {
        const url = URL.createObjectURL(file);
        preview.innerHTML += `<video src="${url}" controls></video>`;
    }
}

// Submit edit form
document.getElementById('edit-post-form').onsubmit = function(e) {
    e.preventDefault();
    const lightbox = document.getElementById('edit-lightbox');
    const postId = lightbox.dataset.postId;
    const text = document.getElementById('edit-post-text').value.trim();
    const photoFiles = document.getElementById('edit-photo-input').files;
    const videoFiles = document.getElementById('edit-video-input').files;
    const formData = new FormData();
    formData.append('post_id', postId);
    formData.append('text', text);
    for (let file of photoFiles) formData.append('media', file);
    for (let file of videoFiles) formData.append('media', file);
    fetch('/students/mailbox/edit_post/', {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        body: formData
    }).then(res => res.json()).then(data => {
        if (data.success) {
            lightbox.style.display = 'none';
            lightbox.classList.remove('active');
            window.location.reload();
        } else {
            alert('Failed to update post.');
        }
    });
};

// To trigger edit-lightbox from post actions, call openEditLightbox(post) with the post data

// --- Edit-lightbox logic with media delete and add ---
let editMediaState = {
    existing: [], // {file, isVideo}
    newFiles: [], // File objects
    removedIndexes: [] // indexes of removed existing media
};

function openEditLightbox(post) {
    const lightbox = document.getElementById('edit-lightbox');
    const textArea = document.getElementById('edit-post-text');
    const preview = document.getElementById('edit-selected-media-preview');
    const mediaInput = document.getElementById('edit-media-input');
    editMediaState = { existing: [], newFiles: [], removedIndexes: [] };

    textArea.value = post.post.post_text;
    preview.innerHTML = '';

    // Populate existing media
    (post.post.post_files || []).forEach((file, idx) => {
        const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
        editMediaState.existing.push({ file, isVideo });
    });
    renderEditMediaPreview();

    // Reset file input
    mediaInput.value = '';
    editMediaState.newFiles = [];

    lightbox.style.display = 'flex';
    lightbox.classList.add('active');
    lightbox.dataset.postId = post.id || post.post.id || post.post_id;
}

function renderEditMediaPreview() {
    const preview = document.getElementById('edit-selected-media-preview');
    preview.innerHTML = '';
    // Existing media
    editMediaState.existing.forEach((media, idx) => {
        if (editMediaState.removedIndexes.includes(idx)) return;
        preview.innerHTML += `
            <div class="media-thumb" data-type="existing" data-idx="${idx}">
                ${media.isVideo
                    ? `<video src="/media/${media.file}" controls></video>`
                    : `<img src="/media/${media.file}" />`
                }
                <button type="button" class="delete-media-btn" title="Remove"><i class="fa fa-times"></i></button>
            </div>
        `;
    });
    // New files
    editMediaState.newFiles.forEach((file, idx) => {
        const isVideo = file.type.startsWith('video');
        const url = URL.createObjectURL(file);
        preview.innerHTML += `
            <div class="media-thumb" data-type="new" data-idx="${idx}">
                ${isVideo
                    ? `<video src="${url}" controls></video>`
                    : `<img src="${url}" />`
                }
                <button type="button" class="delete-media-btn" title="Remove"><i class="fa fa-times"></i></button>
            </div>
        `;
    });
}

// Handle delete click for media
document.getElementById('edit-selected-media-preview').addEventListener('click', function(e) {
    if (e.target.closest('.delete-media-btn')) {
        const thumb = e.target.closest('.media-thumb');
        const type = thumb.getAttribute('data-type');
        const idx = parseInt(thumb.getAttribute('data-idx'));
        if (type === 'existing') {
            editMediaState.removedIndexes.push(idx);
        } else if (type === 'new') {
            editMediaState.newFiles.splice(idx, 1);
        }
        renderEditMediaPreview();
    }
});

// Add Media button triggers file input
document.getElementById('edit-add-media-btn').onclick = function() {
    document.getElementById('edit-media-input').click();
};

// Handle file input change
document.getElementById('edit-media-input').addEventListener('change', function() {
    const files = Array.from(this.files);
    editMediaState.newFiles = editMediaState.newFiles.concat(files);
    renderEditMediaPreview();
    this.value = '';
});

// Submit edit form
document.getElementById('edit-post-form').onsubmit = function(e) {
    e.preventDefault();
    const lightbox = document.getElementById('edit-lightbox');
    const postId = lightbox.dataset.postId;
    const text = document.getElementById('edit-post-text').value.trim();
    const formData = new FormData();
    formData.append('post_id', postId);
    formData.append('text', text);

    // Send info about removed existing media
    formData.append('removed_indexes', JSON.stringify(editMediaState.removedIndexes));

    // Send new files
    for (let file of editMediaState.newFiles) {
        formData.append('media', file);
    }

    fetch('/students/mailbox/edit_post/', {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        body: formData
    }).then(res => res.json()).then(data => {
        if (data.success) {
            lightbox.style.display = 'none';
            lightbox.classList.remove('active');
            window.location.reload();
        } else {
            alert('Failed to update post.');
        }
    });
};
