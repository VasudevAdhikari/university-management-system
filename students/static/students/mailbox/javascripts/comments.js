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

                // Clear existing comments
                commentThread.innerHTML = '';
                
                // Group comments by parent and level
                const commentsByParent = {};
                const commentsByLevel = {};
                
                data.comments.forEach(comment => {
                    const parentId = comment.parent_id || 'root';
                    if (!commentsByParent[parentId]) {
                        commentsByParent[parentId] = [];
                    }
                    commentsByParent[parentId].push(comment);
                    
                    // Group by level for proper indentation
                    if (!commentsByLevel[comment.level]) {
                        commentsByLevel[comment.level] = [];
                    }
                    commentsByLevel[comment.level].push(comment);
                });

                // Sort comments by level and creation time
                Object.keys(commentsByLevel).forEach(level => {
                    commentsByLevel[level].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                });

                // Render comments starting from root level
                function renderCommentThread(parentId, level = 0) {
                    const comments = commentsByParent[parentId] || [];
                    comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    
                    comments.forEach(comment => {
                        const commentElement = createCommentElement(comment, level);
                        if (parentId === 'root') {
                            commentThread.appendChild(commentElement);
                        } else {
                            const parentElement = commentThread.querySelector(`[data-comment-id="${parentId}"]`);
                            if (parentElement) {
                                parentElement.parentNode.insertBefore(commentElement, parentElement.nextSibling);
                            }
                        }
                        
                        // Recursively render replies
                        if (commentsByParent[comment.id]) {
                            renderCommentThread(comment.id, level + 1);
                        }
                    });
                }

                // Start rendering from root comments
                renderCommentThread('root');

                // Initialize reply functionality for all comments
                initializeReplyFunctionality(postContainer);
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
                            parent_comment_id: null
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
                        
                        // Clear input
                        commentInput.value = '';
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
                                parent_comment_id: commentId
                            })
                        });

                        if (!response.ok) throw new Error('Failed to post reply');

                        const data = await response.json();
                        if (data.status === 'success') {
                            // Reload all comments to maintain proper order
                            await loadComments(postContainer);

                            // Close popup
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

    function createCommentElement(comment, level = 0) {
        console.log('Post reactions:', comment.reactions);
        const distinctReactions =  (comment.reactions)?[...new Set(Object.values(comment.reactions).map(r => r.reaction))]:[];
        console.log("distinct reactions" + distinctReactions); // ['Sad', 'Care']
        topTwoReactors = Object.values(comment.reactions).slice(0,2).map(r => r.reactor);
        console.log("reactors" + topTwoReactors); // ['Sad', 'Care']
        reactionEmojis = ""
        for (let i = 0; i < distinctReactions.length; i++) {
            reactionEmojis += getReactionEmoji(distinctReactions[i]);
        }
        topTwoReactorNames = ""
        for (let i=0; i < topTwoReactors.length; i++) {
            topTwoReactorNames += topTwoReactors[i]+", ";  
        }
        remainingReactorCount = Object.keys(comment.reactions).length - topTwoReactors.length;
        const div = document.createElement('div');
        div.className = 'comment-row';
        if (level > 0) {
            div.classList.add('reply');
            div.style.marginLeft = `${level * 20}px`; // Indent based on level
        }
        // --- Show user's reaction if present ---
        const userReaction = comment.user_reaction;
        div.innerHTML = `
            <div class="comment-avatar-col">
                <div class="comment-avatar">
                    <img src="${comment.user.profile_picture.url}" alt="profile" />
                </div>
                ${level > 0 ? '<div class="comment-connector-vertical"></div>' : '<div class="comment-connector"></div>'}
            </div>
            <div class="comment-box" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-author">${comment.user.full_name}</span>
                    <span class="comment-time">${formatTimeAgo(comment.created_at)}</span>
                </div>
                <div class="comment-text">
                    ${comment.comment}
                </div>
                <div class="comment-reactions">
                    <span class="comment-reaction">${reactionEmojis}</span>
                    <span class="comment-reaction-count">${topTwoReactorNames}${remainingReactorCount > 0 ? ` and ${remainingReactorCount} others` : ''}</span>
                </div>
                <div class="comment-footer">
                    <span class="img-parent">
                        <span class="to-react">${userReaction ? getReactionEmoji(userReaction.reaction) : '👍'}</span>${userReaction ? userReaction.reaction : 'React'}
                        <div class="reaction-picker" style="display:none;">
                            <span class="reaction" value="Like">👍</span>
                            <span class="reaction" value="Love">❤️</span>
                            <span class="reaction" value="Care">🤗</span>
                            <span class="reaction" value="Sad">😢</span>
                            <span class="reaction" value="Disgusted">🤮</span>
                        </div>
                    </span>
                    <a href="#" class="comment-reply">Reply</a>
                </div>
            </div>
        `;
        // --- Add reaction picker open/close and react event handler for comment ---
        setTimeout(() => {
            const imgParent = div.querySelector('.img-parent');
            const reactSpan = imgParent.querySelector('.to-react');
            const picker = imgParent.querySelector('.reaction-picker');
            if (reactSpan && picker) {
                let pressTimer = null;
                function openPicker() {
                    // Close any other open pickers
                    document.querySelectorAll('.comment-footer .reaction-picker').forEach(p => {
                        if (p !== picker) p.style.display = 'none';
                    });
                    picker.style.display = 'block';
                }
                function closePicker() {
                    picker.style.display = 'none';
                }
                function startPressTimer() {
                    if (pressTimer === null) {
                        pressTimer = setTimeout(openPicker, 300);
                    }
                }
                function cancelPressTimer() {
                    if (pressTimer !== null) {
                        clearTimeout(pressTimer);
                        pressTimer = null;
                    }
                    // closePicker(); // Don't close on mouseup, only on mouseleave or after selection
                }
                reactSpan.addEventListener('mousedown', startPressTimer);
                reactSpan.addEventListener('mouseup', cancelPressTimer);
                reactSpan.addEventListener('mouseleave', cancelPressTimer);
                reactSpan.addEventListener('click', function(e) {
                    // Also allow click to open picker for accessibility
                    openPicker();
                });
                picker.addEventListener('mouseleave', closePicker);

                picker.querySelectorAll('.reaction').forEach(reactionEl => {
                    reactionEl.addEventListener('click', async function() {
                        const reaction = this.getAttribute('value');
                        try {
                            const res = await fetch('/students/mailbox/react_comment/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRFToken': csrftoken
                                },
                                body: JSON.stringify({
                                    comment_id: comment.id,
                                    reaction: reaction
                                })
                            });
                            if (res.ok) {
                                reactSpan.textContent = getReactionEmoji(reaction);
                            }
                        } catch (e) {
                            alert('Failed to react.');
                        }
                        closePicker();
                    });
                });
            }
        }, 0);
        // --- Truncate comment text to 50 chars with show more/less ---
        setTimeout(() => {
            const commentText = div.querySelector('.comment-text');
            if (commentText) truncateCommentText50(commentText);
        }, 0);
        return div;
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
        initializeCommentFunctionality,
        loadComments
    };

    // --- Ensure comments are loaded on page load for all posts ---
    document.querySelectorAll('.post-container').forEach(postContainer => {
        if (window.MailboxComments) {
            window.MailboxComments.loadComments(postContainer);
        }
    });
});