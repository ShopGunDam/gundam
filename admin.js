/* =========================================
   ADMIN DASHBOARD LOGIC
   ========================================= */

// --- INITIAL DATA (CLEARED FOR MIGRATION) ---
const INITIAL_PRODUCTS = [];

const INITIAL_USERS = [];

// --- FORCED RESET FOR DATA MIGRATION ---
localStorage.removeItem('gst_products');
localStorage.removeItem('gst_users');

// --- APP STATE ---
const state = {
    products: [],
    users: [],
    currentView: 'overview',
    apiUrl: 'http://localhost:5000/api'
};

// --- DATA FETCHING ---
async function fetchProducts() {
    try {
        const response = await fetch(`${state.apiUrl}/products`);
        state.products = await response.json();
        renderView(state.currentView);
    } catch (err) {
        console.error("Failed to fetch products:", err);
    }
}

// --- AUTHENTICATION ---
function checkAuth() {
    const isAdmin = localStorage.getItem('gst_admin_logged');
    const overlay = document.getElementById('auth-overlay');
    
    if (isAdmin === 'true') {
        setTimeout(async () => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 500);
            await fetchProducts(); // Load data from SQL
            renderView('overview');
        }, 1500);
    } else {
        window.location.href = 'login.html';
    }
}

// (saveData is no longer needed globally as we save individually per action)

// --- VIEW RENDERING ---
function renderView(viewName) {
    state.currentView = viewName;
    const mainContent = document.getElementById('main-content');
    
    // Update active link
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewName);
    });

    switch(viewName) {
        case 'overview':
            mainContent.innerHTML = renderOverview();
            break;
        case 'warehouse':
            mainContent.innerHTML = renderWarehouse();
            break;
        case 'accounts':
            mainContent.innerHTML = renderAccounts();
            break;
        case 'invoices':
            mainContent.innerHTML = `
                <div class="page-header">
                    <h2 class="admin-title">HÓA ĐƠN <span class="highlight">Hệ Thống</span></h2>
                </div>
                <div class="content-panel">
                    <div style="padding: 100px; text-align: center; color: var(--text-muted);">
                        <i class='bx bx-file-blank' style="font-size: 5rem; display: block; margin-bottom: 20px;"></i>
                        DỮ LIỆU HÓA ĐƠN TRỐNG
                    </div>
                </div>`;
            break;
        default:
            mainContent.innerHTML = `<h2 class="admin-title">ĐANG PHÁT TRIỂN...</h2>`;
    }
}

