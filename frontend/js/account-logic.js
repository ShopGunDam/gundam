/**
 * account-logic.js - Xử lý dữ liệu thực từ Backend cho trang Account
 */

const API_URL = '/api';
const username = sessionStorage.getItem('gunpla_user');

if (!username) {
    window.location.href = 'login.html';
}

// --- 0. HIỂN THỊ TỨC THÌ TỪ SESSION (Xóa bỏ "Phi công dự bị" ngay lập tức) ---
const tempName = sessionStorage.getItem('gunpla_display_name');
const tempImg = sessionStorage.getItem('gunpla_user_img');
if (tempName) document.getElementById('display-fullname').innerText = tempName.toUpperCase();
if (tempImg) {
    document.getElementById('user-avatar-main').src = tempImg;
}

// --- 1. LẤY DỮ LIỆU TỪ BACKEND ---
async function loadPilotProfile() {
    try {
        const res = await requestApi(`/api/profile/${encodeURIComponent(username)}`);
        const data = await res.json();

        if (res.ok) {
            // Hiển thị lên Sidebar
            document.getElementById('display-fullname').innerText = data.TenKH.toUpperCase();
            
            // Cập nhật Rank dựa trên vai trò
            const role = sessionStorage.getItem('gunpla_role') || 'User';
            const rankEl = document.querySelector('.profile-rank');
            if (rankEl) rankEl.innerText = role === 'Admin' ? 'RANK: COMMANDER (ADMIN)' : 'RANK: PILOT (CUSTOMER)';
            
            // Xử lý ảnh đại diện
            const avatarImg = document.getElementById('user-avatar-main');
            const googleImg = sessionStorage.getItem('gunpla_user_img');
            
            // Kiểm tra thứ tự ưu tiên: 1. Ảnh đã upload (trong DB) -> 2. Ảnh Google -> 3. Ảnh mặc định
            let finalImg = 'assets/images/default-gundam-avatar.png';
            
            if (data.HinhAnh && data.HinhAnh.trim() !== '') {
                // Nếu là link ảnh cục bộ (không phải http), nối thêm host
                const baseUrl = API_URL.replace('/api', '');
                const cleanPath = data.HinhAnh.startsWith('/') ? data.HinhAnh.substring(1) : data.HinhAnh;
                finalImg = (data.HinhAnh.startsWith('http')) ? data.HinhAnh : `${baseUrl}/${cleanPath}`;
            } else if (googleImg) {
                finalImg = googleImg;
                // Nếu là Google, ẩn nút upload để tránh xung đột
                document.getElementById('upload-icon-trigger').style.display = 'none';
            }
            
            avatarImg.src = finalImg;
            avatarImg.onerror = () => { avatarImg.src = 'assets/images/default-gundam-avatar.png'; };

            // Lưu lại vào session để đồng bộ header ngay lập tức
            sessionStorage.setItem('gunpla_user_img', finalImg);
            if (typeof updateHeaderAuth === 'function') updateHeaderAuth();

            // Điền vào Form chỉnh sửa
            document.getElementById('edit-name').value = data.TenKH;
            document.getElementById('edit-email').value = data.Email;
            document.getElementById('edit-phone').value = data.SDT || '';
            document.getElementById('edit-address').value = data.DiaChi || '';
            document.getElementById('edit-username').value = username;
            
            // Cập nhật điểm tích lũy giả lập hoặc từ DB nếu có
            if (document.getElementById('stat-points')) {
                document.getElementById('stat-points').innerText = data.DiemTichLuy || '0';
            }
        }
    } catch (err) {
        console.error("Lỗi truy xuất hồ sơ:", err);
    }
}

