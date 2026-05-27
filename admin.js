/* =========================================
   ADMIN DASHBOARD LOGIC
   ========================================= */

// --- INITIAL DATA (MOCK) ---
const INITIAL_PRODUCTS = [
    { id: 'GP-782', name: 'RX-78-2 Gundam', series: 'PG Unleashed', stock: 12, price: '6,850,000₫', status: 'In Stock' },
    { id: 'GP-000', name: 'Wing Gundam Zero EW', series: 'MG Ver.Ka', stock: 5, price: '1,550,000₫', status: 'In Stock' },
    { id: 'GP-004', name: 'MSN-04 Sazabi', series: 'RG', stock: 2, price: '1,150,000₫', status: 'Low Stock' },
    { id: 'GP-101', name: 'Freedom Gundam', series: 'MG 2.0', stock: 0, price: '1,250,000₫', status: 'Out of Stock' }
];

const INITIAL_USERS = [
    { id: 'USR-001', name: 'Đặng Hoàng Nam', email: 'nam@gst.com', role: 'Admin', joined: '2026-01-15' },
    { id: 'USR-002', name: 'Vinh Pilot', email: 'vinh@gst.com', role: 'User', joined: '2026-02-20' },
    { id: 'USR-003', name: 'Guest Alpha', email: 'guest@gst.com', role: 'User', joined: '2026-03-05' }
];

// --- APP STATE ---
const state = {
    products: JSON.parse(localStorage.getItem('gst_products')) || INITIAL_PRODUCTS,
    users: JSON.parse(localStorage.getItem('gst_users')) || INITIAL_USERS,
    currentView: 'overview'
};

// --- AUTHENTICATION ---
function checkAuth() {
    const isAdmin = localStorage.getItem('gst_admin_logged');
    const overlay = document.getElementById('auth-overlay');
    
    if (isAdmin === 'true') {
        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.style.display = 'none', 500);
            renderView('overview');
        }, 1500);
    } else {
        window.location.href = 'login.html';
    }
}

// --- DATA PERSISTENCE ---
function saveData() {
    localStorage.setItem('gst_products', JSON.stringify(state.products));
    localStorage.setItem('gst_users', JSON.stringify(state.users));
}

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
function deleteProduct(id) {
    if (confirm(`Bạn có chắc muốn xóa sản phẩm ${id}?`)) {
        state.products = state.products.filter(p => p.id !== id);
        saveData();
        renderView('warehouse');
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
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">NHẬP <span class="highlight">MẶC HÀNG MỚI</span></h3>
            </div>
            <form id="add-product-form" class="admin-form">
                <div class="form-group">
                    <label>TÊN SẢN PHẨM</label>
                    <input type="text" id="p-name" placeholder="Ví dụ: Gundam Exia" required>
                </div>
                <div class="form-group">
                    <label>SERIES</label>
                    <select id="p-series">
                        <option>Perfect Grade (PG)</option>
                        <option>Master Grade (MG)</option>
                        <option>Real Grade (RG)</option>
                        <option>High Grade (HG)</option>
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
                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY</button>
                    <button type="submit" class="btn btn-primary">XÁC NHẬN NHẬP</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('add-product-form').onsubmit = (e) => {
        e.preventDefault();
        const newProduct = {
            id: 'GP-' + Math.floor(Math.random() * 1000),
            name: document.getElementById('p-name').value,
            series: document.getElementById('p-series').value,
            price: document.getElementById('p-price').value,
            stock: parseInt(document.getElementById('p-stock').value),
            status: 'In Stock'
        };
        state.products.unshift(newProduct);
        saveData();
        closeModal();
        renderView('warehouse');
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
