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
const browserHost = window.location.hostname;
const defaultApiHost = browserHost === 'localhost' ? 'http://localhost:5000' : 'http://127.0.0.1:5000';
const state = {
    products: [],
    users: [],
    suppliers: [],
    news: [],
    currentView: 'overview',
    apiUrl: `${defaultApiHost}/api`,
    apiHosts: browserHost === 'localhost'
        ? ['http://localhost:5000', 'http://127.0.0.1:5000']
        : ['http://127.0.0.1:5000', 'http://localhost:5000']
};

function resolveApiUrl(path) {
    return `${state.apiHosts[0]}${path}`;
}

async function requestApi(path, options = {}) {
    const fetchOptions = {
        mode: 'cors',
        cache: 'no-store',
        ...options
    };
    let lastError;
    for (const host of state.apiHosts) {
        const url = `${host}${path}`;
        console.log('[ADMIN] requestApi try', url);
        try {
            const response = await fetch(url, fetchOptions);
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                const errorMessage = errorData?.error || `HTTP ${response.status}`;
                lastError = new Error(`${url}: ${errorMessage}`);
                continue;
            }
            return response;
        } catch (err) {
            lastError = err;
            continue;
        }
    }
    throw lastError;
}

console.log('[ADMIN] api hosts:', state.apiHosts);

// --- DATA FETCHING ---
async function fetchProducts() {
    try {
        const response = await requestApi('/api/products');
        state.products = await response.json();
        renderView(state.currentView);
    } catch (err) {
        console.error("Failed to fetch products:", err);
    }
}

async function fetchUsers() {
    try {
        const response = await requestApi('/api/users');
        state.users = await response.json();
        renderView(state.currentView);
    } catch (err) {
        console.error("Failed to fetch users:", err);
    }
}

async function fetchSuppliers() {
    try {
        const response = await requestApi('/api/suppliers');
        state.suppliers = await response.json();
    } catch (err) {
        console.error("Failed to fetch suppliers:", err);
    }
}

