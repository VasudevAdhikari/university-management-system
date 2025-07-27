// Global variables
let timerInterval;
let uploadedImages = [];
let uploadedFiles = [];
let isSubmitting = false;
let startTime = new Date(); // Track when student started the assessment

// Initialize the assessment page
document.addEventListener('DOMContentLoaded', function() {
    initializeTimer();
    initializeFileUploads();
    initializeDragAndDrop();
    setupBeforeUnload();
});

// Timer functionality
function initializeTimer() {
    const dueDate = new Date(assessmentData.dueDate);
    const timeLimit = assessmentData.timeLimit * 60 * 1000; // Convert to milliseconds
    const now = new Date();
    
    // Calculate end time (due date + time limit)
    const endTime = new Date(dueDate.getTime() + timeLimit);
    
    // If current time is past end time, auto-submit
    if (now >= endTime) {
        autoSubmit();
        return;
    }
    
    // Start timer
    updateTimer(endTime);
    timerInterval = setInterval(() => {
        const currentTime = new Date();
        if (currentTime >= endTime) {
            clearInterval(timerInterval);
            autoSubmit();
        } else {
            updateTimer(endTime);
        }
    }, 1000);
}

function updateTimer(endTime) {
    const now = new Date();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) {
        document.getElementById('timer').textContent = '00:00:00';
        document.getElementById('timer-status').textContent = 'Time Expired';
        return;
    }
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    const timerDisplay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timer').textContent = timerDisplay;
    
    // Update timer status and styling
    const timerElement = document.getElementById('timer');
    const statusElement = document.getElementById('timer-status');
    
    if (timeLeft <= 5 * 60 * 1000) { // 5 minutes or less
        timerElement.classList.add('timer-danger');
        statusElement.textContent = 'Time Running Out!';
    } else if (timeLeft <= 15 * 60 * 1000) { // 15 minutes or less
        timerElement.classList.add('timer-warning');
        statusElement.textContent = 'Time Running Low';
    } else {
        timerElement.classList.remove('timer-warning', 'timer-danger');
        statusElement.textContent = 'Time Remaining';
    }
}

// File upload functionality
function initializeFileUploads() {
    const imageInput = document.getElementById('image-input');
    const fileInput = document.getElementById('file-input');
    
    imageInput.addEventListener('change', handleImageUpload);
    fileInput.addEventListener('change', handleFileUpload);
}

function handleImageUpload(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: formatFileSize(file.size),
                    preview: e.target.result
                };
                uploadedImages.push(imageData);
                displayUploadedImage(imageData);
            };
            reader.readAsDataURL(file);
        }
    });
    event.target.value = '';
}

function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        const fileData = {
            id: Date.now() + Math.random(),
            file: file,
            name: file.name,
            size: formatFileSize(file.size),
            type: file.type
        };
        uploadedFiles.push(fileData);
        displayUploadedFile(fileData);
    });
    event.target.value = '';
}

function displayUploadedImage(imageData) {
    const container = document.getElementById('uploaded-images');
    const imageElement = document.createElement('div');
    imageElement.className = 'uploaded-item';
    imageElement.innerHTML = `
        <img src="${imageData.preview}" alt="${imageData.name}" onclick="openLightbox('${imageData.preview}', 'uploaded')">
        <div class="uploaded-item-info">
            <div class="uploaded-item-name">${imageData.name}</div>
            <div class="uploaded-item-size">${imageData.size}</div>
        </div>
        <button class="delete-btn" onclick="deleteUploadedItem('image', ${imageData.id})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(imageElement);
}

function displayUploadedFile(fileData) {
    const container = document.getElementById('uploaded-files');
    const fileElement = document.createElement('div');
    fileElement.className = 'uploaded-item';
    
    const fileIcon = getFileIcon(fileData.type);
    
    fileElement.innerHTML = `
        <i class="${fileIcon}" style="font-size: 2rem; color: #667eea;"></i>
        <div class="uploaded-item-info">
            <div class="uploaded-item-name">${fileData.name}</div>
            <div class="uploaded-item-size">${fileData.size}</div>
        </div>
        <button class="delete-btn" onclick="deleteUploadedItem('file', ${fileData.id})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    container.appendChild(fileElement);
}