// -- Overview Component --
function renderOverview() {
    const totalStock = state.products.reduce((acc, p) => acc + p.stock, 0);
    return `
        <div class="page-header">
            <h2 class="admin-title">HỆ THỐNG <span class="highlight">TỔNG QUAN</span></h2>
            <div class="system-label"><span class="status-dot"></span> CONNECTED</div>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <i class='bx bx-trending-up stat-icon'></i>
                <span class="stat-value">12.5M₫</span>
                <span class="stat-label">Doanh thu tháng này</span>
            </div>
            <div class="stat-card">
                <i class='bx bx-package stat-icon'></i>
                <span class="stat-value">${totalStock}</span>
                <span class="stat-label">Mô hình trong kho</span>
            </div>
            <div class="stat-card">
                <i class='bx bx-user stat-icon'></i>
                <span class="stat-value">${state.users.length}</span>
                <span class="stat-label">Phi công đăng ký</span>
            </div>
        </div>

        <div class="content-panel">
            <div class="panel-header">
                <h3 class="panel-title">MẶC HÀNG SẮP HẾT</h3>
            </div>
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã mô hình</th>
                            <th>Tên sản phẩm</th>
                            <th>Series</th>
                            <th>Số lượng</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.products.filter(p => p.stock <= 5).map(p => `
                            <tr>
                                <td class="id-cell">${p.id}</td>
                                <td>${p.name}</td>
                                <td>${p.series}</td>
                                <td>${p.stock}</td>
                                <td><span class="status-badge ${p.stock === 0 ? 'status-low' : 'status-low'}">${p.stock === 0 ? 'Hết hàng' : 'Sắp hết'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// -- Warehouse Component --
function renderWarehouse() {
    return `
        <div class="page-header">
            <h2 class="admin-title">QUẢN LÝ <span class="highlight">KHO HÀNG</span></h2>
            <button class="btn btn-primary" onclick="showAddProductModal()">
                <i class='bx bx-plus'></i> THÊM MẶC HÀNG
            </button>
        </div>
        
        <div class="content-panel">
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Sản phẩm</th>
                            <th>Series</th>
                            <th>Đơn giá</th>
                            <th>Kho</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.products.map(p => `
                            <tr>
                                <td class="id-cell">${p.id}</td>
                                <td>${p.name}</td>
                                <td>${p.series}</td>
                                <td>${p.price}</td>
                                <td>${p.stock}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" title="Chỉnh sửa"><i class='bx bx-edit-alt'></i></button>
                                        <button class="action-btn delete" onclick="deleteProduct('${p.id}')" title="Xóa"><i class='bx bx-trash'></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// -- Accounts Component --
function renderAccounts() {
    return `
        <div class="page-header">
            <h2 class="admin-title">QUẢN LÝ <span class="highlight">TÀI KHOẢN</span></h2>
            <button class="btn btn-primary" onclick="showAddUserModal()">
                <i class='bx bx-user-plus'></i> THÊM TÀI KHOẢN
            </button>
        </div>
        
        <div class="content-panel">
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Phi công ID</th>
                            <th>Họ tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Ngày tham gia</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.users.map(u => `
                            <tr>
                                <td class="id-cell">${u.id}</td>
                                <td>${u.name}</td>
                                <td>${u.email}</td>
                                <td><span class="status-badge ${u.role === 'Admin' ? 'status-instock' : ''}">${u.role}</span></td>
                                <td>${u.joined}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn" title="Chỉnh sửa"><i class='bx bx-edit-alt'></i></button>
                                        <button class="action-btn delete" onclick="deleteUser('${u.id}')" title="Xóa"><i class='bx bx-trash'></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// --- CRUD OPERATIONS ---
async function deleteProduct(id) {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm ${id}?`)) {
        try {
            const response = await fetch(`${state.apiUrl}/products/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await fetchProducts();
                renderView('warehouse');
            }
        } catch (err) {
            alert("Lỗi khi xóa sản phẩm: " + err.message);
        }
    }
}

function deleteUser(id) {
    if(id === 'USR-001') return alert("Không thể xóa tài khoản Admin hệ thống!");
    if (confirm(`Bạn có chắc muốn xóa tài khoản ${id}?`)) {
        state.users = state.users.filter(u => u.id !== id);
        saveData();
        renderView('accounts');
    }
}

// --- MODALS ---
const modal = document.getElementById('modal-container');

function showAddProductModal() {
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content wide">
            <div class="modal-header">
                <h3 class="modal-title">HỆ THỐNG <span class="highlight">NHẬP MÔ HÌNH MỚI</span></h3>
            </div>
            
            <form id="add-product-form" class="admin-form">
                <div class="modal-grid">
                    <!-- Left: Image Section -->
                    <div class="modal-left">
                        <label>ẢNH MÔ HÌNH (SƠ ĐỒ)</label>
                        <div class="image-upload-wrapper" id="img-upload-trigger" style="cursor: pointer;">
                            <i class='bx bx-cloud-upload'></i>
                            <span>CHỌN ẢNH TỪ HỆ THỐNG</span>
                            <img id="img-preview" src="" style="display:none; width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                        </div>
                        <input type="file" id="p-img-file" style="display:none" accept="image/*">
                        <input type="text" id="p-img-url" placeholder="Hoặc nhập URL ảnh..." style="margin-top: 10px; font-size: 0.75rem;">
                    </div>

                    <!-- Right: Info Section -->
                    <div class="modal-right">
                        <div class="form-group">
                            <label>MÃ ĐỊNH DANH (ID)</label>
                            <input type="text" id="p-id" value="GP-${Math.floor(Date.now()/100000)}" readonly>
                        </div>
                        <div class="form-group">
                            <label>TÊN SẢN PHẨM</label>
                            <input type="text" id="p-name" placeholder="Ví dụ: Gundam Exia" required>
                        </div>
                        <div class="form-group">
                            <label>LINH KIỆN / SERIES</label>
                            <select id="p-series">
                                <option>Perfect Grade (PG)</option>
                                <option>Master Grade (MG)</option>
                                <option>Real Grade (RG)</option>
                                <option>High Grade (HG)</option>
                                <option>Phụ Kiện</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ĐƠN GIÁ (₫)</label>
                            <input type="text" id="p-price" placeholder="1,000,000₫" required>
                        </div>
                        <div class="form-group">
                            <label>SỐ LƯỢNG KHO</label>
                            <input type="number" id="p-stock" value="10" required>
                        </div>
                    </div>
                </div>

                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY LỆNH</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-product">XÁC NHẬN CẬP NHẬT KHO</button>
                </div>
            </form>
        </div>
    `;

    const imgUploadTrigger = document.getElementById('img-upload-trigger');
    const imgFileInput = document.getElementById('p-img-file');
    const imgUrlInput = document.getElementById('p-img-url');
    const imgPreview = document.getElementById('img-preview');
    const uploadIcon = imgUploadTrigger.querySelector('i');
    const uploadText = imgUploadTrigger.querySelector('span');

    // Trigger file picker
    imgUploadTrigger.onclick = () => imgFileInput.click();

    // Handle file selection
    imgFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                imgPreview.style.display = 'block';
                uploadIcon.style.display = 'none';
                uploadText.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    };

    // Keep URL input sync
    imgUrlInput.oninput = () => {
        if(imgUrlInput.value) {
            imgPreview.src = imgUrlInput.value;
            imgPreview.style.display = 'block';
            uploadIcon.style.display = 'none';
            uploadText.style.display = 'none';
        }
    };

    document.getElementById('add-product-form').onsubmit = async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-product');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> ĐANG TẢI...';

        let finalImgUrl = imgUrlInput.value || 'assets/images/default.png';

        // 1. If file is selected, upload it first
        if (imgFileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('image', imgFileInput.files[0]);
            
            try {
                const uploadRes = await fetch(`${state.apiUrl.replace('/products', '')}/upload`, {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.url) {
                    finalImgUrl = uploadData.url;
                }
            } catch (err) {
                console.error("Upload failed, using default image");
            }
        }

        const newProduct = {
            id: document.getElementById('p-id').value,
            name: document.getElementById('p-name').value,
            series: document.getElementById('p-series').value,
            price: document.getElementById('p-price').value,
            stock: parseInt(document.getElementById('p-stock').value),
            img: finalImgUrl
        };
        
        try {
            const response = await fetch(`${state.apiUrl}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newProduct)
            });
            
            if (response.ok) {
                await fetchProducts();
                closeModal();
                renderView('warehouse');
            } else {
                const err = await response.json();
                alert("Lỗi: " + err.error);
            }
        } catch (err) {
            alert("Không thể kết nối đến Server Node.js");
        } finally {
            btnSave.disabled = false;
        }
    };
}

