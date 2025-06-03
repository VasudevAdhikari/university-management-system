document.addEventListener('DOMContentLoaded', function() {
    // Initialize comment functionality for all posts
    initializeComments();

    function initializeComments() {
        // Initialize comment functionality for all posts
        document.querySelectorAll('.post-container').forEach(postContainer => {
            initializeCommentFunctionality(postContainer);
            // Load existing comments for this post
            loadComments(postContainer);
        });
    } 

    // Max depth for indentation lines and margin
    const MAX_DISPLAY_DEPTH = 3;

    async function loadComments(postContainer) {
        const postId = postContainer.dataset.postId;
        if (!postId) return;

        try {
            const response = await fetch(`/students/mailbox/comments/${postId}/`);
            if (!response.ok) throw new Error('Failed to load comments');
            const data = await response.json();
            if (data.status === 'success') {
                const commentThread = postContainer.querySelector('.comment-thread');
                if (!commentThread) return;
                commentThread.innerHTML = '';

                // Build a tree from flat comments
                const comments = data.comments;
                const commentMap = {};
                comments.forEach(c => { commentMap[c.id] = {...c, replies: []}; });
                let roots = [];
                comments.forEach(c => {
                    if (c.parent_id) {
                        if (commentMap[c.parent_id]) {
                            commentMap[c.parent_id].replies.push(commentMap[c.id]);
                        }
                    } else {
                        roots.push(commentMap[c.id]);
                    }
                });

                // Render using mailbox style
                roots.forEach(comment => {
                    const el = createMailboxCommentElement(comment, 0, postContainer);
                    commentThread.appendChild(el);
                });
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    function initializeCommentFunctionality(postContainer) {
        // Comment button click handler
        const commentButton = postContainer.querySelector('.comment-button');
        const commentsSection = postContainer.querySelector('.post-row.comments');
        
        if (commentButton && commentsSection) {
            commentButton.addEventListener('click', function() {
                // Toggle display between 'none' and 'flex'
                if (commentsSection.style.display === 'none' || !commentsSection.style.display) {
                    commentsSection.style.display = 'flex';
                    // Focus the comment input when opening
                    const commentInput = commentsSection.querySelector('textarea');
                    if (commentInput) {
                        commentInput.focus();
                    }
                } else {
                    commentsSection.style.display = 'none';
                }
            });
        }

        // Comment submission
        const commentBtn = postContainer.querySelector('.comment-btn');
        const commentInput = postContainer.querySelector('.comment-input textarea');
        const cancelBtn = postContainer.querySelector('.cancel-btn');

        if (commentBtn && commentInput) {
            commentBtn.addEventListener('click', async function() {
                const commentText = commentInput.value.trim();
                if (!commentText) return;

                // Get anonymous toggle state
                const anonymousToggle = postContainer.querySelector('.comment-anonymous-toggle');
                const isAnonymous = anonymousToggle ? anonymousToggle.checked : false;

                try {
                    const response = await fetch('/students/mailbox/comment/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({
                            post_id: parseInt(postContainer.dataset.postId),
                            comment_text: commentText,
                            parent_comment_id: null,
                            is_anonymous: isAnonymous
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to post comment');
                    }

                    const data = await response.json();
                    if (data.status === 'success') {
                        // Reload all comments to maintain proper order
                        await loadComments(postContainer);

                        // Clear input and reset anonymous toggle
                        commentInput.value = '';
                        if (anonymousToggle) anonymousToggle.checked = false;
                        commentInput.focus();
                    }
                } catch (error) {
                    console.error('Error posting comment:', error);
                    alert(error.message || 'Failed to post comment. Please try again.');
                }
            });
        }

        if (cancelBtn && commentInput) {
            cancelBtn.addEventListener('click', function() {
                commentInput.value = '';
                // Reset anonymous toggle
                const anonymousToggle = postContainer.querySelector('.comment-anonymous-toggle');
                if (anonymousToggle) anonymousToggle.checked = false;
                commentInput.focus();
            });
        }
    }

    function initializeReplyFunctionality(postContainer) {
        const replyLinks = postContainer.querySelectorAll('.comment-reply');
        
        replyLinks.forEach(replyLink => {
            replyLink.addEventListener('click', function(e) {
                e.preventDefault();
                const commentBox = this.closest('.comment-box');
                if (!commentBox) return;

                const commentId = commentBox.dataset.commentId;
                const replyPopup = document.getElementById('reply-popup');
                if (!replyPopup) return;

                const replyTextarea = replyPopup.querySelector('textarea');
                const submitBtn = replyPopup.querySelector('.reply-submit-btn');
                const cancelBtn = replyPopup.querySelector('.reply-cancel-btn');

                if (!replyTextarea || !submitBtn || !cancelBtn) return;

                // Show popup
                replyPopup.style.display = 'flex';
                replyPopup.classList.add('active');
                replyTextarea.value = '';
                replyTextarea.focus();

                // Handle submit
                const handleSubmit = async function() {
                    const replyText = replyTextarea.value.trim();
                    if (!replyText) return;

                    // Get anonymous toggle state
                    const anonymousToggle = replyPopup.querySelector('#reply-anonymous-toggle');
                    const isAnonymous = anonymousToggle ? anonymousToggle.checked : false;

                    try {
                        const response = await fetch('/students/mailbox/comment/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken
                            },
                            body: JSON.stringify({
                                post_id: postContainer.dataset.postId,
                                comment_text: replyText,
                                parent_comment_id: commentId,
                                is_anonymous: isAnonymous
                            })
                        });

                        if (!response.ok) throw new Error('Failed to post reply');

                        const data = await response.json();
                        if (data.status === 'success') {
                            // Reload all comments to maintain proper order
                            await loadComments(postContainer);

                            // Reset anonymous toggle and close popup
                            if (anonymousToggle) anonymousToggle.checked = false;
                            replyPopup.style.display = 'none';
                            replyPopup.classList.remove('active');
                        }
                    } catch (error) {
                        console.error('Error posting reply:', error);
                        alert('Failed to post reply. Please try again.');
                    }
                };

                // Handle cancel
                const handleCancel = function() {
                    // Reset anonymous toggle
                    const anonymousToggle = replyPopup.querySelector('#reply-anonymous-toggle');
                    if (anonymousToggle) anonymousToggle.checked = false;
                    replyPopup.style.display = 'none';
                    replyPopup.classList.remove('active');
                };

                // Remove existing listeners
                const newSubmitBtn = submitBtn.cloneNode(true);
                const newCancelBtn = cancelBtn.cloneNode(true);
                submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
                cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

                // Add new listeners
                newSubmitBtn.addEventListener('click', handleSubmit);
                newCancelBtn.addEventListener('click', handleCancel);

                // Close popup when clicking outside
                const closePopup = function(event) {
                    if (event.target === replyPopup) {
                        replyPopup.style.display = 'none';
                        replyPopup.classList.remove('active');
                        window.removeEventListener('click', closePopup);
                    }
                };
                window.addEventListener('click', closePopup);
            });
        });
    }

    // mailbox style comment element with connectors and collapsible deep replies
    function createMailboxCommentElement(comment, depth = 0, postContainer) {
        const commentEl = document.createElement('div');
        commentEl.className = depth === 0 ? 'mailbox-comment' : 'mailbox-reply';
        commentEl.setAttribute('data-depth', depth);

        // --- Header: profile picture, author, timestamp ---
        const header = document.createElement('div');
        header.className = 'mailbox-comment-header';

        // Profile + author
        const profileDiv = document.createElement('div');
        profileDiv.className = 'mailbox-comment-profile';
        const profileImg = document.createElement('img');
        profileImg.src = comment.user.profile_picture?.url || '';
        profileImg.alt = comment.user.full_name;
        profileImg.className = 'mailbox-comment-profile-img'; // for clarity, but CSS above covers .mailbox-comment-profile img
        profileDiv.appendChild(profileImg);

        const authorEl = document.createElement('span');
        authorEl.className = 'mailbox-comment-author';
        authorEl.textContent = comment.user.full_name;
        profileDiv.appendChild(authorEl);

        header.appendChild(profileDiv);

        // Timestamp (with icon)
        const timeEl = document.createElement('span');
        timeEl.className = 'mailbox-comment-timestamp';
        timeEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${formatTimeAgo(comment.created_at)}`;
        header.appendChild(timeEl);

        commentEl.appendChild(header);

        // --- Comment text (truncated to 40 chars, show more/less) ---
        const textEl = document.createElement('div');
        textEl.className = 'mailbox-comment-text';
        let fullText = comment.comment;
        let isTruncated = false;
        function setTruncated() {
            if (fullText.length > 40) {
                textEl.innerHTML = `${fullText.slice(0, 40)}... <span class="show-more-comment" style="color:#1876f2;cursor:pointer;">show more</span>`;
                isTruncated = true;
                textEl.querySelector('.show-more-comment').onclick = setExpanded;
            } else {
                textEl.textContent = fullText;
                isTruncated = false;
            }
        }
        function setExpanded() {
            textEl.innerHTML = `${fullText} <span class="show-less-comment" style="color:#1876f2;cursor:pointer;">show less</span>`;
            isTruncated = false;
            textEl.querySelector('.show-less-comment').onclick = setTruncated;
        }
        setTruncated();
        commentEl.appendChild(textEl);

        // --- Horizontal line ---
        const hr = document.createElement('hr');
        hr.className = 'mailbox-comment-hr';
        commentEl.appendChild(hr);

        // --- Actions: to-react (left), reactions (right) ---
        const actions = document.createElement('div');
        actions.className = 'mailbox-comment-actions';

        if (current_page == 'mailbox') {
            // To-react group (emoji + label)
            const toReactGroup = document.createElement('div');
            toReactGroup.className = 'mailbox-to-react-group';

            // --- To-react button ---
            const toReact = document.createElement('span');
            toReact.className = 'to-react';
            let userReact = comment.user_reaction && comment.user_reaction.reaction;
            toReact.textContent = userReact ? getReactionEmoji(comment.user_reaction.reaction) : '👍';
            toReact.style.cursor = "pointer";
            toReact.style.marginRight = "2px";
            toReactGroup.appendChild(toReact);

            // --- To-react label ---
            const toReactLabel = document.createElement('span');
            toReactLabel.style.fontSize = "13px";
            toReactLabel.style.color = "#1876f2";
            toReactLabel.style.fontWeight = "500";
            toReactLabel.textContent = userReact ? comment.user_reaction.reaction : "React";
            toReactGroup.appendChild(toReactLabel);

            // --- Reaction picker ---
            const reactionPicker = document.createElement('div');
            reactionPicker.className = 'reaction-picker';
            reactionPicker.style.display = 'none';
            reactionPicker.innerHTML = `
                <span class="reaction" value="Like">👍</span>
                <span class="reaction" value="Love">❤️</span>
                <span class="reaction" value="Care">🤗</span>
                <span class="reaction" value="Sad">😢</span>
                <span class="reaction" value="Disgusted">🤮</span>
            `;
            toReactGroup.appendChild(reactionPicker);
        

            // --- Reaction picker logic ---
            let pressTimer = null;
            toReact.addEventListener('mousedown', function () {
                if (pressTimer === null) {
                    pressTimer = setTimeout(() => {
                        reactionPicker.style.display = 'block';
                        reactionPicker.addEventListener('mouseleave', () => {
                            reactionPicker.style.display = 'none';
                        });
                        pressTimer = null;
                    }, 300);
                }
            });
            toReact.addEventListener('mouseup', function () {
                if (pressTimer !== null) {
                    reactionPicker.style.display = 'none';
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            });
            toReact.addEventListener('mouseleave', function () {
                if (pressTimer !== null) {
                    reactionPicker.style.display = 'none';
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            });

            reactionPicker.querySelectorAll('.reaction').forEach(reactionEl => {
                reactionEl.addEventListener('click', async function () {
                    reactionPicker.style.display = 'none';
                    toReact.textContent = reactionEl.textContent;
                    toReactLabel.textContent = reactionEl.getAttribute('value');
                    try {
                        await fetch('/students/mailbox/react_comment/', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken
                            },
                            body: JSON.stringify({
                                comment_id: comment.id,
                                reaction: reactionEl.getAttribute('value')
                            })
                        });
                        if (postContainer) await loadComments(postContainer);
                    } catch (err) {
                        alert('Failed to save reaction. Please try again.');
                    }
                });
            });

            actions.appendChild(toReactGroup);
        }

        // --- Reaction display (top 2, right aligned) ---
        const reactsDiv = document.createElement('div');
        reactsDiv.className = 'mailbox-comment-reacts';
        const reactions = comment.reactions || {};
        const reactionList = Object.values(reactions);
        const distinctReactions = [...new Set(reactionList.map(r => r.reaction))];
        let topTwoReactors = reactionList.slice(0, 2).map(r => r.reactor);
        let reactionEmojis = "";
        for (let i = 0; i < distinctReactions.length; i++) {
            reactionEmojis += getReactionEmoji(distinctReactions[i]);
        }
        let topTwoReactorNames = "";
        for (let i = 0; i < topTwoReactors.length; i++) {
            topTwoReactorNames += topTwoReactors[i] + (i < topTwoReactors.length - 1 ? ", " : "");
        }
        let remainingReactorCount = reactionList.length - topTwoReactors.length;
        reactsDiv.innerHTML = reactionList.length
            ? `${reactionEmojis} ${topTwoReactorNames}${remainingReactorCount > 0 ? " + " + remainingReactorCount + " others" : ""}`
            : "No reactions yet";
        if (reactionList.length > 0) {
            reactsDiv.style.cursor = "pointer";
            reactsDiv.addEventListener('click', function (e) {
                e.stopPropagation();
                openCommentReactionLightbox(comment.reactions);
            });
        }
        actions.appendChild(reactsDiv);

        commentEl.appendChild(actions);

        
        // --- Reply link (below actions) ---
        const replyLink = document.createElement('a');
        replyLink.href = '#';
        replyLink.className = 'comment-reply';
        replyLink.textContent = 'Reply';
        replyLink.style.fontSize = "13px";
        replyLink.style.color = "#2a5d9f";
        replyLink.style.fontWeight = "500";
        replyLink.style.marginTop = "6px";
        replyLink.style.display = "inline-block";
        if (current_page == 'mailbox') commentEl.appendChild(replyLink);

        // --- Recursively render replies ---
        if (comment.replies && comment.replies.length > 0) {
            const repliesContainer = document.createElement('div');
            repliesContainer.className = 'mailbox-replies';
            repliesContainer.setAttribute('data-depth', depth + 1);

            if (depth + 1 > MAX_DISPLAY_DEPTH) {
                repliesContainer.classList.add('collapsible');
            }

            comment.replies.forEach(reply => {
                const replyEl = createMailboxCommentElement(reply, depth + 1, postContainer);
                repliesContainer.appendChild(replyEl);
            });

            if (depth + 1 > MAX_DISPLAY_DEPTH) {
                const toggleBtn = document.createElement('div');
                toggleBtn.className = 'mailbox-toggle-btn';
                toggleBtn.textContent = `Show ${comment.replies.length} more repl${comment.replies.length > 1 ? 'ies' : 'y'}`;
                let open = false;
                toggleBtn.addEventListener('click', () => {
                    open = !open;
                    if (open) {
                        repliesContainer.classList.add('open');
                        toggleBtn.textContent = `Hide repl${comment.replies.length > 1 ? 'ies' : 'y'}`;
                    } else {
                        repliesContainer.classList.remove('open');
                        toggleBtn.textContent = `Show ${comment.replies.length} more repl${comment.replies.length > 1 ? 'ies' : 'y'}`;
                    }
                });
                commentEl.appendChild(toggleBtn);
                commentEl.appendChild(repliesContainer);
            } else {
                commentEl.appendChild(repliesContainer);
            }
        }

        // --- Reply popup logic ---
        replyLink.addEventListener('click', function(e) {
            e.preventDefault();
            const replyPopup = document.getElementById('reply-popup');
            if (!replyPopup) return;
            const replyTextarea = replyPopup.querySelector('textarea');
            const submitBtn = replyPopup.querySelector('.reply-submit-btn');
            const cancelBtn = replyPopup.querySelector('.reply-cancel-btn');
            if (!replyTextarea || !submitBtn || !cancelBtn) return;
            replyPopup.style.display = 'flex';
            replyPopup.classList.add('active');
            replyTextarea.value = '';
            replyTextarea.focus();

            // Remove existing listeners
            const newSubmitBtn = submitBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            // Submit reply
            newSubmitBtn.addEventListener('click', async function() {
                const replyText = replyTextarea.value.trim();
                if (!replyText) return;

                // Get anonymous toggle state
                const anonymousToggle = replyPopup.querySelector('#reply-anonymous-toggle');
                const isAnonymous = anonymousToggle ? anonymousToggle.checked : false;

                try {
                    const response = await fetch('/students/mailbox/comment/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken
                        },
                        body: JSON.stringify({
                            post_id: comment.post,
                            comment_text: replyText,
                            parent_comment_id: comment.id,
                            is_anonymous: isAnonymous
                        })
                    });
                    if (!response.ok) throw new Error('Failed to post reply');
                    const data = await response.json();
                    if (data.status === 'success') {
                        if (postContainer) await loadComments(postContainer);
                        // Reset anonymous toggle
                        if (anonymousToggle) anonymousToggle.checked = false;
                        replyPopup.style.display = 'none';
                        replyPopup.classList.remove('active');
                    }
                } catch (error) {
                    alert('Failed to post reply. Please try again.');
                }
            });

            // Cancel
            newCancelBtn.addEventListener('click', function() {
                // Reset anonymous toggle
                const anonymousToggle = replyPopup.querySelector('#reply-anonymous-toggle');
                if (anonymousToggle) anonymousToggle.checked = false;
                replyPopup.style.display = 'none';
                replyPopup.classList.remove('active');
            });

            // Close popup when clicking outside
            const closePopup = function(event) {
                if (event.target === replyPopup) {
                    replyPopup.style.display = 'none';
                    replyPopup.classList.remove('active');
                    window.removeEventListener('click', closePopup);
                }
            };
            window.addEventListener('click', closePopup);
        });

        return commentEl;
    }

    // --- Reaction Lightbox for comment/reply reactions ---
    function openCommentReactionLightbox(reactions) {
        let lightbox = document.getElementById('reaction-lightbox');
        if (!lightbox) {
            lightbox = document.createElement('div');
            lightbox.id = 'reaction-lightbox';
            lightbox.className = 'reaction-lightbox';
            lightbox.style.display = 'none';
            lightbox.innerHTML = `
                <div class="reaction-lightbox-content">
                    <span class="reaction-lightbox-close" style="cursor:pointer;float:right;font-size:2em;">&times;</span>
                    <h2>All Reactions</h2>
                    <div class="reaction-list"></div>
                </div>
            `;
            document.body.appendChild(lightbox);
        }
        const closeBtn = lightbox.querySelector('.reaction-lightbox-close');
        const listDiv = lightbox.querySelector('.reaction-list');
        listDiv.innerHTML = '';

        // Style the lightbox for overlay, background, border radius, shadow, scroll
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
                    ${r.profile_picture && r.profile_picture.url ? `<img src="${r.profile_picture.url}" alt="profile" class="reaction-lightbox-profile">` : ''}
                    <span style="font-weight:bold;margin-right:10px;">${r.reactor}</span>
                    <span style="font-size:1.5em;">${getReactionEmoji(r.reaction)}</span>
                `;
                listDiv.appendChild(row);
            });
        } else {
            listDiv.innerHTML = '<div>No reactions yet.</div>';
        }

        lightbox.style.display = 'flex';

        closeBtn.onclick = function() {
            lightbox.style.display = 'none';
        };
        lightbox.onclick = function(e) {
            if (e.target === lightbox) lightbox.style.display = 'none';
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

    function truncateCommentText50(commentText) {
        const fullText = commentText.innerHTML;
        // Use plain text length for truncation logic
        let div = document.createElement('div');
        div.innerHTML = fullText;
        let plain = div.textContent || div.innerText || '';
        if (plain.length <= 50) return; // Do not show "show more" if <= 50 chars
        function getTruncated(text) {
            let truncated = plain.slice(0, 50);
            return truncated + '... <span class="show-more-comment" style="color:#1876f2;cursor:pointer;">show more</span>';
        }
        function setTruncated() {
            commentText.innerHTML = getTruncated(fullText);
            commentText.querySelector('.show-more-comment').onclick = function() {
                setExpanded();
            };
        }
        function setExpanded() {
            commentText.innerHTML = fullText + ' <span class="show-less-comment" style="color:#1876f2;cursor:pointer;">show less</span>';
            commentText.querySelector('.show-less-comment').onclick = function() {
                setTruncated();
            };
        }
        setTruncated();
    }

    // --- Expose functions globally for use in other scripts ---
    window.MailboxComments = {
        loadComments,
        initializeCommentFunctionality
    };

    // --- Ensure comments are loaded on page load for all posts ---
    document.querySelectorAll('.post-container').forEach(postContainer => {
        if (window.MailboxComments) {
            window.MailboxComments.initializeCommentFunctionality(postContainer);
            window.MailboxComments.loadComments(postContainer);
        }
    });
});