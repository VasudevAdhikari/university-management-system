async function sendAjaxRequest(id, mark) {
    try {
        const response = await fetch(`/faculty/assessment_mark/update/${id}/${mark}/`);
        if (!response.ok) throw new Error('Request failed');
        const data = await response.text(); // or await response.json();
        console.log('Success:', data);
        return true;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.icon-btn.approve').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!confirm("Are you sure you want to approve this user?")) {
                e.preventDefault();
            }
        });
    });

    document.querySelectorAll('.icon-btn.reject').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!confirm("Are you sure you want to reject this user?")) {
                e.preventDefault();
            }
        });
    });

    // FIX: Move search event listener here and update logic
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', function () {
            const search = this.value.toLowerCase();
            document.querySelectorAll('#userTable tbody tr').forEach(row => {
                // If you want to exclude detail/collapse rows, add a class to main rows and filter by that
                // For now, filter all rows except those with class 'details-row'
                if (!row.classList.contains('details-row')) {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(search) ? '' : 'none';
                }
            });
        });
    }

    document.querySelectorAll('#userTable tbody tr').forEach(row => {
        const editBtn = row.querySelector('.icon-btn.edit');
        const saveBtn = row.querySelector('.icon-btn.save');
        const viewBtn = row.querySelector('.icon-btn.view');
        const marksInput = row.querySelector('.marks-input');
        const marksText = row.querySelector('.marks-text');

        if (marksInput) {
            // Only allow integer input
            marksInput.addEventListener('input', function () {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
        }

        if (editBtn && saveBtn && marksInput && marksText) {
            editBtn.addEventListener('click', function () {
                marksText.classList.add('d-none');
                marksInput.classList.remove('d-none');
                editBtn.classList.add('d-none');
                saveBtn.classList.remove('d-none');
                saveBtn.setAttribute('data-id', editBtn.getAttribute('data-id'));
                marksInput.focus();
            });

            saveBtn.addEventListener('click', async function () {
                const success = await sendAjaxRequest(saveBtn.getAttribute('data-id'), marksInput.value);
                if (success) {
                    // alert('Mark updated successfully');
                    marksText.textContent = marksInput.value;
                    marksText.classList.remove('d-none');
                    marksInput.classList.add('d-none');
                    saveBtn.classList.add('d-none');
                    editBtn.classList.remove('d-none');
                }
            });

            marksInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    saveBtn.click();
                } else if (e.key === 'Escape') {
                    marksInput.value = marksText.textContent;
                    marksText.classList.remove('d-none');
                    marksInput.classList.add('d-none');
                    saveBtn.classList.add('d-none');
                    editBtn.classList.remove('d-none');
                }
            });

            marksInput.addEventListener('blur', function () {
                saveBtn.click();
            });
        }


        // Image enlarge on click
        const img = row.querySelector('.avatar');
        if (img) {
            img.style.cursor = "pointer";
            img.addEventListener('click', function () {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = 0;
                overlay.style.left = 0;
                overlay.style.width = '100vw';
                overlay.style.height = '100vh';
                overlay.style.background = 'rgba(0,0,0,0.7)';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                overlay.style.zIndex = 9999;

                // Create enlarged image
                const bigImg = document.createElement('img');
                bigImg.src = img.src;
                bigImg.alt = img.alt;
                bigImg.style.maxWidth = '90vw';
                bigImg.style.maxHeight = '90vh';
                bigImg.style.borderRadius = '1rem';
                bigImg.style.boxShadow = '0 8px 32px 0 rgba(0,0,0,0.25)';
                bigImg.style.background = '#fff';

                overlay.appendChild(bigImg);

                // Remove overlay on click
                overlay.addEventListener('click', function () {
                    overlay.remove();
                });

                document.body.appendChild(overlay);
            });
        }
    });
});