function showAddUserModal() {
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">THIẾT LẬP <span class="highlight">PHI CÔNG MỚI</span></h3>
            </div>
            <form id="add-user-form" class="admin-form">
                <div class="form-group">
                    <label>HỌ TÊN</label>
                    <input type="text" id="u-name" placeholder="Tên phi công" required>
                </div>
                <div class="form-group">
                    <label>EMAIL ĐỊNH DANH</label>
                    <input type="email" id="u-email" placeholder="phi-cong@gst.com" required>
                </div>
                <div class="form-group">
                    <label>VAI TRÒ</label>
                    <select id="u-role">
                        <option value="User">User (Phi công)</option>
                        <option value="Admin">Admin (Chỉ huy)</option>
                    </select>
                </div>
                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY</button>
                    <button type="submit" class="btn btn-primary">CẤP QUYỀN TRUY CẬP</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('add-user-form').onsubmit = (e) => {
        e.preventDefault();
        const newUser = {
            id: 'USR-' + Math.floor(Math.random() * 1000),
            name: document.getElementById('u-name').value,
            email: document.getElementById('u-email').value,
            role: document.getElementById('u-role').value,
            joined: new Date().toISOString().split('T')[0]
        };
        state.users.unshift(newUser);
        saveData();
        closeModal();
        renderView('accounts');
    };
}

function closeModal() {
    modal.style.display = 'none';
    modal.innerHTML = '';
}

// --- EVENT LISTENERS ---
document.querySelectorAll('.menu-link').forEach(link => {
    link.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        if(view) renderView(view);
    });
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('gst_admin_logged');
    window.location.href = 'login.html';
});

// Initialize
window.onload = checkAuth;
