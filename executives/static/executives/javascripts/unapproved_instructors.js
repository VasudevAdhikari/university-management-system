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
});
document.getElementById('userSearch').addEventListener('input', function () {
    const search = this.value.toLowerCase();
    document.querySelectorAll('#userTable tbody tr').forEach(row => {
        // Only filter main rows, not details/collapse rows
        if (row.querySelector('select')) {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(search) ? '' : 'none';
        }
    });
});