// --- 1.2 LẤY LỊCH SỬ ĐƠN HÀNG THỰC ---
async function loadOrderHistory() {
    const tableBody = document.querySelector('.history-table tbody');
    if (!tableBody) return;

    try {
        const res = await requestApi(`/api/orders/${encodeURIComponent(username)}`);
        const orders = await res.json();

        if (orders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 40px; color: var(--text-muted);">Bạn chưa có giao dịch nào trên hệ thống.</td></tr>`;
            return;
        }

        tableBody.innerHTML = orders.map(order => {
            const statusClass = order.TrangThai === 'Paid' || order.TrangThai === 'Shipped' ? 'status-delivered' : 
                                (order.TrangThai === 'Cancelled' ? 'status-cancelled' : 'status-processing');
            const statusText = order.TrangThai === 'Paid' ? 'Đã thanh toán' : 
                               (order.TrangThai === 'Shipped' ? 'Đang giao' : 
                               (order.TrangThai === 'Cancelled' ? 'Đã hủy' : 'Đang xử lý'));
            
            const date = new Date(order.NgayLap).toLocaleDateString('vi-VN');
            const productName = order.SoLuongSP > 1 ? `${order.SanPhamChinh} (+${order.SoLuongSP - 1})` : order.SanPhamChinh;

            return `
                <tr>
                    <td><span class="order-id">#GSTORE-${order.MaHD}</span></td>
                    <td>${date}</td>
                    <td>${productName || 'N/A'}</td>
                    <td>${order.TongTien.toLocaleString()}₫</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        }).join('');
        
        // Cập nhật số lượng đơn hàng vào ID cụ thể
        const orderCountEl = document.getElementById('stat-order-count');
        if (orderCountEl) {
            orderCountEl.innerText = orders.length;
        }
    } catch (err) {
        console.error("Lỗi tải lịch sử đơn hàng:", err);
    }
}

// --- 2. XỬ LÝ CHUYỂN ĐỔI PANEL ---
const historyPanel = document.getElementById('history-panel');
const editPanel = document.getElementById('edit-profile-panel');

document.getElementById('edit-profile-trigger').addEventListener('click', () => {
    historyPanel.classList.add('hidden-panel');
    editPanel.classList.remove('hidden-panel');
});

document.getElementById('back-to-history').addEventListener('click', () => {
    editPanel.classList.add('hidden-panel');
    historyPanel.classList.remove('hidden-panel');
});

document.getElementById('quick-edit-name-btn').addEventListener('click', () => {
    historyPanel.classList.add('hidden-panel');
    editPanel.classList.remove('hidden-panel');
    // Focus vào ô nhập tên và bôi đen để sửa nhanh
    const nameInput = document.getElementById('edit-name');
    nameInput.focus();
    nameInput.select();
});

// --- 3. XỬ LÝ UPLOAD ẢNH (DÀNH CHO TK THƯỜNG) ---
document.getElementById('avatar-input').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
        const res = await requestApi('/api/upload', { method: 'POST', body: formData }); 
        const data = await res.json();
        if (data.url) {
            const baseUrl = API_URL.replace('/api', '');
            const fullUrl = `${baseUrl}/${data.url.startsWith('/') ? data.url.substring(1) : data.url}`;
            document.getElementById('user-avatar-main').src = fullUrl;
            sessionStorage.setItem('gunpla_user_img', fullUrl); // Lưu URL tuyệt đối vào sessionStorage
            updateHeaderAuth(); 
            alert("Ảnh đại diện đã được tải lên hệ thống!");
        }
    } catch (err) {
        alert("Lỗi tải ảnh!");
    }
});

// --- 4. CẬP NHẬT HỒ SƠ ---
document.getElementById('update-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    btn.disabled = true;
    btn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> ĐANG CẬP NHẬT...";

    const payload = {
        name: document.getElementById('edit-name').value,
        email: document.getElementById('edit-email').value,
        phone: document.getElementById('edit-phone').value,
        address: document.getElementById('edit-address').value,
        avatar: document.getElementById('user-avatar-main').src
    };

    try {
        const res = await requestApi(`/api/profile/${encodeURIComponent(username)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("✅ Hồ sơ phi công đã được cập nhật!");
            sessionStorage.setItem('gunpla_display_name', payload.name);
            await loadPilotProfile(); // Tải lại dữ liệu lên UI
            updateHeaderAuth(); // Cập nhật tên trên Header
            document.getElementById('back-to-history').click();
        } else {
            const errData = await res.json();
            alert("❌ Lỗi hệ thống: " + (errData.error || "Không thể cập nhật hồ sơ"));
        }
    } catch (err) {
        alert("❌ Lỗi kết nối máy chủ: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = "<i class='bx bx-save'></i> LƯU THAY ĐỔI";
    }
});

// --- 5. ĐĂNG XUẤT ---
document.getElementById('logout-btn').addEventListener('click', () => {
    sessionStorage.clear();
    localStorage.removeItem('gst_admin_logged');
    window.location.href = 'login.html';
});

// Khởi chạy
loadPilotProfile();
loadOrderHistory();