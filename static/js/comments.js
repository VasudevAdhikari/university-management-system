// ...existing code...

// Use event delegation:
$(document).on('submit', '.comment-form', function(e) {
    e.preventDefault();
    // ...existing AJAX comment submission code...
});

// ...existing code...