// Edit Post Modal Logic for managePosts.html

let editMediaFiles = [];
let editExistingMedia = [];
let editRemovedIndexes = [];
let editPostId = null;

function isVideoFile(file) {
    return file.type && file.type.startsWith('video/');
}
function isVideoUrl(url) {
    return /\.(mp4|webm|ogg|mov|flv|avi|mkv)$/i.test(url);
}

function renderEditMediaPreview() {
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = '';
    // Existing media
    editExistingMedia.forEach((media, idx) => {
        if (editRemovedIndexes.includes(idx)) return;
        const tile = document.createElement('div');
        tile.className = 'media-tile';
        let elem;
        if (isVideoUrl(media)) {
            elem = document.createElement('video');
            elem.src = '/media/' + media;
            elem.controls = false;
            elem.muted = true;
            elem.loop = true;
            elem.autoplay = true;
        } else {
            elem = document.createElement('img');
            elem.src = '/media/' + media;
            elem.alt = 'Image preview';
        }
        tile.appendChild(elem);
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-media-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            editRemovedIndexes.push(idx);
            renderEditMediaPreview();
        };
        tile.appendChild(removeBtn);
        preview.appendChild(tile);
    });
    // New files
    editMediaFiles.forEach((fileObj, idx) => {
        const tile = document.createElement('div');
        tile.className = 'media-tile';
        let elem;
        if (isVideoFile(fileObj)) {
            elem = document.createElement('video');
            elem.src = URL.createObjectURL(fileObj);
            elem.controls = false;
            elem.muted = true;
            elem.loop = true;
            elem.autoplay = true;
        } else {
            elem = document.createElement('img');
            elem.src = URL.createObjectURL(fileObj);
            elem.alt = 'Image preview';
        }
        tile.appendChild(elem);
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-media-btn';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => {
            editMediaFiles.splice(idx, 1);
            renderEditMediaPreview();
        };
        tile.appendChild(removeBtn);
        preview.appendChild(tile);
    });
}

function openEditLightbox(post) {
    const overlay = document.getElementById('editPostOverlay');
    const textArea = document.getElementById('postText');
    editPostId = post.id || post.post.id || post.post_id;
    textArea.value = post.post.post_text;
    editExistingMedia = (post.post.post_files || []).slice();
    editRemovedIndexes = [];
    editMediaFiles = [];
    renderEditMediaPreview();
    overlay.style.display = 'flex';
    overlay.classList.add('active');
    textArea.focus();
}

// Add Media button triggers file input
document.getElementById('addMediaBtn').onclick = function() {
    document.getElementById('mediaInput').click();
};

// Handle file input change
document.getElementById('mediaInput').addEventListener('change', function() {
    const files = Array.from(this.files);
    editMediaFiles = editMediaFiles.concat(files);
    renderEditMediaPreview();
    this.value = '';
});

// Save (submit) edit form
document.getElementById('savePostBtn').onclick = function() {
    const text = document.getElementById('postText').value.trim();
    const formData = new FormData();
    formData.append('post_id', editPostId);
    formData.append('text', text);
    formData.append('removed_indexes', JSON.stringify(editRemovedIndexes));
    for (let file of editMediaFiles) {
        formData.append('media', file);
    }
    fetch('/students/edit-post-api/', {
        method: 'POST',
        headers: { 'X-CSRFToken': window.csrftoken },
        body: formData
    }).then(res => res.json()).then(data => {
        if (data.success) {
            closeEditLightbox();
            window.location.reload();
        } else {
            alert('Failed to update post.');
        }
    });
};

// Cancel and close logic
function closeEditLightbox() {
    const overlay = document.getElementById('editPostOverlay');
    overlay.style.display = 'none';
    overlay.classList.remove('active');
    editPostId = null;
    editMediaFiles = [];
    editExistingMedia = [];
    editRemovedIndexes = [];
    document.getElementById('postText').value = '';
    document.getElementById('mediaPreview').innerHTML = '';
}
document.getElementById('cancelPostBtn').onclick = function(e) {
    e.preventDefault();
    closeEditLightbox();
};
document.getElementById('closePopupBtn').onclick = function(e) {
    e.preventDefault();
    closeEditLightbox();
};
document.getElementById('editPostOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeEditLightbox();
});

