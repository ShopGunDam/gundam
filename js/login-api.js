/**
 * login-api.js - Xử lý đăng nhập với backend API
 * Kết nối tới /api/login để xác thực người dùng
 */

const API_BASE = 'http://localhost:5000';

// Tải Google Client ID động từ Backend (Bảo mật, tránh lộ Client ID trong file HTML tĩnh)
(async function initGoogleConfig() {
    try {
        const response = await fetch(`${API_BASE}/api/config/google-client-id`);
        const data = await response.json();
        if (data.clientId) {
            window.GOOGLE_CLIENT_ID = data.clientId;
            // Nếu SDK của Google đã load xong trước khi API trả về, chạy khởi tạo ngay
            if (window.google && !googleTokenClient) {
                window.onGoogleLibraryLoad();
            }
        }
    } catch (err) {
        console.error('[GOOGLE] Không thể tải cấu hình Client ID:', err);
    }
})();

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

// ─── GOOGLE SIGN-IN ───────────────────────────────────────────────────────────
let googleTokenClient = null;

// Callback chính thức của Google SDK — được gọi tự động ngay khi SDK tải xong
window.onGoogleLibraryLoad = function () {
    if (!window.GOOGLE_CLIENT_ID) return;
    googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: window.GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (tokenResponse) => {
            resetGoogleBtn();
            if (tokenResponse.error) {
                // Người dùng đóng popup hoặc huỷ → chỉ reset nút, không hiện lỗi
                if (tokenResponse.error === 'access_denied' || tokenResponse.error === 'popup_closed_by_user') {
                    return;
                }
                showLoginAlert('Đăng nhập Google bị huỷ hoặc thất bại.', 'error');
                return;
            }
            await handleGoogleLogin(tokenResponse.access_token);
        },
        error_callback: (err) => {
            // Xử lý khi popup bị đóng / bị chặn
            resetGoogleBtn();
            if (err.type === 'popup_closed' || err.type === 'popup_failed_to_open') {
                // Popup bị đóng → im lặng, chỉ reset nút
                return;
            }
            showLoginAlert('Không thể kết nối tới Google. Vui lòng thử lại.', 'error');
        }
    });
    console.log('[GOOGLE] SDK ready ✅');
};

function startGoogleAuth() {
    // Kiểm tra giao thức file:// local
    if (window.location.protocol === 'file:') {
        showLoginAlert('⚠️ Google Sign-In yêu cầu chạy qua server. Vui lòng truy cập: <a href="http://localhost:5000/login.html" style="color:var(--neon-green); text-decoration:underline; font-weight:bold;">http://localhost:5000/login.html</a>', 'error');
        return;
    }

    // Nếu SDK chưa load xong, thử init lại ngay lập tức
    if (!googleTokenClient && window.google && window.GOOGLE_CLIENT_ID) {
        window.onGoogleLibraryLoad();
    }

    if (!googleTokenClient) {
        showLoginAlert('Google SDK chưa sẵn sàng. Vui lòng tải lại trang hoặc kiểm tra kết nối mạng.', 'error');
        return;
    }

    const btn = document.getElementById('google-login-btn');
    if (btn) {
        btn.classList.add('loading');
        btn.innerHTML = '<i class="bx bx-loader-alt bx-spin" style="font-size:1.1rem;"></i> <span>Đang kết nối...</span>';
    }

    // Mở popup Google — prompt: 'select_account' để luôn hiện bảng chọn tài khoản
    googleTokenClient.requestAccessToken({ prompt: 'select_account' });
}

async function handleGoogleLogin(accessToken) {
    try {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ access_token: accessToken })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            sessionStorage.setItem('gunpla_user', data.username);
            sessionStorage.setItem('gunpla_role', data.role);
            sessionStorage.setItem('gunpla_display_name', data.displayName || data.username);

            showLoginAlert(`✅ Xin chào <strong>${data.displayName || data.username}</strong>! Đang chuyển hướng...`, 'success');

            setTimeout(() => {
                window.location.href = data.role === 'Admin' ? 'admin.html' : 'index.html';
            }, 1500);
        } else {
            showLoginAlert(data.message || 'Đăng nhập Google thất bại.', 'error');
            resetGoogleBtn();
        }
    } catch {
        showLoginAlert('Không thể kết nối tới máy chủ. Vui lòng kiểm tra server.', 'error');
        resetGoogleBtn();
    }
}

function resetGoogleBtn() {
    const btn = document.getElementById('google-login-btn');
    if (!btn) return;
    btn.classList.remove('loading');
    btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span>Google</span>`;
}

// Gán sự kiện click cho nút Google an toàn
function setupGoogleBtn() {
    const googleBtn = document.getElementById('google-login-btn');
    if (googleBtn) {
        // Gỡ bỏ listener cũ nếu có để tránh lặp
        googleBtn.removeEventListener('click', startGoogleAuth);
        googleBtn.addEventListener('click', startGoogleAuth);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupGoogleBtn);
} else {
    setupGoogleBtn();
}
