/**
 * forgot-password.js - Trang quên mật khẩu (4 bước)
 * Bước 1: Xác minh username tồn tại -> Gửi OTP
 * Bước 2: Xác thực mã OTP 6 chữ số
 * Bước 3: Nhập mật khẩu mới -> Gửi kèm OTP -> server hash bcrypt rồi lưu
 * Bước 4: Thông báo thành công
 */

const API_BASE = '';

let verifiedUsername = '';
let verifiedOtp = '';
let timerInterval = null;

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
    box.classList.remove('hidden');
    box.style.display = 'flex';
}
function hideAlert(boxId) {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.style.display = 'none';
    box.classList.add('hidden');
}

// ─── Step transitions ─────────────────────────────────────────────────────────
const FORGOT_STEPS = [
    { id: 'step-1', num: 1 },
    { id: 'step-otp', num: 2 },
    { id: 'step-3', num: 3 },
    { id: 'step-4', num: 4 },
];

function goToStep(step) {
    let activeId = 'step-1';

    FORGOT_STEPS.forEach(({ id, num }) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (num === step) {
            el.classList.remove('hidden');
            activeId = id;
        } else {
            el.classList.add('hidden');
        }
    });

    const el = document.getElementById(activeId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

goToStep(1);

// Lắng nghe sự kiện click quay lại bước trước
document.addEventListener('click', (e) => {
    const backBtn = e.target.closest('.back-to-step');
    if (backBtn) {
        e.preventDefault();
        const step = parseInt(backBtn.getAttribute('data-back-to'));
        if (step) goToStep(step);
    }
});

// ─── OTP Resend Timer ─────────────────────────────────────────────────────────
function startOtpTimer() {
    const timerSpan = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('resend-otp-btn');
    if (!timerSpan || !resendBtn) return;

    let timeLeft = 60;
    timerSpan.textContent = timeLeft;
    resendBtn.classList.add('disabled-link');
    resendBtn.style.pointerEvents = 'none';
    resendBtn.style.opacity = '0.5';

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            resendBtn.classList.remove('disabled-link');
            resendBtn.style.pointerEvents = 'auto';
            resendBtn.style.opacity = '1';
            resendBtn.innerHTML = 'GỬI LẠI MÃ';
        }
    }, 1000);
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
            document.getElementById('display-masked-email').textContent = data.maskedEmail || 'chưa liên kết email';
            document.getElementById('display-username').textContent = username;
            
            goToStep(2);
            startOtpTimer();
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

// ─── STEP 2 (OTP): Verify OTP ─────────────────────────────────────────────────
const formOtp   = document.getElementById('forgot-form-otp');
const otpBtn    = document.getElementById('otp-btn');
const otpCodeEl = document.getElementById('otp-code');
const statusOtp = document.getElementById('status-otp-code');
const errOtp    = document.getElementById('err-otp-code');
const resendBtn = document.getElementById('resend-otp-btn');

if (otpCodeEl) {
    otpCodeEl.addEventListener('input', () => {
        const v = otpCodeEl.value.trim();
        if (!v) {
            statusOtp.className = 'field-status';
            errOtp.className = 'field-error';
            return;
        }
        if (/^\d{6}$/.test(v)) {
            statusOtp.className = 'field-status valid';
            errOtp.className = 'field-error';
            errOtp.textContent = '';
        } else {
            statusOtp.className = 'field-status invalid';
            errOtp.className = 'field-error show';
            errOtp.textContent = 'Mã OTP phải chứa đúng 6 chữ số';
        }
    });
}

if (formOtp) {
    formOtp.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert('forgot-alert-otp');

        const otp = otpCodeEl.value.trim();
        if (!otp || !/^\d{6}$/.test(otp)) {
            showAlert('forgot-alert-otp', 'Mã OTP phải chứa đúng 6 chữ số.', 'error');
            return;
        }

        otpBtn.classList.add('loading');
        otpBtn.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/api/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: verifiedUsername, otp })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                verifiedOtp = otp;
                goToStep(3);
            } else {
                showAlert('forgot-alert-otp', data.message || 'Mã OTP không chính xác hoặc đã hết hạn.', 'error');
            }
        } catch {
            showAlert('forgot-alert-otp', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra server.', 'error');
        } finally {
            otpBtn.classList.remove('loading');
            otpBtn.disabled = false;
        }
    });
}

if (resendBtn) {
    resendBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (resendBtn.classList.contains('disabled-link')) return;

        hideAlert('forgot-alert-otp');
        resendBtn.classList.add('disabled-link');
        resendBtn.style.pointerEvents = 'none';
        resendBtn.style.opacity = '0.5';

        try {
            const res = await fetch(`${API_BASE}/api/verify-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: verifiedUsername })
            });
            const data = await res.json();
            if (res.ok && data.exists) {
                showAlert('forgot-alert-otp', 'Mã OTP mới đã được gửi thành công!', 'success');
                startOtpTimer();
            } else {
                showAlert('forgot-alert-otp', data.message || 'Không thể gửi lại mã OTP.', 'error');
                resendBtn.classList.remove('disabled-link');
                resendBtn.style.pointerEvents = 'auto';
                resendBtn.style.opacity = '1';
            }
        } catch {
            showAlert('forgot-alert-otp', 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra server.', 'error');
            resendBtn.classList.remove('disabled-link');
            resendBtn.style.pointerEvents = 'auto';
            resendBtn.style.opacity = '1';
        }
    });
}

// ─── STEP 3: Reset password ───────────────────────────────────────────────────
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
        const res  = await fetch(`${API_BASE}/api/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: verifiedUsername, 
                otp: verifiedOtp,
                newPassword: newPw 
            })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            if (timerInterval) clearInterval(timerInterval);
            goToStep(4);
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