// Attach event delegation for edit buttons after posts are rendered
document.addEventListener('click', function(e) {
    if (e.target.closest('.edit-post-btn')) {
        e.preventDefault();
        const btn = e.target.closest('.edit-post-btn');
        const postId = btn.getAttribute('data-post-id');
        if (window.postsById && window.postsById[postId]) {
            openEditLightbox(window.postsById[postId]);
        } else if (typeof getPostDataById === 'function') {
            getPostDataById(postId).then(post => openEditLightbox(post));
        } else {
            alert('Cannot find post data for editing.');
        }
    }
});

// University Settings Functionality
let isAdmin = false;

// Check if current user is an admin
async function checkAdminStatus() {
    try {
        const response = await fetch('/students/check_admin_status/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': window.csrftoken || document.querySelector('[name=csrfmiddlewaretoken]')?.value
            }
        });
        const data = await response.json();
        isAdmin = data.is_admin;

        // Show/hide university settings icon based on admin status
        const universitySettingsIcon = document.getElementById('university-settings-icon');
        if (universitySettingsIcon) {
            universitySettingsIcon.style.display = isAdmin ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin = false;
    }
}

// Open University Settings Modal with beautiful animation
function openUniversitySettingsModal() {
    if (!isAdmin) {
        showNotification('You are not authorized to access university settings.', 'error');
        return;
    }

    const modal = document.getElementById('universitySettingsModal');
    modal.style.display = 'flex';

    // Trigger animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    loadUniversityDetails();
}

// Close University Settings Modal with beautiful animation
function closeUniversitySettingsModal() {
    const modal = document.getElementById('universitySettingsModal');
    modal.classList.remove('show');

    // Hide modal after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
        // Reset form
        document.getElementById('universitySettingsForm').reset();
        resetFilePreview();
    }, 300);
}

// Show notification function with beautiful styling
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');

    let backgroundColor;
    let icon;

    switch(type) {
        case 'error':
            backgroundColor = 'linear-gradient(135deg, #e74c3c, #c0392b)';
            icon = '❌';
            break;
        case 'success':
            backgroundColor = 'linear-gradient(135deg, #27ae60, #2ecc71)';
            icon = '✅';
            break;
        default:
            backgroundColor = 'linear-gradient(135deg, #667eea, #764ba2)';
            icon = 'ℹ️';
    }

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 18px 25px;
        background: ${backgroundColor};
        color: white;
        border-radius: 12px;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 350px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
    `;

    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 16px;">${icon}</span>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    // Add hover effect
    notification.addEventListener('mouseenter', () => {
        notification.style.transform = 'translateX(-5px) scale(1.02)';
    });

    notification.addEventListener('mouseleave', () => {
        notification.style.transform = 'translateX(0) scale(1)';
    });

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 400);
    }, 4000);
}

// Load current university details with beautiful preview
async function loadUniversityDetails() {
    try {
        const response = await fetch('/students/get_university_details/', {
            method: 'GET',
            headers: {
                'X-CSRFToken': window.csrftoken || document.querySelector('[name=csrfmiddlewaretoken]')?.value
            }
        });
        const data = await response.json();

        if (data.success) {
            const details = data.details;

            // Populate form fields with animation
            const descriptionField = document.getElementById('mailboxDescription');
            descriptionField.value = details.mailbox_description || '';

            // Add focus animation
            descriptionField.style.transform = 'scale(1.02)';
            setTimeout(() => {
                descriptionField.style.transform = 'scale(1)';
            }, 200);

            // Show current banner preview with animation
            updateBannerPreview(details.mailbox_banner_photo, false);
        } else {
            showNotification('Failed to load university details: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error loading university details:', error);
        showNotification('Failed to load university details. Please try again.', 'error');
    }
}

// Update banner preview with beautiful animations
function updateBannerPreview(imageSrc, isNewFile = false) {
    const bannerPreview = document.getElementById('currentBannerPreview');
    const previewContainer = document.getElementById('bannerPreviewContainer');

    if (imageSrc) {
        previewContainer.classList.add('has-image');
        bannerPreview.innerHTML = `
            <img src="${imageSrc}" alt="${isNewFile ? 'Selected' : 'Current'} Banner"
                 style="opacity: 0; transform: scale(0.8);"
                 onload="this.style.opacity='1'; this.style.transform='scale(1)';" />
        `;

        // Update file button text if new file
        if (isNewFile) {
            document.getElementById('fileButtonText').innerHTML = '<i class="fas fa-check"></i> Image Selected';
        }
    } else {
        previewContainer.classList.remove('has-image');
        bannerPreview.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
                <i class="fas fa-image" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i>
                <p style="margin: 0; font-family: 'Poppins', sans-serif;">No banner image selected</p>
            </div>
        `;
    }
}

