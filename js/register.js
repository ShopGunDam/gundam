/**
 * register.js - Trang đăng ký tài khoản
 * Mật khẩu được hash bằng bcrypt phía server (saltRounds=10)
 */

const API_BASE = 'http://localhost:5000';

// ─── DOM References ───────────────────────────────────────────────────────────
const form         = document.getElementById('register-form');
const alertBox     = document.getElementById('register-alert');
const registerBtn  = document.getElementById('register-btn');

const fields = {
    fullname : { el: document.getElementById('reg-fullname'),  status: document.getElementById('status-fullname'),  err: document.getElementById('err-fullname') },
    username : { el: document.getElementById('reg-username'),  status: document.getElementById('status-username'),  err: document.getElementById('err-username') },
    email    : { el: document.getElementById('reg-email'),     status: document.getElementById('status-email'),     err: document.getElementById('err-email') },
    password : { el: document.getElementById('reg-password'),  status: document.getElementById('status-password'),  err: document.getElementById('err-password') },
    confirm  : { el: document.getElementById('reg-confirm'),   status: document.getElementById('status-confirm'),   err: document.getElementById('err-confirm') },
};

// ─── Particles ────────────────────────────────────────────────────────────────
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 4 + 1;
        const isBlue = Math.random() > 0.5;
        p.style.cssText = `
            width: ${size}px; height: ${size}px;
            left: ${Math.random() * 100}%;
            background: ${isBlue ? 'rgba(59,130,246,0.8)' : 'rgba(0,255,204,0.8)'};
            animation-duration: ${Math.random() * 12 + 8}s;
            animation-delay: ${Math.random() * 8}s;
        `;
        container.appendChild(p);
    }
}
createParticles();

// ─── Show / Hide alert ────────────────────────────────────────────────────────
function showAlert(message, type = 'error') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    alertBox.className = `auth-alert ${type}`;
    alertBox.innerHTML = `${icons[type] || ''} ${message}`;
    alertBox.style.display = 'flex';
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideAlert() {
    alertBox.style.display = 'none';
}

// ─── Field validation helpers ─────────────────────────────────────────────────
function setFieldState(key, isValid, message = '') {
    const { status, err } = fields[key];
    status.className = 'field-status ' + (isValid ? 'valid' : 'invalid');
    err.textContent = isValid ? '' : message;
    err.className = 'field-error' + (isValid ? '' : ' show');
}

function clearFieldState(key) {
    const { status, err } = fields[key];
    status.className = 'field-status';
    err.className = 'field-error';
    err.textContent = '';
}

// ─── Password Strength Meter ──────────────────────────────────────────────────
function calcStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score; // 0-5
}

function updateStrengthBar(pw, fillId, labelId) {
    const fill  = document.getElementById(fillId);
    const label = document.getElementById(labelId);
    if (!fill || !label) return;
    const score = calcStrength(pw);
    const pct   = (score / 5) * 100;
    const colors = ['#ef4444','#f97316','#eab308','#3b82f6','#00ffcc'];
    const labels = ['Rất yếu','Yếu','Trung bình','Mạnh','Rất mạnh'];
    fill.style.width    = `${pct}%`;
    fill.style.background = pw.length === 0 ? 'transparent' : colors[Math.max(0, score - 1)];
    label.textContent   = pw.length === 0 ? 'Nhập mật khẩu' : labels[Math.max(0, score - 1)];
    label.style.color   = pw.length === 0 ? '' : colors[Math.max(0, score - 1)];
    return score;
}

// ─── Live validation bindings ─────────────────────────────────────────────────
fields.fullname.el.addEventListener('input', () => {
    const v = fields.fullname.el.value.trim();
    if (!v) return clearFieldState('fullname');
    v.length >= 2
        ? setFieldState('fullname', true)
        : setFieldState('fullname', false, 'Tên phải có ít nhất 2 ký tự');
});

fields.username.el.addEventListener('input', () => {
    const v = fields.username.el.value.trim();
    if (!v) return clearFieldState('username');
    const ok = /^[a-zA-Z0-9_]{3,20}$/.test(v);
    ok ? setFieldState('username', true) : setFieldState('username', false, 'Username 3-20 ký tự, chỉ a-z 0-9 _');
});