function deleteUploadedItem(type, id) {
    if (type === 'image') {
        uploadedImages = uploadedImages.filter(item => item.id !== id);
        const container = document.getElementById('uploaded-images');
        const elements = container.querySelectorAll('.uploaded-item');
        elements.forEach(element => {
            if (element.querySelector('.delete-btn').onclick.toString().includes(id)) {
                element.remove();
            }
        });
    } else {
        uploadedFiles = uploadedFiles.filter(item => item.id !== id);
        const container = document.getElementById('uploaded-files');
        const elements = container.querySelectorAll('.uploaded-item');
        elements.forEach(element => {
            if (element.querySelector('.delete-btn').onclick.toString().includes(id)) {
                element.remove();
            }
        });
    }
}

function getFileIcon(type) {
    if (type.includes('pdf')) return 'fas fa-file-pdf';
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'fas fa-file-powerpoint';
    if (type.includes('text')) return 'fas fa-file-alt';
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return 'fas fa-file-archive';
    return 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Drag and drop functionality
function initializeDragAndDrop() {
    const imageArea = document.getElementById('image-upload-area');
    const fileArea = document.getElementById('file-upload-area');
    
    [imageArea, fileArea].forEach(area => {
        area.addEventListener('dragover', handleDragOver);
        area.addEventListener('dragleave', handleDragLeave);
        area.addEventListener('drop', handleDrop);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const isImageArea = e.currentTarget.id === 'image-upload-area';
    
    files.forEach(file => {
        if (isImageArea && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = {
                    id: Date.now() + Math.random(),
                    file: file,
                    name: file.name,
                    size: formatFileSize(file.size),
                    preview: e.target.result
                };
                uploadedImages.push(imageData);
                displayUploadedImage(imageData);
            };
            reader.readAsDataURL(file);
        } else if (!isImageArea) {
            const fileData = {
                id: Date.now() + Math.random(),
                file: file,
                name: file.name,
                size: formatFileSize(file.size),
                type: file.type
            };
            uploadedFiles.push(fileData);
            displayUploadedFile(fileData);
        }
    });
}

// Lightbox functionality
function openLightbox(imageSrc, type) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    
    if (type === 'question') {
        lightboxImage.src = `/media/assignment_images/${imageSrc}`;
    } else {
        lightboxImage.src = imageSrc;
    }
    
    lightbox.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close lightbox with escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLightbox();
    }
});

// Submission functionality
function submitAssessment() {
    if (isSubmitting) return;
    
    showConfirmModal();
}

function showConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'block';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
}

function confirmSubmit() {
    closeConfirmModal();
    performSubmission();
}

function performSubmission() {
    isSubmitting = true;
    showLoadingModal();
    
    const endTime = new Date();
    const totalTimeTaken = endTime - startTime; // Time taken in milliseconds
    
    const formData = new FormData();
    formData.append('assessment_id', assessmentData.id);
    formData.append('start_time', startTime.toISOString());
    formData.append('total_time_taken', totalTimeTaken);
    
    // Add images
    uploadedImages.forEach((image, index) => {
        formData.append(`images[${index}]`, image.file);
    });
    
    // Add files
    uploadedFiles.forEach((file, index) => {
        formData.append(`files[${index}]`, file.file);
    });
    
    fetch('/students/academics/assessment/submit/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingModal();
        if (data.success) {
            window.location.href = '/students/mailbox/';
        } else {
            alert('Submission failed: ' + (data.message || 'Unknown error'));
            isSubmitting = false;
        }
    })
    .catch(error => {
        hideLoadingModal();
        console.error('Submission error:', error);
        alert('Submission failed. Please try again.');
        isSubmitting = false;
    });
}

function autoSubmit() {
    if (isSubmitting) return;
    
    alert('Time has expired. Your assessment will be submitted automatically.');
    performSubmission();
}

function showLoadingModal() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'block';
}

function hideLoadingModal() {
    const modal = document.getElementById('loading-modal');
    modal.style.display = 'none';
}

// Utility functions
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function setupBeforeUnload() {
    window.addEventListener('beforeunload', function(e) {
        if (uploadedImages.length > 0 || uploadedFiles.length > 0) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });
}

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    const confirmModal = document.getElementById('confirm-modal');
    const loadingModal = document.getElementById('loading-modal');
    
    if (e.target === confirmModal) {
        closeConfirmModal();
    }
    if (e.target === loadingModal) {
        // Don't allow closing loading modal by clicking outside
        return;
    }
});
