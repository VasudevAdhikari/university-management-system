document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const genderInputs = document.querySelectorAll('input[name="gender"]');
    const dobInput = document.getElementById('dob');
    const emailError = document.getElementById('emailError');
    const credentialError = document.getElementById('credentialError');
    const errorMessage = document.getElementById('errorMessage');
    const submitButton = document.getElementById('submitButton');
    const form = document.getElementById('credentialForm');
    const authContainer = document.querySelector('.auth-container');

    // Make validateEmail function globally available
    window.validateEmail = function(email) {
        if (!email) {
            emailError.style.display = 'block';
            emailError.textContent = 'Email is required';
            disableAllInputs();
            return;
        }

        fetch('/auth/recovery/check_email/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Email check response:', data);
            if (data.exists) {
                emailError.style.display = 'none';
                // Enable all other inputs
                enableAllInputs();
            } else {
                emailError.style.display = 'block';
                emailError.textContent = 'This email is not registered.';
                disableAllInputs();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            emailError.style.display = 'block';
            emailError.textContent = 'Error checking email. Please try again.';
            disableAllInputs();
        });
    };

    function enableAllInputs() {
        phoneInput.disabled = false;
        genderInputs.forEach(input => input.disabled = false);
        dobInput.disabled = false;
        submitButton.disabled = false;
    }

    function disableAllInputs() {
        phoneInput.disabled = true;
        genderInputs.forEach(input => input.disabled = true);
        dobInput.disabled = true;
        submitButton.disabled = true;
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const data = {
            email: formData.get('email'),
            phone: formData.get('phone'),
            gender: formData.get('gender'),
            dob: formData.get('dob')
        };

        fetch('/auth/credential_login/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Login response:', data);
            if (data.success) {
                window.location.href = data.redirect_url || '/dashboard/';
            } else {
                // Add blur effect to the container
                authContainer.classList.add('blurred');
                // Show error box
                credentialError.style.display = 'block';
                errorMessage.textContent = data.error;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Add blur effect to the container
            authContainer.classList.add('blurred');
            // Show error box
            credentialError.style.display = 'block';
            errorMessage.textContent = 'Unable to connect to the server. Please try again later.';
        });
    });

    // Add event listeners to the error box buttons
    document.querySelectorAll('.error-box .btn').forEach(button => {
        button.addEventListener('click', function() {
            // Remove blur effect
            authContainer.classList.remove('blurred');
            // Hide error box
            credentialError.style.display = 'none';
        });
    });
}); 