// DOM Elements
const registrationForm = document.getElementById('registrationForm');
const successMessage = document.getElementById('success-message');

// Form fields
const fields = {
    firstname: {
        element: document.getElementById('firstname'),
        errorElement: document.getElementById('firstname-error'),
        validate: (value) => {
            if (value.trim() === '') {
                return 'First name is required';
            }
            if (value.trim().length < 2) {
                return 'First name must be at least 2 characters';
            }
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                return 'First name can only contain letters';
            }
            return '';
        }
    },
    lastname: {
        element: document.getElementById('lastname'),
        errorElement: document.getElementById('lastname-error'),
        validate: (value) => {
            if (value.trim() === '') {
                return 'Last name is required';
            }
            if (value.trim().length < 2) {
                return 'Last name must be at least 2 characters';
            }
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                return 'Last name can only contain letters';
            }
            return '';
        }
    },
    email: {
        element: document.getElementById('email'),
        errorElement: document.getElementById('email-error'),
        validate: (value) => {
            if (value.trim() === '') {
                return 'Email is required';
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return '';
        }
    },
    phone: {
        element: document.getElementById('phone'),
        errorElement: document.getElementById('phone-error'),
        validate: (value) => {
            if (value.trim() === '') {
                return 'Phone number is required';
            }
            // Remove spaces, dashes, and parentheses for validation
            const cleanedPhone = value.replace(/[\s\-\(\)]/g, '');
            if (!/^\+?\d{10,15}$/.test(cleanedPhone)) {
                return 'Please enter a valid phone number (10-15 digits)';
            }
            return '';
        }
    }
};

// Validate a single field
function validateField(fieldName) {
    const field = fields[fieldName];
    const value = field.element.value;
    const error = field.validate(value);

    if (error) {
        field.element.classList.add('error');
        field.element.classList.remove('success');
        field.errorElement.textContent = error;
        field.errorElement.classList.add('show');
        return false;
    } else {
        field.element.classList.remove('error');
        field.element.classList.add('success');
        field.errorElement.textContent = '';
        field.errorElement.classList.remove('show');
        return true;
    }
}

// Validate all fields
function validateForm() {
    let isValid = true;
    for (const fieldName in fields) {
        if (!validateField(fieldName)) {
            isValid = false;
        }
    }
    return isValid;
}

// Clear all validation states
function clearValidation() {
    for (const fieldName in fields) {
        const field = fields[fieldName];
        field.element.classList.remove('error', 'success');
        field.errorElement.textContent = '';
        field.errorElement.classList.remove('show');
    }
}

// Show success message
function showSuccessMessage() {
    registrationForm.style.display = 'none';
    successMessage.classList.add('show');

    // Reset form after showing success
    registrationForm.reset();
    clearValidation();

    // Reset to form after 5 seconds
    setTimeout(() => {
        successMessage.classList.remove('show');
        registrationForm.style.display = 'flex';
    }, 5000);
}

// Add real-time validation on blur
for (const fieldName in fields) {
    fields[fieldName].element.addEventListener('blur', () => {
        validateField(fieldName);
    });

    // Remove error state when user starts typing
    fields[fieldName].element.addEventListener('input', () => {
        const field = fields[fieldName];
        if (field.element.classList.contains('error')) {
            field.element.classList.remove('error');
            field.errorElement.classList.remove('show');
        }
    });
}

// API endpoint
const API_ENDPOINT = '/users';

// Get CSRF token from cookie (Spring Boot default)
function getCsrfToken() {
    const name = 'XSRF-TOKEN';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

// Form submission handler
registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (validateForm()) {
        // Collect form data (id is null for new entries - auto-generated by database)
        const formData = {
            // id: null,
            firstname: fields.firstname.element.value.trim(),
            lastname: fields.lastname.element.value.trim(),
            email: fields.email.element.value.trim(),
            phone: fields.phone.element.value.trim()
        };

        const submitBtn = registrationForm.querySelector('.submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Sending...</span>';

        try {
            console.log('Sending data:', formData);
            
            // Build headers with CSRF token if available
            const headers = {
                'Content-Type': 'application/json'
            };
            
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
                console.log('Using CSRF token:', csrfToken.substring(0, 8) + '...');
            }
            
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(formData),
                mode: 'cors', // Enable CORS
                credentials: 'same-origin' // Send cookies only for same-origin requests
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const result = await response.json().catch(() => null);
                console.log('User registered successfully!', result || formData);
                showSuccessMessage();
            } else {
                // Try to get error details from response
                let errorDetails = '';
                try {
                    const errorData = await response.json();
                    errorDetails = JSON.stringify(errorData);
                    console.error('Server error response:', errorData);
                } catch (e) {
                    // Response might not be JSON
                    const textError = await response.text();
                    errorDetails = textError || `HTTP ${response.status}`;
                    console.error('Server error text:', textError);
                }
                throw new Error(`Server error ${response.status}: ${errorDetails}`);
            }
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed: ' + error.message);
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    }
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // Allow Enter key to submit form when focused on last field
    if (e.key === 'Enter' && e.target === fields.phone.element) {
        registrationForm.dispatchEvent(new Event('submit'));
    }
});

// Add a nice focus animation when page loads
window.addEventListener('load', () => {
    const firstField = fields.firstname.element;
    setTimeout(() => {
        firstField.focus();
    }, 800);
});