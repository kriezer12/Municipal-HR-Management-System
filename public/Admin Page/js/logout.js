/* Shared Logout Functionality */
document.addEventListener('DOMContentLoaded', function() {
    // Logout functionality - support both ID formats
    const logoutModal = document.getElementById('logout-modal');
    const logoutBtn = document.getElementById('logout-btn') || document.getElementById('logoutBtn');
    const cancelLogoutBtn = document.getElementById('cancel-logout');
    const confirmLogoutBtn = document.getElementById('confirm-logout');

    if (logoutBtn && logoutModal) {
        // Logout modal handlers
        logoutBtn.addEventListener('click', () => {
            logoutModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', () => {
                logoutModal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }

        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', () => {
                // Clear local storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                
                // Redirect to landing page
                window.location.href = '../Landing Page/landing.html';
            });
        }

        // Close logout modal when clicking outside
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});