// Reset file preview
function resetFilePreview() {
    const previewContainer = document.getElementById('bannerPreviewContainer');
    const fileButtonText = document.getElementById('fileButtonText');

    previewContainer.classList.remove('has-image');
    fileButtonText.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Choose Banner Image';

    updateBannerPreview(null);
}

// Save university details with beautiful loading animation
async function saveUniversityDetails(event) {
    event.preventDefault();

    if (!isAdmin) {
        showNotification('You are not authorized to update university settings.', 'error');
        return;
    }

    const form = document.getElementById('universitySettingsForm');
    const formData = new FormData(form);
    const saveButton = document.getElementById('saveUniversitySettings');

    // Add loading animation
    saveButton.classList.add('loading');
    saveButton.disabled = true;

    try {
        const response = await fetch('/students/update_university_details/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': window.csrftoken || document.querySelector('[name=csrfmiddlewaretoken]')?.value
            },
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            showNotification('🎉 University details updated successfully!', 'success');

            // Add success animation to button
            saveButton.classList.remove('loading');
            saveButton.innerHTML = '<i class="fas fa-check"></i> Saved!';
            saveButton.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';

            setTimeout(() => {
                closeUniversitySettingsModal();
                // Reload page to reflect changes
                window.location.reload();
            }, 1500);
        } else {
            showNotification('Failed to update university details: ' + (data.error || 'Unknown error'), 'error');
            resetSaveButton();
        }
    } catch (error) {
        console.error('Error saving university details:', error);
        showNotification('Failed to save university details. Please try again.', 'error');
        resetSaveButton();
    }
}

// Reset save button to original state
function resetSaveButton() {
    const saveButton = document.getElementById('saveUniversitySettings');
    saveButton.classList.remove('loading');
    saveButton.disabled = false;
    saveButton.innerHTML = '<i class="fas fa-save"></i> Save Settings';
    saveButton.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

// This function is no longer needed as university details are loaded directly from backend

// Initialize university settings functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check admin status on page load
    checkAdminStatus();

    // Add event listener for university settings icon
    const universitySettingsIcon = document.getElementById('university-settings-icon');
    if (universitySettingsIcon) {
        universitySettingsIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            openUniversitySettingsModal();
        });
    }

    // Add event listener for form submission
    const universitySettingsForm = document.getElementById('universitySettingsForm');
    if (universitySettingsForm) {
        universitySettingsForm.addEventListener('submit', saveUniversityDetails);
    }

    // Add event listener for file input change (image preview)
    const fileInput = document.getElementById('mailboxBannerPhoto');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    showNotification('Please select a valid image file.', 'error');
                    e.target.value = '';
                    return;
                }

                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('Image size should be less than 5MB.', 'error');
                    e.target.value = '';
                    return;
                }

                // Create preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    updateBannerPreview(e.target.result, true);

                    // Add success notification
                    showNotification('✨ Image selected successfully!', 'success');
                };
                reader.readAsDataURL(file);
            } else {
                resetFilePreview();
            }
        });
    }

    // Add event listener for modal close when clicking outside
    const universitySettingsModal = document.getElementById('universitySettingsModal');
    if (universitySettingsModal) {
        universitySettingsModal.addEventListener('click', function(e) {
            if (e.target === universitySettingsModal) {
                closeUniversitySettingsModal();
            }
        });
    }

    // Add keyboard event listener for ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('universitySettingsModal');
            if (modal && modal.classList.contains('show')) {
                closeUniversitySettingsModal();
            }
        }
    });
});
