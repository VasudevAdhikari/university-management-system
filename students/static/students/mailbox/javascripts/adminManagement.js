// Admin Management JavaScript
let currentStudents = [];
let searchTimeout = null;

// Open Add Admin Lightbox
function openAddAdminLightbox() {
    const lightbox = document.getElementById('add-admin-lightbox');
    if (lightbox) {
        lightbox.style.display = 'flex';
        loadNonAdminStudents();
        setupLightboxEventListeners();
    }
}

// Close Add Admin Lightbox
function closeAddAdminLightbox() {
    const lightbox = document.getElementById('add-admin-lightbox');
    if (lightbox) {
        lightbox.style.display = 'none';
        // Clear search
        const searchInput = document.getElementById('student-search');
        if (searchInput) {
            searchInput.value = '';
        }
        // Clear students grid
        const studentsGrid = document.getElementById('students-grid');
        if (studentsGrid) {
            studentsGrid.innerHTML = '';
        }
    }
}

// Setup event listeners for the lightbox
function setupLightboxEventListeners() {
    // Close button
    const closeBtn = document.querySelector('.close-add-admin');
    if (closeBtn) {
        closeBtn.onclick = closeAddAdminLightbox;
    }

    // Click outside to close
    const lightbox = document.getElementById('add-admin-lightbox');
    if (lightbox) {
        lightbox.onclick = function(e) {
            if (e.target === lightbox) {
                closeAddAdminLightbox();
            }
        };
    }

    // Search functionality
    const searchInput = document.getElementById('student-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = this.value.trim();
                loadNonAdminStudents(query);
            }, 300);
        });
    }
}

// Load non-admin students
async function loadNonAdminStudents(searchQuery = '') {
    const studentsGrid = document.getElementById('students-grid');
    const adminCountDisplay = document.getElementById('admin-count-display');
    
    if (!studentsGrid) return;

    // Show loading
    studentsGrid.innerHTML = `
        <div class="loading-spinner">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading students...</p>
        </div>
    `;

    try {
        const url = `/students/get_non_admin_students/${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrftoken
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            currentStudents = data.students;
            
            // Update admin count display
            if (adminCountDisplay) {
                adminCountDisplay.textContent = `Current MailboxAdmins: ${data.current_admin_count}/${data.max_admins}`;
            }

            // Render students
            renderStudents(data.students);
        } else {
            studentsGrid.innerHTML = `
                <div class="no-students">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    <p>${data.message}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading students:', error);
        studentsGrid.innerHTML = `
            <div class="no-students">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <p>Error loading students. Please try again.</p>
            </div>
        `;
    }
}

// Render students in the grid
function renderStudents(students) {
    const studentsGrid = document.getElementById('students-grid');
    
    if (!studentsGrid) return;

    if (students.length === 0) {
        studentsGrid.innerHTML = `
            <div class="no-students">
                <i class="fa-solid fa-users"></i>
                <p>No students found matching your search.</p>
            </div>
        `;
        return;
    }

    studentsGrid.innerHTML = students.map(student => `
        <div class="student-card" data-student-id="${student.id}">
            <img src="${student.profile_picture}" alt="${student.full_name}" class="student-avatar" />
            <div class="student-name">${student.full_name}</div>
            <div class="student-details">
                ID: ${student.student_id}<br>
                Dept: ${student.department}
            </div>
            <button class="add-admin-btn" onclick="addStudentAsAdmin(${student.id}, '${student.full_name}')">
                <i class="fa-solid fa-user-plus"></i> Make Admin
            </button>
        </div>
    `).join('');
}

// Add student as admin
async function addStudentAsAdmin(studentId, studentName) {
    const button = document.querySelector(`[data-student-id="${studentId}"] .add-admin-btn`);
    
    if (!button) return;

    // Disable button and show loading
    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';

    try {
        const response = await fetch('/students/add_mailbox_admin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                student_id: studentId
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Show success message
            showNotification('success', data.message);
            
            // Remove the student card from the grid
            const studentCard = document.querySelector(`[data-student-id="${studentId}"]`);
            if (studentCard) {
                studentCard.style.animation = 'fadeOut 0.3s ease-out';
                setTimeout(() => {
                    studentCard.remove();
                }, 300);
            }

            // Reload the students list to update admin count
            setTimeout(() => {
                const searchInput = document.getElementById('student-search');
                const searchQuery = searchInput ? searchInput.value.trim() : '';
                loadNonAdminStudents(searchQuery);
            }, 500);

        } else {
            // Show error message
            showNotification('error', data.message);
            
            // Re-enable button
            button.disabled = false;
            button.innerHTML = '<i class="fa-solid fa-user-plus"></i> Make Admin';
        }
    } catch (error) {
        console.error('Error adding admin:', error);
        showNotification('error', 'An error occurred while adding the admin. Please try again.');
        
        // Re-enable button
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-user-plus"></i> Make Admin';
    }
}

