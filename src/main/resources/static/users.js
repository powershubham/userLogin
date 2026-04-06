// API endpoint for fetching all users
const API_ENDPOINT = 'http://localhost:8080/users';

// DOM Elements
const usersContent = document.getElementById('usersContent');
const refreshBtn = document.getElementById('refreshBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

// Store all users data
let allUsers = [];
// Store selected user IDs for bulk delete
let selectedUserIds = new Set();

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

// Fetch all users from the backend
async function fetchUsers() {
    try {
        const headers = {
            'Content-Type': 'application/json'
        };

        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }

        const response = await fetch(API_ENDPOINT, {
            method: 'GET',
            headers: headers,
            mode: 'cors',
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const users = await response.json();
        return users;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
}

// Render the users table
function renderUsersTable(users) {
    if (!users || users.length === 0) {
        return `
            <div class="no-users">
                <div class="empty-icon">📋</div>
                <h3>No Users Found</h3>
                <p>Be the first to register!</p>
            </div>
        `;
    }

    const rows = users.map(user => `
        <tr data-user-id="${user.id}">
            <td class="checkbox-cell">
                <input type="checkbox" class="user-checkbox" data-user-id="${user.id}" ${selectedUserIds.has(String(user.id)) ? 'checked' : ''}>
            </td>
            <td>${user.id !== undefined ? user.id : '-'}</td>
            <td>${escapeHtml(user.firstname || '-')}</td>
            <td>${escapeHtml(user.lastname || '-')}</td>
            <td>${escapeHtml(user.email || '-')}</td>
            <td>${escapeHtml(user.phone || '-')}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editUser('${user.id}')">✏️ Edit</button>
                    <button class="delete-btn" onclick="deleteUser('${user.id}')">🗑 Delete</button>
                </div>
            </td>
        </tr>
    `).join('');

    return `
        <table class="users-table">
            <thead>
                <tr>
                    <th class="select-all-cell"><input type="checkbox" id="selectAll" title="Select All"></th>
                    <th>ID</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Render loading state
function renderLoading() {
    usersContent.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Loading users...</p>
        </div>
    `;
}

// Render error state
function renderError(message) {
    usersContent.innerHTML = `
        <div class="error-message">
            <div class="error-icon">⚠️</div>
            <h3>Failed to Load Users</h3>
            <p>${escapeHtml(message)}</p>
            <button class="refresh-btn" onclick="loadUsers()" style="margin-top: 20px;">Try Again</button>
        </div>
    `;
}

// Main function to load users
async function loadUsers() {
    renderLoading();
    refreshBtn.style.display = 'none';
    selectedUserIds.clear();
    updateDeleteSelectedButton();

    try {
        const users = await fetchUsers();
        allUsers = users;
        usersContent.innerHTML = renderUsersTable(users);
        refreshBtn.style.display = 'inline-flex';
        updateSelectAllCheckbox();
    } catch (error) {
        renderError(error.message || 'An unexpected error occurred');
        refreshBtn.style.display = 'inline-flex';
    }
}

// Edit user - navigate to edit page
function editUser(userId) {
    window.location.href = `edit-user.html?id=${userId}`;
}

// Delete a single user by ID
async function deleteUser(userId) {
    console.log("DELETE USER ID:", userId);
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_ENDPOINT}/${userId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Failed: ${response.status}`);
        }

        console.log(`User ${userId} deleted successfully`);

        allUsers = allUsers.filter(u => u.id !== userId);
        selectedUserIds.delete(userId);
        await loadUsers();

    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user: ' + error.message);
    }
}

// Delete selected users (bulk delete)
async function deleteSelectedUsers() {
    if (selectedUserIds.size === 0) {
        alert('Please select at least one user to delete');
        return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedUserIds.size} selected user(s)?`)) {
        return;
    }

    const idsToDelete = Array.from(selectedUserIds);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of idsToDelete) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            const csrfToken = getCsrfToken();
            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
            }

            const response = await fetch(`${API_ENDPOINT}/${userId}`, {
                method: 'DELETE',
                headers: headers,
                mode: 'cors',
                credentials: 'same-origin'
            });

            if (response.ok) {
                successCount++;
                allUsers = allUsers.filter(u => u.id !== userId);
            } else {
                errorCount++;
                console.error(`Failed to delete user ${userId}: ${response.status}`);
            }
        } catch (error) {
            errorCount++;
            console.error(`Error deleting user ${userId}:`, error);
        }
    }

    selectedUserIds.clear();
    await loadUsers();

    if (errorCount > 0) {
        alert(`${successCount} user(s) deleted successfully. ${errorCount} failed.`);
    } else {
        console.log(`${successCount} user(s) deleted successfully`);
    }
}

// Toggle selection of a user
function toggleUserSelection(userId, isChecked) {
    // Convert to string for consistency
    const idStr = String(userId);
    if (isChecked) {
        selectedUserIds.add(idStr);
    } else {
        selectedUserIds.delete(idStr);
    }
    console.log("Selected IDs:", selectedUserIds, "Count:", selectedUserIds.size);
    updateDeleteSelectedButton();
    updateSelectAllCheckbox();
}

// Toggle select all users
function toggleSelectAll(isChecked) {
    if (isChecked) {
        allUsers.forEach(user => {
            if (user.id !== undefined) {
                selectedUserIds.add(String(user.id));
            }
        });
    } else {
        selectedUserIds.clear();
    }
    updateDeleteSelectedButton();
    updateUserCheckboxes();
}

// Update the Delete Selected button visibility
function updateDeleteSelectedButton() {
    if (selectedUserIds.size > 0) {
        deleteSelectedBtn.style.display = 'inline-flex';
        deleteSelectedBtn.textContent = `🗑 Delete Selected (${selectedUserIds.size})`;
    } else {
        deleteSelectedBtn.style.display = 'none';
    }
}

// Update all user checkboxes to match current selection state
function updateUserCheckboxes() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    checkboxes.forEach(checkbox => {
        const userId = String(checkbox.dataset.userId);
        checkbox.checked = selectedUserIds.has(userId);
    });
}

// Update the select all checkbox state
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        const visibleUserIds = allUsers.map(u => u.id).filter(id => id !== undefined);
        const allSelected = visibleUserIds.length > 0 && visibleUserIds.every(id => selectedUserIds.has(id));
        selectAllCheckbox.checked = allSelected;
    }
}

// Refresh button event listener
refreshBtn.addEventListener('click', loadUsers);

// Event delegation using document body (persists across innerHTML changes)
document.body.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-btn') && !e.target.classList.contains('delete-selected-btn')) {
        e.preventDefault();
        e.stopPropagation();
        // Extract userId from onclick attribute
        const onclickAttr = e.target.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/deleteUser\('([^']+)'\)/);
            if (match) {
                deleteUser(match[1]);
            }
        }
    }
});

document.body.addEventListener('change', function(e) {
    if (e.target.classList.contains('user-checkbox')) {
        const userId = e.target.dataset.userId;
        if (userId) {
            toggleUserSelection(userId, e.target.checked);
        }
    }
    if (e.target.id === 'selectAll') {
        toggleSelectAll(e.target.checked);
    }
});

// Load users when page loads
document.addEventListener('DOMContentLoaded', loadUsers);