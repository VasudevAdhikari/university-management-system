document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const passwordError = document.getElementById('password_error');
    const confirmPasswordError = document.getElementById('confirm_password_error');
    const passwordStrength = document.getElementById('password_strength');
    const submitButton = document.getElementById('submit_button');
    const form = document.getElementById('new_password_form');
    const emailInput = document.getElementById('email');

    // Initially disable the submit button
    submitButton.disabled = true;

    // Check if we have a valid recovery session
    if (!emailInput.value) {
        window.location.href = '/auth/recovery/';
        return;
    }

    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (password.match(/[a-z]+/)) strength += 1;
        if (password.match(/[A-Z]+/)) strength += 1;
        if (password.match(/[0-9]+/)) strength += 1;
        if (password.match(/[^a-zA-Z0-9]+/)) strength += 1;

        passwordStrength.className = 'password-strength';
        if (strength < 3) {
            passwordStrength.classList.add('weak');
            return 'weak';
        } else if (strength < 5) {
            passwordStrength.classList.add('medium');
            return 'medium';
        } else {
            passwordStrength.classList.add('strong');
            return 'strong';
        }
    }

    function validatePassword() {
        const password = passwordInput.value;
        if (password.length < 8) {
            passwordError.textContent = 'Password must be at least 8 characters long';
            passwordError.style.display = 'block';
            return false;
        }
        passwordError.style.display = 'none';
        return true;
    }

    function validateConfirmPassword() {
        if (confirmPasswordInput.value !== passwordInput.value) {
            confirmPasswordError.textContent = 'Passwords do not match';
            confirmPasswordError.style.display = 'block';
            return false;
        }
        confirmPasswordError.style.display = 'none';
        return true;
    }

    function updateSubmitButton() {
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        submitButton.disabled = !(isPasswordValid && isConfirmPasswordValid);
    }

    // Validate on input for both fields
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
        validatePassword();
        // Also validate confirm password when password changes
        validateConfirmPassword();
        updateSubmitButton();
    });

    confirmPasswordInput.addEventListener('input', function() {
        validateConfirmPassword();
        updateSubmitButton();
    });

    // Also validate on blur (when user leaves the field)
    passwordInput.addEventListener('blur', function() {
        validatePassword();
        updateSubmitButton();
    });

    confirmPasswordInput.addEventListener('blur', function() {
        validateConfirmPassword();
        updateSubmitButton();
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validatePassword() || !validateConfirmPassword()) {
            return;
        }

        const formData = new FormData();
        formData.append('email', emailInput.value);
        formData.append('password', passwordInput.value);
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);

        fetch('/auth/recovery/change_password/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                passwordError.textContent = data.message || 'Failed to change password';
                passwordError.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            passwordError.textContent = 'An error occurred while changing the password';
            passwordError.style.display = 'block';
        });
    });
}); 