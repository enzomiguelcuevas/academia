// Biblioteca Digital - Main JavaScript File

// Global variables and configuration
const API_BASE_URL = window.location.origin;
let currentUser = null;
let matriculaActiva = false;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check authentication status
    checkAuthStatus();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize dropdowns
    initializeDropdowns();
    
    // Add event listeners
    addGlobalEventListeners();
    
    console.log('Biblioteca Digital App Initialized');
}

// Authentication functions
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/me');
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentUser = data.data.user;
                matriculaActiva = data.data.matriculaActiva;
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
    }
}

// UI Components initialization
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function initializeDropdowns() {
    const dropdownTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="dropdown"]'));
    dropdownTriggerList.map(function (dropdownTriggerEl) {
        return new bootstrap.Dropdown(dropdownTriggerEl);
    });
}

// Global event listeners
function addGlobalEventListeners() {
    // Handle form submissions
    document.addEventListener('submit', handleFormSubmit);
    
    // Handle delete confirmations
    document.addEventListener('click', handleDeleteConfirmation);
    
    // Handle loading states
    document.addEventListener('click', handleLoadingStates);
}

// Form handling
function handleFormSubmit(event) {
    const form = event.target;
    if (form.tagName === 'FORM' && form.classList.contains('ajax-form')) {
        event.preventDefault();
        submitFormAjax(form);
    }
}

async function submitFormAjax(form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Show loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';
    
    try {
        const formData = new FormData(form);
        const response = await fetch(form.action, {
            method: form.method,
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            
            // Handle different actions based on response
            if (data.redirect) {
                setTimeout(() => {
                    window.location.href = data.redirect;
                }, 1500);
            } else if (data.reload) {
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else if (form.resetAfterSubmit) {
                form.reset();
            }
        } else {
            showAlert(data.message || 'Error en la operación', 'danger');
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showAlert('Error de conexión. Por favor, intente nuevamente.', 'danger');
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Password management
function showChangePasswordModal() {
    const modal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
    modal.show();
}

async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('Por favor, complete todos los campos', 'warning');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('La nueva contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas nuevas no coinciden', 'warning');
        return;
    }
    
    const submitBtn = document.querySelector('#changePasswordModal .btn-primary');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Cambiando...';
    
    try {
        const response = await fetch('/auth/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAlert(data.message, 'success');
            bootstrap.Modal.getInstance(document.getElementById('changePasswordModal')).hide();
            document.getElementById('changePasswordForm').reset();
        } else {
            showAlert(data.message || 'Error al cambiar contraseña', 'danger');
        }
    } catch (error) {
        console.error('Change password error:', error);
        showAlert('Error de conexión. Por favor, intente nuevamente.', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Alert functions
function showAlert(message, type = 'info', container = '.container-fluid') {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const containerElement = document.querySelector(container);
    if (containerElement) {
        containerElement.insertAdjacentHTML('afterbegin', alertHtml);
        
        // Auto dismiss after 5 seconds
        setTimeout(() => {
            const alert = containerElement.querySelector('.alert');
            if (alert) {
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Delete confirmation
function handleDeleteConfirmation(event) {
    const element = event.target;
    if (element.matches('[data-confirm-delete]')) {
        const message = element.dataset.confirmDelete || '¿Está seguro de que desea eliminar este elemento?';
        if (!confirm(message)) {
            event.preventDefault();
        }
    }
}

// Loading states
function handleLoadingStates(event) {
    const element = event.target;
    if (element.matches('.btn-loading')) {
        element.disabled = true;
        element.innerHTML = '<span class="loading-spinner"></span> Cargando...';
    }
}

// Book functions
async function toggleFavorite(bookId, buttonElement) {
    if (!currentUser) {
        showAlert('Debe iniciar sesión para agregar favoritos', 'warning');
        return;
    }
    
    const originalText = buttonElement.innerHTML;
    buttonElement.disabled = true;
    
    try {
        const isFavorite = buttonElement.classList.contains('active');
        const url = `/library/books/${bookId}/favorite`;
        const method = isFavorite ? 'DELETE' : 'POST';
        
        const response = await fetch(url, { method });
        const data = await response.json();
        
        if (data.success) {
            // Update button state
            if (isFavorite) {
                buttonElement.classList.remove('active', 'btn-danger');
                buttonElement.classList.add('btn-outline-danger');
                buttonElement.innerHTML = '<i class="bi bi-heart"></i> Agregar a Favoritos';
            } else {
                buttonElement.classList.add('active', 'btn-danger');
                buttonElement.classList.remove('btn-outline-danger');
                buttonElement.innerHTML = '<i class="bi bi-heart-fill"></i> En Favoritos';
            }
            
            showAlert(data.message, 'success');
        } else {
            showAlert(data.message, 'danger');
        }
    } catch (error) {
        console.error('Toggle favorite error:', error);
        showAlert('Error de conexión. Por favor, intente nuevamente.', 'danger');
    } finally {
        buttonElement.disabled = false;
    }
}

// Search functions
function handleSearch(event, inputElement) {
    const searchTerm = inputElement.value.trim();
    const form = inputElement.closest('form');
    
    if (event.key === 'Enter' || event.type === 'click') {
        if (searchTerm.length < 2) {
            showAlert('Ingrese al menos 2 caracteres para buscar', 'warning');
            return;
        }
        form.submit();
    }
}

// Filter functions
function updateFilters() {
    const form = document.getElementById('filterForm');
    if (form) {
        const formData = new FormData(form);
        const params = new URLSearchParams();
        
        for (let [key, value] of formData.entries()) {
            if (value) {
                params.append(key, value);
            }
        }
        
        const url = `${window.location.pathname}?${params.toString()}`;
        window.location.href = url;
    }
}

// Pagination
function goToPage(page) {
    const url = new URL(window.location);
    url.searchParams.set('page', page);
    window.location.href = url.toString();
}

// Rating functions
function renderRating(rating, interactive = false, bookId = null) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let html = '<div class="rating-stars">';
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            html += `<i class="bi bi-star-fill" data-rating="${i}"></i>`;
        } else if (i === fullStars + 1 && hasHalfStar) {
            html += `<i class="bi bi-star-half" data-rating="${i}"></i>`;
        } else {
            html += `<i class="bi bi-star" data-rating="${i}"></i>`;
        }
    }
    
    html += '</div>';
    return html;
}

// File upload preview
function previewImage(inputElement, previewElementId) {
    const file = inputElement.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewElement = document.getElementById(previewElementId);
            if (previewElement) {
                previewElement.src = e.target.result;
                previewElement.style.display = 'block';
            }
        };
        reader.readAsDataURL(file);
    }
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}

function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Export functions for global access
window.showChangePasswordModal = showChangePasswordModal;
window.changePassword = changePassword;
window.toggleFavorite = toggleFavorite;
window.handleSearch = handleSearch;
window.updateFilters = updateFilters;
window.goToPage = goToPage;
window.renderRating = renderRating;
window.previewImage = previewImage;
window.formatFileSize = formatFileSize;
window.formatDate = formatDate;
window.truncateText = truncateText;
window.showAlert = showAlert;