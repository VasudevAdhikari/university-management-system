document.addEventListener('DOMContentLoaded', function() {
    const emailInput = document.getElementById('email');
    const emailOkBtn = document.getElementById('email-ok-btn');
    const otpInput = document.getElementById('otp');
    const confirmBtn = document.getElementById('confirm-btn');
    const errorMessage = document.getElementById('email-error');
    const suspendedMessage = document.getElementById('suspended-message');
    const successMessage = document.getElementById('success-message');

    // Debounce function to limit API calls
    let debounceTimer;
    const debounce = (func, delay) => {
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => func.apply(context, args), delay);
        };
    };

    // Check email existence and suspension status
    const checkEmailStatus = async (email) => {
        if (!email.trim()) {
            emailOkBtn.disabled = true;
            errorMessage.style.display = 'none';
            suspendedMessage.style.display = 'none';
            successMessage.style.display = 'none';
            return;
        }

        try {
            const response = await fetch('/auth/recovery/check_email/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.exists) {
                if (data.suspended) {
                    emailOkBtn.disabled = true;
                    errorMessage.style.display = 'none';
                    suspendedMessage.style.display = 'block';
                    successMessage.style.display = 'none';
                } else {
                    emailOkBtn.disabled = false;
                    errorMessage.style.display = 'none';
                    suspendedMessage.style.display = 'none';
                    successMessage.style.display = 'none';
                }
            } else {
                emailOkBtn.disabled = true;
                errorMessage.textContent = 'Email not found. Please check your email address.';
                errorMessage.style.display = 'block';
                suspendedMessage.style.display = 'none';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking email:', error);
            emailOkBtn.disabled = true;
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
            suspendedMessage.style.display = 'none';
            successMessage.style.display = 'none';
        }
    };

    // Add debounced input event listener for email
    emailInput.addEventListener('input', debounce(function() {
        checkEmailStatus(this.value);
    }, 500));

    // Handle OK button click to send OTP
    emailOkBtn.addEventListener('click', async function() {
        const email = emailInput.value.trim();
        if (!email) return;

        try {
            const response = await fetch('/auth/recovery/send_otp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                emailInput.disabled = true;
                emailOkBtn.disabled = true;
                otpInput.disabled = false;
                errorMessage.style.display = 'none';
                suspendedMessage.style.display = 'none';
                successMessage.textContent = 'OTP has been sent to your email. Please check your inbox.';
                successMessage.style.display = 'block';
            } else {
                errorMessage.textContent = data.error || 'Failed to send OTP. Please try again.';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
            errorMessage.textContent = 'An error occurred while sending OTP. Please try again.';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    });

    // Handle OTP input to enable/disable confirm button
    otpInput.addEventListener('input', function() {
        confirmBtn.disabled = this.value.length !== 6;
    });

    // Handle OTP confirmation
    confirmBtn.addEventListener('click', async function() {
        const email = emailInput.value.trim();
        const otp = otpInput.value.trim();

        if (!email || !otp) return;

        try {
            const response = await fetch('/auth/recovery/verify_otp/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ email, otp })
            });

            const data = await response.json();

            if (data.success) {
                console.log(email);
                window.location.href = `/auth/recovery/new_password/${document.getElementById('email').value}`;
                console.log(document.getElementById('email').value);
            } else {
                errorMessage.textContent = data.message || 'Invalid OTP. Please try again.';
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.style.display = 'block';
            successMessage.style.display = 'none';
        }
    });

    // Helper function to get CSRF token
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
});
