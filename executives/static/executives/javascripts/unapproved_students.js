document.addEventListener("DOMContentLoaded", function () {
    // Approve/Reject confirmation
    document.querySelectorAll('.icon-btn.approve').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!confirm("Are you sure you want to approve this user?")) {
                return;
                // console.log(btn);
            }
            user_id=btn.getAttribute('user-id') || 0;
            window.location.href=`/executives/approve_student/${user_id}`;
        });
    });

    document.querySelectorAll('.icon-btn.reject').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!confirm("Are you sure you want to reject this user?")) {
                return;
            }
            user_id=btn.getAttribute('user-id') || 0;
            window.location.href=`/executives/reject_student/${user_id}`;
        });
    });

    // Row expand/collapse
    document.querySelectorAll('.user-row').forEach(row => {
        row.addEventListener('click', function (e) {
            // Ignore clicks on action buttons or profile pic
            if (e.target.closest('.icon-btn') || e.target.classList.contains('profile-pic')) return;
            const userId = row.getAttribute('data-user');
            const detailsRow = document.querySelector(`.user-details-row[data-user="${userId}"]`);
            if (detailsRow) {
                detailsRow.style.display = detailsRow.style.display === 'none' ? '' : 'none';
            }
        });
    });

    // Lightbox for profile picture
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    document.querySelectorAll('.profile-pic').forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', function (e) {
            e.stopPropagation();
            lightboxImg.src = img.getAttribute('data-img');
            lightboxModal.classList.add('show');
            lightboxModal.style.display = 'flex';
        });
    });
    document.querySelector('.lightbox-close').addEventListener('click', function () {
        lightboxModal.classList.remove('show');
        lightboxModal.style.display = 'none';
        lightboxImg.src = '';
    });
    lightboxModal.addEventListener('click', function (e) {
        if (e.target === lightboxModal) {
            lightboxModal.classList.remove('show');
            lightboxModal.style.display = 'none';
            lightboxImg.src = '';
        }
    });
});

// Search logic: filter both main and details rows
document.getElementById('userSearch').addEventListener('input', function () {
    const search = this.value.toLowerCase();
    document.querySelectorAll('#userTable tbody tr.user-row').forEach(row => {
        const userId = row.getAttribute('data-user');
        const detailsRow = document.querySelector(`.user-details-row[data-user="${userId}"]`);
        const text = row.innerText.toLowerCase();
        const match = text.includes(search);
        row.style.display = match ? '' : 'none';
        if (detailsRow) detailsRow.style.display = match && detailsRow.style.display !== 'none' ? '' : 'none';
    });
});