fields.email.el.addEventListener('input', () => {
    const v = fields.email.el.value.trim();
    if (!v) return clearFieldState('email');
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    ok ? setFieldState('email', true) : setFieldState('email', false, 'Email không hợp lệ');
});

fields.password.el.addEventListener('input', () => {
    const v = fields.password.el.value;
    updateStrengthBar(v, 'strength-fill', 'strength-label');
    if (!v) return clearFieldState('password');
    v.length >= 8
        ? setFieldState('password', true)
        : setFieldState('password', false, 'Mật khẩu tối thiểu 8 ký tự');
    // Re-validate confirm
    if (fields.confirm.el.value) {
        fields.confirm.el.dispatchEvent(new Event('input'));
    }
});

fields.confirm.el.addEventListener('input', () => {
    const v  = fields.confirm.el.value;
    const pw = fields.password.el.value;
    if (!v) return clearFieldState('confirm');
    v === pw
        ? setFieldState('confirm', true)
        : setFieldState('confirm', false, 'Mật khẩu xác nhận không khớp');
});

// ─── Toggle password visibility ───────────────────────────────────────────────
function setupToggle(btnId, inputEl) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', () => {
        const show = inputEl.type === 'password';
        inputEl.type = show ? 'text' : 'password';
        btn.querySelector('i').className = show ? 'bx bx-show' : 'bx bx-hide';
    });
}
setupToggle('toggle-pw1', fields.password.el);
setupToggle('toggle-pw2', fields.confirm.el);

// ─── Form submit ──────────────────────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const fullname = fields.fullname.el.value.trim();
    const username = fields.username.el.value.trim();
    const email    = fields.email.el.value.trim();
    const password = fields.password.el.value;
    const confirm  = fields.confirm.el.value;
    const agreed   = document.getElementById('agree-terms').checked;

    // Client-side validation
    let hasError = false;

    if (!fullname || fullname.length < 2) {
        setFieldState('fullname', false, 'Vui lòng nhập tên đầy đủ (ít nhất 2 ký tự)');
        hasError = true;
    }
    if (!username || !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        setFieldState('username', false, 'Username 3-20 ký tự, chỉ a-z 0-9 _');
        hasError = true;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFieldState('email', false, 'Vui lòng nhập email hợp lệ');
        hasError = true;
    }
    if (!password || password.length < 8) {
        setFieldState('password', false, 'Mật khẩu tối thiểu 8 ký tự');
        hasError = true;
    }
    if (!confirm || confirm !== password) {
        setFieldState('confirm', false, 'Mật khẩu xác nhận không khớp');
        hasError = true;
    }
    if (!agreed) {
        const errTerms = document.getElementById('err-terms');
        errTerms.textContent = 'Bạn phải đồng ý với điều khoản sử dụng';
        errTerms.className = 'field-error show';
        hasError = true;
    } else {
        document.getElementById('err-terms').className = 'field-error';
    }

    if (hasError) {
        showAlert('Vui lòng kiểm tra lại thông tin và sửa các lỗi bên trên.', 'error');
        return;
    }

    // Loading state
    registerBtn.classList.add('loading');
    registerBtn.disabled = true;

    try {
        /**
         * Gửi mật khẩu plain-text lên server.
         * Server sẽ hash bằng bcrypt (saltRounds=10) TRƯỚC KHI lưu vào DB.
         * Không bao giờ lưu plain-text vào database.
         */
        const response = await fetch(`${API_BASE}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, name: fullname, email })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showAlert('🎉 Đăng ký thành công! Mật khẩu đã được mã hóa bcrypt và lưu vào hệ thống. Đang chuyển hướng...', 'success');
            form.reset();
            // Clear all field states
            Object.keys(fields).forEach(k => clearFieldState(k));
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
        } else {
            const msg = data.error || data.message || 'Đăng ký thất bại. Vui lòng thử lại.';
            if (msg.toLowerCase().includes('username') || msg.includes('tên đăng nhập')) {
                setFieldState('username', false, msg);
            } else if (msg.toLowerCase().includes('email')) {
                setFieldState('email', false, msg);
            }
            showAlert(msg, 'error');
        }
    } catch (err) {
        showAlert('Không thể kết nối tới máy chủ. Vui lòng kiểm tra server đang chạy tại cổng 5000.', 'error');
        console.error('[Register Error]', err);
    } finally {
        registerBtn.classList.remove('loading');
        registerBtn.disabled = false;
    }
});
