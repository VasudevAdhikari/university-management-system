// Track viewed posts globally to prevent duplicate counts in this session
window._mailboxViewedPosts = window._mailboxViewedPosts || new Set();

function trackPostViews() {
    document.querySelectorAll('.post-container').forEach(postContainer => {
        let timer = null;
        const postId = postContainer.dataset.postId;

        // --- Prevent attaching multiple observers/timers for the same post ---
        if (postContainer._mailboxViewTracked) return;
        postContainer._mailboxViewTracked = true;

        function isInViewport(el) {
            const rect = el.getBoundingClientRect();
            return (
                rect.bottom > 0 &&
                rect.right > 0 &&
                rect.top < (window.innerHeight || document.documentElement.clientHeight) &&
                rect.left < (window.innerWidth || document.documentElement.clientWidth)
            );
        }

        function startTimer() {
            if (!timer && !window._mailboxViewedPosts.has(postId)) {
                timer = setTimeout(() => {
                    window._mailboxViewedPosts.add(postId);
                    fetch('/students/increment_post_view/', { // FIXED URL
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': window.csrftoken
                        },
                        body: JSON.stringify({ post_id: postId })
                    })
                    .then(res => res.json())
                    .then(data => {
                        // console.log(`[DEBUG] View increment response for post ${postId}:`, data);
                    })
                    .catch((err) => {
                        console.error(`[DEBUG] Error incrementing view for post ${postId}:`, err);
                    });
                }, 5000);
            }
        }

        function clearTimer() {
            if (timer) {
                // console.log(`[DEBUG] Cleared 10s view timer for post ${postId}`);
                clearTimeout(timer);
                timer = null;
            }
        }

        function checkView() {
            if (isInViewport(postContainer)) {
                startTimer();
            } else {
                clearTimer();
            }
        }

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // console.log(`[DEBUG] Post ${postId} entered viewport`);
                        startTimer();
                    } else {
                        // console.log(`[DEBUG] Post ${postId} left viewport`);
                        clearTimer();
                    }
                });
            }, { threshold: 0.2 });
            observer.observe(postContainer);
        } else {
            window.addEventListener('scroll', checkView);
            window.addEventListener('resize', checkView);
            checkView();
        }
    });
}

window.trackPostViews = trackPostViews;
