/**
 * login-api.js - Xử lý đăng nhập với backend API
 * Kết nối tới /api/login để xác thực người dùng
 */

const API_BASE = 'http://localhost:5000';

const loginForm = document.querySelector('.login-form');
const loginBtn  = document.querySelector('.login-btn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showLoginAlert('Vui lòng nhập đầy đủ thông tin.', 'error');
            return;
        }

        // Loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> ĐANG KIỂM TRA...';

        try {
            const res  = await fetch(`${API_BASE}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                // Lưu session
                sessionStorage.setItem('gunpla_user', username);
                sessionStorage.setItem('gunpla_role', data.role);

                showLoginAlert(`✅ Đăng nhập thành công! Chào mừng <strong>${username}</strong>. Đang chuyển hướng...`, 'success');

                setTimeout(() => {
                    if (data.role === 'Admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1500);
            } else {
                showLoginAlert(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng.', 'error');
            }
        } catch {
            showLoginAlert('Không thể kết nối tới máy chủ. Vui lòng kiểm tra server đang chạy.', 'error');
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="bx bx-log-in-circle"></i> KHỞI CHẠY ĐĂNG NHẬP';
        }
    });
}

function showLoginAlert(message, type = 'error') {
    // Remove existing alert
    const existing = document.querySelector('.login-alert-box');
    if (existing) existing.remove();

    const alert = document.createElement('div');
    alert.className = `auth-alert ${type} login-alert-box`;
    alert.style.cssText = `
        display: flex;
        padding: 12px 16px;
        margin-bottom: 20px;
        font-family: 'Roboto', sans-serif;
        font-size: 0.88rem;
        border-left: 3px solid ${type === 'success' ? '#00ffcc' : '#ef4444'};
        background: ${type === 'success' ? 'rgba(0,255,204,0.1)' : 'rgba(239,68,68,0.1)'};
        color: ${type === 'success' ? '#00ffcc' : '#ef4444'};
        clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px);
        animation: fadeSlideIn 0.3s ease;
        gap: 8px;
        align-items: center;
    `;
    alert.innerHTML = message;

    // Insert before the submit button
    const btn = document.querySelector('.login-btn');
    btn.parentNode.insertBefore(alert, btn);

    // Auto remove after 5s
    setTimeout(() => {
        if (alert.parentNode) alert.remove();
    }, 5000);
}
