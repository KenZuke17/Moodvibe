// Global variables
let currentTheme = 'light';

// Theme switching functionality
function initTheme() {
    const themeSwitch = document.querySelector('.theme-switch');
    const themeIcon = document.querySelector('.theme-icon');
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        currentTheme = 'dark';
    }
    
    // Theme switch event listener
    if (themeSwitch) {
        themeSwitch.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            themeIcon.classList.toggle('fa-sun');
            themeIcon.classList.toggle('fa-moon');
            
            currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }
}

// Parallax effect
function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        parallaxElements.forEach(element => {
            element.style.transform = `translateY(${rate}px)`;
        });
    });
}

// Smooth scrolling for navigation links
function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animation on scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements that should animate
    const animatedElements = document.querySelectorAll('.feature-card, .unique-feature, .recommendation-card');
    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Floating icons animation
function initFloatingIcons() {
    const floatingIcons = document.querySelectorAll('.floating-icon');
    
    floatingIcons.forEach((icon, index) => {
        // Add random delay and duration
        icon.style.animationDelay = `${index * 0.5}s`;
        icon.style.animationDuration = `${6 + Math.random() * 3}s`;
        
        // Add random movement
        setInterval(() => {
            const x = Math.random() * 20 - 10;
            const y = Math.random() * 20 - 10;
            icon.style.transform = `translate(${x}px, ${y}px)`;
        }, 3000 + Math.random() * 2000);
    });
}

// Loading animation
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Hide notification after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);
}

// Logout function
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            showNotification('Logout failed', 'error');
        }
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Logout failed', 'error');
    }
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initParallax();
    initSmoothScroll();
    initScrollAnimations();
    initNavbarScroll();
    initFloatingIcons();
    
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--surface-color);
            color: var(--text-primary);
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: var(--shadow-medium);
            border: 1px solid var(--border-color);
            z-index: 3000;
            transform: translateX(400px);
            opacity: 0;
            transition: all 0.3s ease;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification.success {
            border-left: 4px solid #10b981;
        }
        
        .notification.error {
            border-left: 4px solid #ef4444;
        }
        
        .notification.info {
            border-left: 4px solid var(--primary-color);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-content i {
            font-size: 1.2rem;
        }
        
        .notification.success i {
            color: #10b981;
        }
        
        .notification.error i {
            color: #ef4444;
        }
        
        .notification.info i {
            color: var(--primary-color);
        }
        
        .animate-in {
            animation: slideInUp 0.6s ease-out;
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .navbar.scrolled {
            background: rgba(255, 255, 255, 0.98);
            box-shadow: var(--shadow-medium);
        }
        
        .dark-theme .navbar.scrolled {
            background: rgba(15, 23, 42, 0.98);
        }
    `;
    document.head.appendChild(style);
});

// Handle form submissions with better UX
function handleFormSubmission(form, submitHandler) {
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.innerHTML;
        
        // Show loading state
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitButton.disabled = true;
        
        try {
            await submitHandler(form);
        } catch (error) {
            console.error('Form submission error:', error);
            showNotification('An error occurred. Please try again.', 'error');
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    });
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions for use in other scripts
window.MoodVibe = {
    showLoading,
    hideLoading,
    showNotification,
    logout,
    formatDate,
    capitalizeFirst,
    debounce
};