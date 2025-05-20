document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const passwordError = document.getElementById('password_error');
    const confirmPasswordError = document.getElementById('confirm_password_error');
    const passwordStrength = document.getElementById('password_strength');
    const submitButton = document.getElementById('submit_button');
    const form = document.getElementById('new_password_form');

    // Check if we have a valid recovery session
    const email = document.getElementById('email').value;
    if (!email) {
        window.location.href = '/auth/recovery/';
        return;
    }

    function validatePassword(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) {
            return { valid: false, message: 'Password must be at least 8 characters long' };
        }
        if (!hasUpperCase) {
            return { valid: false, message: 'Password must contain at least one uppercase letter' };
        }
        if (!hasLowerCase) {
            return { valid: false, message: 'Password must contain at least one lowercase letter' };
        }
        if (!hasNumbers) {
            return { valid: false, message: 'Password must contain at least one number' };
        }
        if (!hasSpecialChar) {
            return { valid: false, message: 'Password must contain at least one special character' };
        }
        return { valid: true, message: '' };
    }

    function checkPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

        passwordStrength.className = 'password-strength';
        if (strength <= 2) {
            passwordStrength.classList.add('weak');
        } else if (strength <= 4) {
            passwordStrength.classList.add('medium');
        } else {
            passwordStrength.classList.add('strong');
        }
    }

    function validateConfirmPassword(password, confirmPassword) {
        if (!password || !confirmPassword) {
            return { valid: false, message: 'Both password fields are required' };
        }
        if (password !== confirmPassword) {
            return { valid: false, message: 'Passwords do not match' };
        }
        return { valid: true, message: '' };
    }

    function updateSubmitButton() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Only validate password if it's not empty
        const passwordValidation = password ? validatePassword(password) : { valid: false, message: '' };
        const confirmPasswordValidation = validateConfirmPassword(password, confirmPassword);
        
        // Enable submit button if both passwords match and password meets requirements
        submitButton.disabled = !(passwordValidation.valid && confirmPasswordValidation.valid);
    }

    // Add input event listeners
    passwordInput.addEventListener('input', function() {
        const validation = validatePassword(this.value);
        passwordError.textContent = validation.message;
        passwordError.style.display = validation.valid ? 'none' : 'block';
        checkPasswordStrength(this.value);
        updateSubmitButton();
    });

    confirmPasswordInput.addEventListener('input', function() {
        const validation = validateConfirmPassword(passwordInput.value, this.value);
        confirmPasswordError.textContent = validation.message;
        confirmPasswordError.style.display = validation.valid ? 'none' : 'block';
        updateSubmitButton();
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const passwordValidation = validatePassword(passwordInput.value);
        const confirmPasswordValidation = validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);

        if (!passwordValidation.valid || !confirmPasswordValidation.valid) {
            return;
        }

        // Send the password change request
        fetch('/auth/recovery/change_password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                email: email,
                password: passwordInput.value
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                passwordError.textContent = data.error || 'Failed to change password. Please try again.';
                passwordError.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            passwordError.textContent = 'An error occurred. Please try again.';
            passwordError.style.display = 'block';
        });
    });
}); 