async function fetchNews() {
    try {
        const response = await requestApi('/api/news');
        state.news = await response.json();
    } catch (err) {
        console.error("Failed to fetch news:", err);
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
            await fetchUsers(); // Load users from SQL
            await fetchSuppliers(); // Load suppliers for product entry
            await fetchNews(); // Load news posts
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
        case 'suppliers':
            mainContent.innerHTML = renderSuppliers();
            break;
        case 'news':
            mainContent.innerHTML = renderNews();
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
                                        <button class="action-btn" onclick="showEditProductModal('${p.id}')" title="Chỉnh sửa"><i class='bx bx-edit-alt'></i></button>
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
                                        <button class="action-btn" onclick="showEditUserModal('${u.id}')" title="Chỉnh sửa"><i class='bx bx-edit-alt'></i></button>
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

function renderNews() {
    return `
        <div class="page-header">
            <h2 class="admin-title">QUẢN LÝ <span class="highlight">TIN TỨC</span></h2>
            <button class="btn btn-primary" onclick="showAddNewsModal()">
                <i class='bx bx-plus'></i> ĐĂNG TIN TỨC MỚI
            </button>
        </div>
        <div class="content-panel">
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tiêu đề</th>
                            <th>Loại</th>
                            <th>Ngày đăng</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.news.map(n => `
                            <tr>
                                <td class="id-cell">${n.id}</td>
                                <td>${n.title}</td>
                                <td>${n.category}</td>
                                <td>${n.datePosted || '-'}</td>
                                <td>
                                    <div class="action-btns">
                                        <button class="action-btn delete" onclick="deleteNews('${n.id}')" title="Xóa"><i class='bx bx-trash'></i></button>
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

async function createNews(payload) {
    try {
        const response = await requestApi('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const message = errorData?.error || `HTTP ${response.status}`;
            console.error('Failed to create news:', message);
            return { success: false, error: message };
        }
        return { success: true };
    } catch (err) {
        console.error('Failed to create news:', err);
        return { success: false, error: err.message };
    }
}

function showAddNewsModal() {
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content wide">
            <div class="modal-header">
                <h3 class="modal-title">ĐĂNG TIN TỨC MỚI</h3>
            </div>
            <form id="add-news-form" class="admin-form">
                <div class="modal-grid">
                    <div class="modal-left">
                        <label>ẢNH BÀI VIẾT</label>
                        <div class="image-upload-wrapper" id="news-img-upload" style="cursor: pointer;">
                            <i class='bx bx-cloud-upload'></i>
                            <span>CHỌN ẢNH TỪ HỆ THỐNG</span>
                            <img id="news-img-preview" src="" style="display:none; width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                        </div>
                        <input type="file" id="news-img-file" style="display:none" accept="image/*">
                        <input type="text" id="news-img-url" placeholder="Hoặc nhập URL ảnh..." style="margin-top: 10px; font-size: 0.75rem;">
                    </div>
                    <div class="modal-right">
                        <div class="form-group">
                            <label>TIÊU ĐỀ</label>
                            <input type="text" id="news-title" placeholder="Tiêu đề tin tức" required>
                        </div>
                        <div class="form-group">
                            <label>LOẠI TIN</label>
                            <select id="news-category" required>
                                <option value="news">Tin tức</option>
                                <option value="promo">Ưu đãi</option>
                                <option value="guide">Cộng đồng</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>TÓM TẮT</label>
                            <textarea id="news-excerpt" rows="4" placeholder="Tóm tắt nội dung..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>NỘI DUNG CHI TIẾT</label>
                            <textarea id="news-body" rows="6" placeholder="Nội dung chi tiết..."></textarea>
                        </div>
                    </div>
                </div>
                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-news">ĐĂNG TIN</button>
                </div>
            </form>
        </div>
    `;

    const imgUploadTrigger = document.getElementById('news-img-upload');
    const imgFileInput = document.getElementById('news-img-file');
    const imgUrlInput = document.getElementById('news-img-url');
    const imgPreview = document.getElementById('news-img-preview');

    imgUploadTrigger.onclick = () => imgFileInput.click();
    imgFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                imgPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    };

    imgUrlInput.oninput = () => {
        if (imgUrlInput.value) {
            imgPreview.src = imgUrlInput.value;
            imgPreview.style.display = 'block';
        }
    };

    document.getElementById('add-news-form').onsubmit = async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-news');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> ĐANG LƯU...';

        let finalImgUrl = imgUrlInput.value || '';
        if (imgFileInput.files.length > 0) {
            const formData = new FormData();
            formData.append('image', imgFileInput.files[0]);
            try {
                const uploadRes = await requestApi('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.url) {
                    finalImgUrl = uploadData.url;
                }
            } catch (err) {
                console.error('Upload failed:', err);
            }
        }

        const payload = {
            title: document.getElementById('news-title').value.trim(),
            category: document.getElementById('news-category').value,
            excerpt: document.getElementById('news-excerpt').value.trim(),
            body: document.getElementById('news-body').value.trim() || null,
            img: finalImgUrl || null
        };

        const result = await createNews(payload);
        if (result.success) {
            await fetchNews();
            closeModal();
            renderView('news');
        } else {
            alert('Không thể lưu tin tức. ' + (result.error || 'Vui lòng thử lại.'));
        }

        btnSave.disabled = false;
        btnSave.innerHTML = 'ĐĂNG TIN';
    };
}

async function deleteNews(id) {
    if (!confirm(`Bạn có chắc muốn xóa bài viết ${id}?`)) return;
    try {
        const response = await fetch(`${state.apiUrl}/news/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            await fetchNews();
            renderView('news');
        } else {
            const err = await response.json();
            alert('Lỗi: ' + err.error);
        }
    } catch (err) {
        alert('Không thể kết nối đến Server Node.js');
    }
}

function renderSuppliers() {
    return `
        <div class="page-header">
            <h2 class="admin-title">QUẢN LÝ <span class="highlight">NHÀ CUNG CẤP</span></h2>
            <button class="btn btn-primary" onclick="showAddSupplierModal()">
                <i class='bx bx-plus'></i> THÊM NHÀ CUNG CẤP
            </button>
        </div>
        <div class="content-panel">
            <div class="data-table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID NCC</th>
                            <th>Tên nhà cung cấp</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Địa chỉ</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.suppliers.map(s => `
                            <tr>
                                <td class="id-cell">${s.MaNCC}</td>
                                <td>${s.TenNCC}</td>
                                <td>${s.Email || '-'}</td>
                                <td>${s.SDT || '-'}</td>
                                <td>${s.DiaChi || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

async function createSupplier(payload) {
    try {
        const response = await fetch(`${state.apiUrl}/suppliers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch (err) {
        console.error('Failed to create supplier:', err);
        return false;
    }
}

function showAddSupplierModal() {
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">THÊM NHÀ CUNG CẤP MỚI</h3>
            </div>
            <form id="add-supplier-form" class="admin-form">
                <div class="form-group">
                    <label>TÊN NHÀ CUNG CẤP</label>
                    <input type="text" id="supplier-name" placeholder="Tên nhà cung cấp" required>
                </div>
                <div class="form-group">
                    <label>EMAIL</label>
                    <input type="email" id="supplier-email" placeholder="Email liên hệ">
                </div>
                <div class="form-group">
                    <label>SDT</label>
                    <input type="text" id="supplier-phone" placeholder="Số điện thoại liên hệ">
                </div>
                <div class="form-group">
                    <label>ĐỊA CHỈ</label>
                    <input type="text" id="supplier-address" placeholder="Địa chỉ nhà cung cấp">
                </div>
                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-supplier">LƯU NHÀ CUNG CẤP</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('add-supplier-form').onsubmit = async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-supplier');
        btnSave.disabled = true;
        btnSave.innerHTML = 'ĐANG LƯU...';

        const payload = {
            name: document.getElementById('supplier-name').value.trim(),
            email: document.getElementById('supplier-email').value.trim() || null,
            phone: document.getElementById('supplier-phone').value.trim() || null,
            address: document.getElementById('supplier-address').value.trim() || null
        };

        const success = await createSupplier(payload);
        if (success) {
            await fetchSuppliers();
            closeModal();
            renderView('suppliers');
        } else {
            alert('Không thể thêm nhà cung cấp. Vui lòng thử lại.');
        }

        btnSave.disabled = false;
        btnSave.innerHTML = 'LƯU NHÀ CUNG CẤP';
    };
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

async function deleteUser(id) {
    if(id === 'admin') return alert("Không thể xóa tài khoản Admin hệ thống!");
    if (confirm(`Bạn có chắc muốn xóa tài khoản ${id}?`)) {
        try {
            const response = await fetch(`${state.apiUrl}/users/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await fetchUsers();
                renderView('accounts');
            } else {
                const err = await response.json();
                alert("Lỗi khi xóa tài khoản: " + err.error);
            }
        } catch (err) {
            alert("Lỗi khi kết nối: " + err.message);
        }
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
                            <label>NHÀ CUNG CẤP</label>
                            <select id="p-supplier" required>
                                <option value="">Chọn nhà cung cấp</option>
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
    const supplierSelect = document.getElementById('p-supplier');

    if (supplierSelect) {
        supplierSelect.innerHTML = `
            <option value="">Chọn nhà cung cấp</option>
            ${state.suppliers.map(s => `<option value="${s.MaNCC}">${s.TenNCC}</option>`).join('')}
        `;
    }

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
            supplierId: parseInt(document.getElementById('p-supplier').value) || null,
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
                    <label>TÊN ĐĂNG NHẬP (USERNAME)</label>
                    <input type="text" id="u-username" placeholder="Tên đăng nhập" required>
                </div>
                <div class="form-group">
                    <label>MẬT KHẨU</label>
                    <input type="password" id="u-password" placeholder="Mật khẩu" required>
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
                    <button type="submit" class="btn btn-primary" id="btn-save-user">CẤP QUYỀN TRUY CẬP</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('add-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-user');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> ĐANG TẠO...';

        const newUser = {
            username: document.getElementById('u-username').value.trim(),
            password: document.getElementById('u-password').value,
            name: document.getElementById('u-name').value.trim(),
            email: document.getElementById('u-email').value.trim(),
            role: document.getElementById('u-role').value
        };

        try {
            const response = await fetch(`${state.apiUrl}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            if (response.ok) {
                await fetchUsers();
                closeModal();
                renderView('accounts');
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

function showEditProductModal(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return alert("Không tìm thấy sản phẩm!");

    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content wide">
            <div class="modal-header">
                <h3 class="modal-title">HỆ THỐNG <span class="highlight">CẬP NHẬT MÔ HÌNH</span></h3>
            </div>
            
            <form id="edit-product-form" class="admin-form">
                <div class="modal-grid">
                    <!-- Left: Image Section -->
                    <div class="modal-left">
                        <label>ẢNH MÔ HÌNH (SƠ ĐỒ)</label>
                        <div class="image-upload-wrapper" id="img-upload-trigger" style="cursor: pointer;">
                            <i class='bx bx-cloud-upload' style="display:none"></i>
                            <span style="display:none">CHỌN ẢNH TỪ HỆ THỐNG</span>
                            <img id="img-preview" src="${product.img}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                        </div>
                        <input type="file" id="p-img-file" style="display:none" accept="image/*">
                        <input type="text" id="p-img-url" value="${product.img}" placeholder="Hoặc nhập URL ảnh..." style="margin-top: 10px; font-size: 0.75rem;">
                    </div>

                    <!-- Right: Info Section -->
                    <div class="modal-right">
                        <div class="form-group">
                            <label>MÃ ĐỊNH DANH (ID - KHÔNG THỂ SỬA)</label>
                            <input type="text" id="p-id" value="${product.id}" readonly>
                        </div>
                        <div class="form-group">
                            <label>TÊN SẢN PHẨM</label>
                            <input type="text" id="p-name" value="${product.name}" required>
                        </div>
                        <div class="form-group">
                            <label>LINH KIỆN / SERIES</label>
                            <select id="p-series">
                                <option ${product.series.includes('PG') ? 'selected' : ''}>Perfect Grade (PG)</option>
                                <option ${product.series.includes('MG') ? 'selected' : ''}>Master Grade (MG)</option>
                                <option ${product.series.includes('RG') ? 'selected' : ''}>Real Grade (RG)</option>
                                <option ${product.series.includes('HG') ? 'selected' : ''}>High Grade (HG)</option>
                                <option ${product.series.includes('Phụ Kiện') ? 'selected' : ''}>Phụ Kiện</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>NHÀ CUNG CẤP</label>
                            <select id="p-supplier" required>
                                <option value="">Chọn nhà cung cấp</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ĐƠN GIÁ (₫)</label>
                            <input type="text" id="p-price" value="${product.price}" required>
                        </div>
                        <div class="form-group">
                            <label>SỐ LƯỢNG KHO</label>
                            <input type="number" id="p-stock" value="${product.stock}" required>
                        </div>
                    </div>
                </div>

                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY LỆNH</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-product">LƯU CẬP NHẬT KHO</button>
                </div>
            </form>
        </div>
    `;

    const imgUploadTrigger = document.getElementById('img-upload-trigger');
    const imgFileInput = document.getElementById('p-img-file');
    const imgUrlInput = document.getElementById('p-img-url');
    const imgPreview = document.getElementById('img-preview');
    const supplierSelect = document.getElementById('p-supplier');

    if (supplierSelect) {
        supplierSelect.innerHTML = `
            <option value="">Chọn nhà cung cấp</option>
            ${state.suppliers.map(s => `<option value="${s.MaNCC}" ${s.MaNCC === product.supplierId ? 'selected' : ''}>${s.TenNCC}</option>`).join('')}
        `;
    }

    imgUploadTrigger.onclick = () => imgFileInput.click();

    imgFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    imgUrlInput.oninput = () => {
        if(imgUrlInput.value) {
            imgPreview.src = imgUrlInput.value;
        }
    };

    document.getElementById('edit-product-form').onsubmit = async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-product');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> ĐANG LƯU...';

        let finalImgUrl = imgUrlInput.value || product.img;

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
                console.error("Upload failed, using original image");
            }
        }

        const updatedProduct = {
            name: document.getElementById('p-name').value,
            series: document.getElementById('p-series').value,
            supplierId: parseInt(document.getElementById('p-supplier').value) || null,
            price: document.getElementById('p-price').value,
            stock: parseInt(document.getElementById('p-stock').value),
            img: finalImgUrl
        };
        
        try {
            const response = await fetch(`${state.apiUrl}/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
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

function showEditUserModal(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return alert("Không tìm thấy tài khoản!");

    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">CẬP NHẬT <span class="highlight">PHI CÔNG</span></h3>
            </div>
            <form id="edit-user-form" class="admin-form">
                <div class="form-group">
                    <label>HỌ TÊN</label>
                    <input type="text" id="u-name" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label>EMAIL ĐỊNH DANH</label>
                    <input type="email" id="u-email" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>TÊN ĐĂNG NHẬP (USERNAME - KHÔNG THỂ SỬA)</label>
                    <input type="text" id="u-username" value="${user.id}" readonly>
                </div>
                <div class="form-group">
                    <label>MẬT KHẨU MỚI (Để trống nếu không muốn đổi)</label>
                    <input type="password" id="u-password" placeholder="Nhập mật khẩu mới...">
                </div>
                <div class="form-group">
                    <label>VAI TRÒ</label>
                    <select id="u-role">
                        <option value="User" ${user.role === 'User' ? 'selected' : ''}>User (Phi công)</option>
                        <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin (Chỉ huy)</option>
                    </select>
                </div>
                <div class="form-footer">
                    <button type="button" class="btn" onclick="closeModal()">HỦY</button>
                    <button type="submit" class="btn btn-primary" id="btn-save-user">CẬP NHẬT QUYỀN TRUY CẬP</button>
                </div>
            </form>
        </div>
    `;

    document.getElementById('edit-user-form').onsubmit = async (e) => {
        e.preventDefault();
        const btnSave = document.getElementById('btn-save-user');
        btnSave.disabled = true;
        btnSave.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> ĐANG LƯU...';

        const updatedUser = {
            password: document.getElementById('u-password').value,
            name: document.getElementById('u-name').value.trim(),
            email: document.getElementById('u-email').value.trim(),
            role: document.getElementById('u-role').value
        };

        try {
            const response = await fetch(`${state.apiUrl}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser)
            });

            if (response.ok) {
                await fetchUsers();
                closeModal();
                renderView('accounts');
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
