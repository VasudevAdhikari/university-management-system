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
