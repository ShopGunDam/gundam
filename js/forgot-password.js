/**
 * forgot-password.js - Trang quên mật khẩu (3 bước)
 * Bước 1: Xác minh username tồn tại
 * Bước 2: Nhập mật khẩu mới → server hash bcrypt rồi lưu
 * Bước 3: Thông báo thành công
 */

const API_BASE = 'http://localhost:5000';

let verifiedUsername = '';

// ─── Particles ────────────────────────────────────────────────────────────────
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 3 + 1;
        const isBlue = Math.random() > 0.5;
        p.style.cssText = `
            width: ${size}px; height: ${size}px;
            left: ${Math.random() * 100}%;
            background: ${isBlue ? 'rgba(59,130,246,0.8)' : 'rgba(0,255,204,0.8)'};
            animation-duration: ${Math.random() * 15 + 8}s;
            animation-delay: ${Math.random() * 8}s;
        `;
        container.appendChild(p);
    }
}
createParticles();

// ─── Alerts ───────────────────────────────────────────────────────────────────
function showAlert(boxId, message, type = 'error') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const box = document.getElementById(boxId);
    if (!box) return;
    box.className = `auth-alert ${type}`;
    box.innerHTML = `${icons[type] || ''} ${message}`;
    box.style.display = 'flex';
}
function hideAlert(boxId) {
    const box = document.getElementById(boxId);
    if (box) box.style.display = 'none';
}

// ─── Step transitions ─────────────────────────────────────────────────────────
function goToStep(step) {
    document.getElementById('step-1').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('step-2').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('step-3').style.display = step === 3 ? 'block' : 'none';

    // Scroll to form
    const el = document.getElementById(`step-${step}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ─── Password Strength ────────────────────────────────────────────────────────
function calcStrength(pw) {
    let score = 0;
    if (pw.length >= 8)            score++;
    if (pw.length >= 12)           score++;
    if (/[A-Z]/.test(pw))         score++;
    if (/[0-9]/.test(pw))         score++;
    if (/[^A-Za-z0-9]/.test(pw))  score++;
    return score;
}

function updateStrengthBar(pw, fillId, labelId) {
    const fill  = document.getElementById(fillId);
    const label = document.getElementById(labelId);
    if (!fill || !label) return;
    const score = calcStrength(pw);
    const colors = ['#ef4444','#f97316','#eab308','#3b82f6','#00ffcc'];
    const labels = ['Rất yếu','Yếu','Trung bình','Mạnh','Rất mạnh'];
    fill.style.width      = pw.length === 0 ? '0%' : `${(score / 5) * 100}%`;
    fill.style.background = pw.length === 0 ? 'transparent' : colors[Math.max(0, score - 1)];
    label.textContent     = pw.length === 0 ? 'Nhập mật khẩu' : labels[Math.max(0, score - 1)];
    label.style.color     = pw.length === 0 ? '' : colors[Math.max(0, score - 1)];
}

// ─── Toggle password buttons ──────────────────────────────────────────────────
function setupToggle(btnId, inputId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
        const show   = input.type === 'password';
        input.type   = show ? 'text' : 'password';
        btn.querySelector('i').className = show ? 'bx bx-show' : 'bx bx-hide';
    });
}
setupToggle('toggle-np',  'new-password');
setupToggle('toggle-cnp', 'confirm-new-password');

// ─── Live validation: new-password ───────────────────────────────────────────
const newPwEl  = document.getElementById('new-password');
const cnpEl    = document.getElementById('confirm-new-password');
const statusNp = document.getElementById('status-new-pw');
const errNp    = document.getElementById('err-new-pw');
const statusCnp = document.getElementById('status-cnp');
const errCnp    = document.getElementById('err-cnp');

newPwEl.addEventListener('input', () => {
    const v = newPwEl.value;
    updateStrengthBar(v, 'fp-strength-fill', 'fp-strength-label');
    if (!v) { statusNp.className = 'field-status'; errNp.className = 'field-error'; return; }
    if (v.length >= 8) {
        statusNp.className = 'field-status valid'; errNp.className = 'field-error'; errNp.textContent = '';
    } else {
        statusNp.className = 'field-status invalid';
        errNp.className = 'field-error show'; errNp.textContent = 'Mật khẩu tối thiểu 8 ký tự';
    }
    if (cnpEl.value) cnpEl.dispatchEvent(new Event('input'));
});

cnpEl.addEventListener('input', () => {
    const v  = cnpEl.value;
    const pw = newPwEl.value;
    if (!v) { statusCnp.className = 'field-status'; errCnp.className = 'field-error'; return; }
    if (v === pw) {
        statusCnp.className = 'field-status valid'; errCnp.className = 'field-error'; errCnp.textContent = '';
    } else {
        statusCnp.className = 'field-status invalid';
        errCnp.className = 'field-error show'; errCnp.textContent = 'Mật khẩu xác nhận không khớp';
    }
});

// ─── STEP 1: Verify username ──────────────────────────────────────────────────
const form1     = document.getElementById('forgot-form-1');
const verifyBtn = document.getElementById('verify-btn');

form1.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('forgot-alert-1');

    const username = document.getElementById('forgot-username').value.trim();
    if (!username) {
        showAlert('forgot-alert-1', 'Vui lòng nhập tên đăng nhập.', 'error');
        return;
    }

    verifyBtn.classList.add('loading');
    verifyBtn.disabled = true;

    try {
        const res  = await fetch(`${API_BASE}/api/verify-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();

        if (res.ok && data.exists) {
            verifiedUsername = username;
            document.getElementById('display-username').textContent = username;
            goToStep(2);
        } else {
            const msg = data.message || 'Không tìm thấy tài khoản với username này.';
            showAlert('forgot-alert-1', msg, 'error');
        }
    } catch {
        showAlert('forgot-alert-1', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra server.', 'error');
    } finally {
        verifyBtn.classList.remove('loading');
        verifyBtn.disabled = false;
    }
});

// ─── STEP 2: Reset password ───────────────────────────────────────────────────
const form2    = document.getElementById('forgot-form-2');
const resetBtn = document.getElementById('reset-btn');

form2.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert('forgot-alert-2');

    const newPw  = newPwEl.value;
    const cnfPw  = cnpEl.value;
    let hasError = false;

    if (!newPw || newPw.length < 8) {
        statusNp.className = 'field-status invalid';
        errNp.className = 'field-error show'; errNp.textContent = 'Mật khẩu tối thiểu 8 ký tự';
        hasError = true;
    }
    if (!cnfPw || cnfPw !== newPw) {
        statusCnp.className = 'field-status invalid';
        errCnp.className = 'field-error show'; errCnp.textContent = 'Mật khẩu xác nhận không khớp';
        hasError = true;
    }
    if (hasError) {
        showAlert('forgot-alert-2', 'Vui lòng kiểm tra lại thông tin mật khẩu.', 'error');
        return;
    }

    resetBtn.classList.add('loading');
    resetBtn.disabled = true;

    try {
        /**
         * Gửi username + mật khẩu mới lên server.
         * Server sẽ hash bằng bcrypt (saltRounds=10) rồi UPDATE vào bảng taikhoan.
         * Không bao giờ lưu plain-text vào database.
         */
        const res  = await fetch(`${API_BASE}/api/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: verifiedUsername, newPassword: newPw })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            goToStep(3);
        } else {
            showAlert('forgot-alert-2', data.message || data.error || 'Cập nhật mật khẩu thất bại.', 'error');
        }
    } catch {
        showAlert('forgot-alert-2', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra server.', 'error');
    } finally {
        resetBtn.classList.remove('loading');
        resetBtn.disabled = false;
    }
});