// Show notification
function showNotification(type, message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.innerHTML = `
        <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 10px;
        padding: 15px 20px;
        z-index: 10001;
        font-family: 'Poppins', sans-serif;
        font-weight: 500;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(100%);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes fadeOut {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0.8);
            }
        }
        .admin-notification i {
            margin-right: 10px;
        }
    `;
    document.head.appendChild(style);

    // Add to page
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Leave Admin Role Modal Functions
function openLeaveAdminModal() {
    const modal = document.getElementById('leave-admin-modal');
    if (modal) {
        modal.style.display = 'flex';
        setupLeaveAdminEventListeners();
    }
}

function closeLeaveAdminModal() {
    const modal = document.getElementById('leave-admin-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function setupLeaveAdminEventListeners() {
    // Close button
    const closeBtn = document.querySelector('.close-leave-admin');
    if (closeBtn) {
        closeBtn.onclick = closeLeaveAdminModal;
    }

    // Cancel button
    const cancelBtn = document.getElementById('cancel-leave-admin');
    if (cancelBtn) {
        cancelBtn.onclick = closeLeaveAdminModal;
    }

    // Click outside to close
    const modal = document.getElementById('leave-admin-modal');
    if (modal) {
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeLeaveAdminModal();
            }
        };
    }

    // Confirm leave button
    const confirmBtn = document.getElementById('confirm-leave-admin');
    if (confirmBtn) {
        confirmBtn.onclick = confirmLeaveAdminRole;
    }
}

async function confirmLeaveAdminRole() {
    const confirmBtn = document.getElementById('confirm-leave-admin');

    if (!confirmBtn) return;

    // Add loading state
    const originalHTML = confirmBtn.innerHTML;
    confirmBtn.classList.add('loading');
    confirmBtn.innerHTML = '<i class="fa-solid fa-spinner"></i><span>Leaving Role...</span>';
    confirmBtn.disabled = true;

    try {
        const response = await fetch('/students/leave_mailbox_admin/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            }
        });

        const data = await response.json();

        if (data.status === 'success') {
            // Success state
            confirmBtn.classList.remove('loading');
            confirmBtn.innerHTML = '<i class="fa-solid fa-check"></i><span>Role Left Successfully!</span>';
            confirmBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';

            // Show beautiful success notification
            showLeaveAdminNotification('success', data.message, data.admin_info);

            // Close modal after delay and redirect
            setTimeout(() => {
                closeLeaveAdminModal();
                // Redirect to mailbox page to refresh admin status
                window.location.href = '/students/mailbox/';
            }, 2000);

        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Leave admin error:', error);

        // Reset button state
        confirmBtn.classList.remove('loading');
        confirmBtn.innerHTML = originalHTML;
        confirmBtn.disabled = false;
        confirmBtn.style.background = '';

        // Show error notification
        showLeaveAdminNotification('error', error.message || 'Failed to leave admin role. Please try again.');
    }
}

function showLeaveAdminNotification(type, message, adminInfo = null) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `leave-admin-notification ${type}`;

    let content = `
        <div class="notification-header">
            <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span class="notification-title">${type === 'success' ? 'Admin Role Left Successfully' : 'Error'}</span>
        </div>
        <div class="notification-message">${message}</div>
    `;

    if (type === 'success' && adminInfo) {
        content += `
            <div class="admin-service-info">
                <div class="service-detail">
                    <i class="fa-solid fa-calendar"></i>
                    <span>Served since: ${adminInfo.appointed_date}</span>
                </div>
                <div class="service-detail">
                    <i class="fa-solid fa-users"></i>
                    <span>Remaining admins: ${adminInfo.remaining_admins}</span>
                </div>
            </div>
        `;
    }

    notification.innerHTML = content;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)' : 'linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%)'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 15px;
        padding: 20px;
        z-index: 10002;
        font-family: 'Poppins', sans-serif;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
        animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        max-width: 400px;
        min-width: 300px;
    `;

    // Add notification styles if not already present
    if (!document.getElementById('leave-admin-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'leave-admin-notification-styles';
        style.textContent = `
            .leave-admin-notification .notification-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 10px;
                font-weight: 600;
                font-size: 16px;
            }
            .leave-admin-notification .notification-header i {
                font-size: 20px;
            }
            .leave-admin-notification .notification-message {
                margin-bottom: 15px;
                line-height: 1.5;
            }
            .leave-admin-notification .admin-service-info {
                border-top: 1px solid rgba(0, 0, 0, 0.1);
                padding-top: 15px;
                margin-top: 15px;
            }
            .leave-admin-notification .service-detail {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 5px 0;
                font-size: 14px;
                font-weight: 500;
            }
            .leave-admin-notification .service-detail i {
                width: 16px;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }

    // Add to page
    document.body.appendChild(notification);

    // Remove after 6 seconds for success (more time to read), 4 seconds for error
    const removeTime = type === 'success' ? 6000 : 4000;
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, removeTime);
}
