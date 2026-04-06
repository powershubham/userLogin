// API endpoint
const API_ENDPOINT = 'https://userlogin-2r6h.onrender.com/users';

// Get user ID from URL query parameter
function getUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// DOM Elements
const editContent = document.getElementById('editContent');

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

// Fetch user data
async function fetchUser(userId) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch(`${API_ENDPOINT}/${userId}`, {
            method: 'GET',
            headers: headers,
            mode: 'cors',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw error;
    }
}

// Update user data
async function updateUser(userId, userData) {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch(`${API_ENDPOINT}/${userId}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(userData),
            mode: 'cors',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const updatedUser = await response.json();
        return updatedUser;
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
}

// Render loading state
function renderLoading() {
    editContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading user data...</p>
        </div>
    `;
}

// Render error state
function renderError(message) {
    editContent.innerHTML = `
        <div class="error-message">
            <div class="error-icon">⚠️</div>
            <h3>Failed to Load User</h3>
            <p>${escapeHtml(message)}</p>
            <a href="users.html" class="back-link" style="margin-top: 20px; display: inline-flex;">← Back to Users</a>
        </div>
    `;
}

// Render edit form
function renderEditForm(user) {
    editContent.innerHTML = `
        <div class="edit-header">
            <h1>Edit User</h1>
            <p>Update user information below</p>
        </div>
        
        <form id="editForm">
            <div class="form-group">
                <label for="firstname">First Name</label>
                <div class="input-wrapper">
                    <input type="text" id="firstname" name="firstname" value="${escapeHtml(user.firstname || '')}" required>
                    <span class="icon">👤</span>
                </div>
                <span class="error-message" id="firstname-error"></span>
            </div>

            <div class="form-group">
                <label for="lastname">Last Name</label>
                <div class="input-wrapper">
                    <input type="text" id="lastname" name="lastname" value="${escapeHtml(user.lastname || '')}" required>
                    <span class="icon">👤</span>
                </div>
                <span class="error-message" id="lastname-error"></span>
            </div>

            <div class="form-group">
                <label for="email">Email Address</label>
                <div class="input-wrapper">
                    <input type="email" id="email" name="email" value="${escapeHtml(user.email || '')}" required>
                    <span class="icon">📧</span>
                </div>
                <span class="error-message" id="email-error"></span>
            </div>

            <div class="form-group">
                <label for="phone">Phone Number</label>
                <div class="input-wrapper">
                    <input type="tel" id="phone" name="phone" value="${escapeHtml(user.phone || '')}" required>
                    <span class="icon">📱</span>
                </div>
                <span class="error-message" id="phone-error"></span>
            </div>

            <div class="form-actions">
                <button type="button" class="cancel-btn" onclick="window.location.href='users.html'">
                    <span>Cancel</span>
                </button>
                <button type="submit" class="submit-btn" id="submitBtn">
                    <span>Update</span>
                    <span class="btn-icon">→</span>
                </button>
            </div>
        </form>
    `;

    // Add form validation and submit handler
    const form = document.getElementById('editForm');
    form.addEventListener('submit', handleFormSubmit);

    // Add validation on blur
    const fields = ['firstname', 'lastname', 'email', 'phone'];
    fields.forEach(fieldName => {
        const input = document.getElementById(fieldName);
        input.addEventListener('blur', () => validateField(fieldName));
        input.addEventListener('input', () => {
            const errorEl = document.getElementById(`${fieldName}-error`);
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                errorEl.classList.remove('show');
            }
        });
    });
}

// Render success message and redirect
function renderSuccess() {
    editContent.innerHTML = `
        <div class="success-message">
            <div class="success-icon">✓</div>
            <h3>User Updated Successfully!</h3>
            <p>Redirecting to users list...</p>
        </div>
    `;
    // Redirect to users page after a brief moment
    setTimeout(() => {
        window.location.href = 'users.html';
    }, 800);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validate field
function validateField(fieldName) {
    const input = document.getElementById(fieldName);
    const errorEl = document.getElementById(`${fieldName}-error`);
    const value = input.value.trim();
    let error = '';

    switch (fieldName) {
        case 'firstname':
            if (value === '') error = 'First name is required';
            else if (value.length < 2) error = 'First name must be at least 2 characters';
            else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'First name can only contain letters';
            break;
        case 'lastname':
            if (value === '') error = 'Last name is required';
            else if (value.length < 2) error = 'Last name must be at least 2 characters';
            else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Last name can only contain letters';
            break;
        case 'email':
            if (value === '') error = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Please enter a valid email address';
            break;
        case 'phone':
            if (value === '') error = 'Phone number is required';
            else {
                const cleanedPhone = value.replace(/[\s\-\(\)]/g, '');
                if (!/^\+?\d{10,15}$/.test(cleanedPhone)) error = 'Please enter a valid phone number (10-15 digits)';
            }
            break;
    }

    if (error) {
        input.classList.add('error');
        input.classList.remove('success');
        errorEl.textContent = error;
        errorEl.classList.add('show');
        return false;
    } else {
        input.classList.remove('error');
        input.classList.add('success');
        errorEl.textContent = '';
        errorEl.classList.remove('show');
        return true;
    }
}

// Validate all fields
function validateForm() {
    const fields = ['firstname', 'lastname', 'email', 'phone'];
    let isValid = true;
    fields.forEach(fieldName => {
        if (!validateField(fieldName)) {
            isValid = false;
        }
    });
    return isValid;
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    const userId = getUserIdFromUrl();
    const submitBtn = document.getElementById('submitBtn');
    const originalBtnText = submitBtn.innerHTML;

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Updating...</span>';

    const formData = {
        firstname: document.getElementById('firstname').value.trim(),
        lastname: document.getElementById('lastname').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    try {
        console.log('Updating user:', userId, formData);
        await updateUser(userId, formData);
        console.log('User updated successfully');
        renderSuccess();
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update user: ' + error.message);
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    const userId = getUserIdFromUrl();

    if (!userId) {
        renderError('No user ID provided in the URL');
        return;
    }

    try {
        const user = await fetchUser(userId);
        renderEditForm(user);
    } catch (error) {
        renderError(error.message || 'An unexpected error occurred');
    }
});