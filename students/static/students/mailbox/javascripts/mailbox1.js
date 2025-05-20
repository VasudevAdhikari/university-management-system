document.addEventListener('DOMContentLoaded', function() {
    // Add video play/pause event listeners
    document.querySelectorAll('.gallery-img[data-type="video"]').forEach(item => {
        const video = item.querySelector('video');
        const playButton = item.querySelector('.play-button');
        
        if (video && playButton) {
            video.addEventListener('play', () => {
                playButton.style.display = 'none';
            });
            
            video.addEventListener('pause', () => {
                playButton.style.display = 'block';
            });
        }
    }); 

    // Lightbox functionality
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

    // Open lightbox when clicking on gallery items
    document.querySelectorAll('.gallery-img').forEach(item => {
        item.addEventListener('click', function() {
            const gallery = this.closest('.multi-image-gallery');
            currentGallery = gallery;
            
            // Pause and mute any playing videos in the gallery
            gallery.querySelectorAll('video').forEach(video => {
                console.log("that's it");
                video.pause();
                video.currentTime = 0; // Reset to beginning
                video.muted = true;
                video.volume = 0;
                console.log("video is paused: " + video.paused);
            });
            
            try {
                // Get all media items from the gallery's data attribute
                const filesStr = gallery.dataset.files;
                console.log('Raw files string:', filesStr); // Debug log
                
                // Convert Python list string to JavaScript array
                const allFiles = filesStr
                    .replace(/[\[\]']/g, '') // Remove brackets and quotes
                    .split(',')              // Split into array
                    .map(file => file.trim()) // Remove whitespace
                    .filter(file => file);    // Remove empty strings
                
                console.log('Processed files:', allFiles); // Debug log
                
                if (!Array.isArray(allFiles) || allFiles.length === 0) {
                    console.error('No files found in gallery data');
                    return;
                }
                
                // Create media items with proper type detection
                mediaItems = allFiles.map(file => {
                    const isVideo = /\.(mp4|mkv|avi|mov)$/i.test(file);
                    return {
                        src: `/media/${file}`,
                        type: isVideo ? 'video' : 'image'
                    };
                });
                
                console.log('Media items:', mediaItems); // Debug log
                
                // Get the index of the clicked item
                currentIndex = parseInt(this.dataset.index);
                console.log('Current index:', currentIndex); // Debug log
                
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

    function showMedia(index) {
        try {
            if (!mediaItems || !mediaItems[index]) {
                console.error('Invalid media item at index:', index);
                return;
            }

            const item = mediaItems[index];
            console.log('Showing media item:', item); // Debug log
            
            // Hide both media elements first
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'none';
            
            if (item.type === 'video') {
                lightboxVideo.style.display = 'block';
                const source = lightboxVideo.querySelector('source');
                source.src = item.src;
                lightboxVideo.load();
                // Reset video to start
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
        // Pause current video if playing
        if (lightboxVideo.style.display === 'block') {
            lightboxVideo.pause();
        }
        currentIndex = (currentIndex + 1) % mediaItems.length;
        showMedia(currentIndex);
    }

    function prevMedia() {
        if (!mediaItems || mediaItems.length === 0) return;
        // Pause current video if playing
        if (lightboxVideo.style.display === 'block') {
            lightboxVideo.pause();
        }
        currentIndex = (currentIndex - 1 + mediaItems.length) % mediaItems.length;
        showMedia(currentIndex);
    }

    // Event listeners for lightbox controls
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (lightboxVideo.style.display === 'block') {
                lightboxVideo.pause();
            }
            lightbox.style.display = 'none';
        });
    }

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

    // Close lightbox when clicking outside the media
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            if (lightboxVideo.style.display === 'block') {
                lightboxVideo.pause();
            }
            lightbox.style.display = 'none';
        }
    });

    // Media preview functionality
    const postTextarea = document.getElementById('post-input-text');
    const fileInputs = document.querySelectorAll('.post-input-container input[type="file"]');
    const mediaPreview = document.querySelector('.selected-media-preview');
    const postButtons = document.querySelector('.post-buttons');

    function createMediaPreview(file) {
        const mediaItem = document.createElement('div');
        mediaItem.className = 'media-item';
        
        if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = true;
            video.paused = true;
            console.log("Video is paused " + video.paused);
            mediaItem.appendChild(video);
            mediaItem.innerHTML += '<div class="play-button">▶</div>';
        } else {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            mediaItem.appendChild(img);
        }

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-media';
        removeButton.innerHTML = '×';
        removeButton.onclick = function() {
            mediaItem.remove();
            if (mediaPreview.children.length === 0) {
                postButtons.style.display = 'none';
            }
        };
        mediaItem.appendChild(removeButton);

        return mediaItem;
    }

    function handleFileSelect(event) {
        const files = event.target.files;
        if (files.length > 0) {
            postButtons.style.display = 'flex';
            for (let file of files) {
                const preview = createMediaPreview(file);
                mediaPreview.appendChild(preview);
            }
        }
    }

    fileInputs.forEach(input => {
        input.addEventListener('change', handleFileSelect);
    });

    postTextarea.addEventListener('input', function() {
        if (this.value.trim() !== '' || mediaPreview.children.length > 0) {
            postButtons.style.display = 'flex';
        } else {
            postButtons.style.display = 'none';
        }
    });

    // Reaction picker functionality
    function addReactionPickerEvents() {
        document.querySelectorAll('.to-react').forEach(element => {
            let pressTimer = null;
            
            function startPressTimer() {
                if (pressTimer === null) {
                    pressTimer = setTimeout(() => {
                        // Try to find .img-parent first, fallback to .post-container
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
                            reaction.addEventListener('click', () => {
                                reactionPicker.style.display = 'none';
                                element.textContent = reaction.textContent;
                                // For comments/replies, update .img-parent; for posts, update .img-parent or .post-container
                                if (parent.classList.contains('img-parent')) {
                                    const content = `
                                        <span class="to-react">${reaction.textContent}</span>
                                        ${reaction.getAttribute("value")}
                                        <div class="reaction-picker" style="display:none;">
                                            <span class="reaction" value="Like">👍</span>
                                            <span class="reaction" value="Love">❤️</span>
                                            <span class="reaction" value="Care">🤗</span>
                                            <span class="reaction" value="Sad">😢</span>
                                            <span class="reaction" value="Disgusted">🤮</span>
                                        </div>
                                    `;
                                    parent.innerHTML = content;
                                    addReactionPickerEvents();
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
    }

    // Initialize reaction picker events
    addReactionPickerEvents();
});