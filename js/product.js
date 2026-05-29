const apiHosts = window.location.hostname === 'localhost'
    ? ['http://localhost:5000', 'http://127.0.0.1:5000']
    : ['http://127.0.0.1:5000', 'http://localhost:5000'];

async function requestApi(path, options = {}) {
    const fetchOptions = {
        mode: 'cors',
        cache: 'no-store',
        ...options
    };

    let lastError;
    for (const host of apiHosts) {
        const url = `${host}${path}`;
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

function getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function renderProductDetails(product) {
    const container = document.getElementById('product-detail-content');
    if (!container) return;

    const imageUrl = product.img || 'assets/images/default.png';

    container.innerHTML = `
        <div class="product-detail-grid">
            <div class="product-detail-image">
                <img src="${imageUrl}" alt="${product.name}" />
            </div>
            <div class="product-detail-info">
                <span class="product-detail-series">${product.series}</span>
                <h1 class="product-detail-title">${product.name}</h1>
                <div class="product-detail-meta">
                    <div><strong>Mã sản phẩm:</strong> ${product.id}</div>
                    <div><strong>Giá:</strong> ${product.price}</div>
                    <div><strong>Kho:</strong> ${product.stock}</div>
                    <div><strong>Nhà cung cấp:</strong> ${product.supplier}</div>
                </div>
                <div class="product-detail-description">
                    <p>Thông tin chi tiết sản phẩm sẽ được cập nhật sớm nhất. Đây là trang mô tả dành cho mỗi sản phẩm Gunpla chính hãng.</p>
                </div>
                <div class="product-detail-actions">
                    <a href="store.html" class="btn btn-secondary"><i class='bx bx-arrow-back'></i> Trở về cửa hàng</a>
                    <button class="btn btn-primary" onclick="window.location.href='store.html?addToCart=${encodeURIComponent(product.id)}'">
                        <i class='bx bx-cart-add'></i> MUA NGAY
                    </button>
                </div>
            </div>
        </div>
    `;
}

function renderError(message) {
    const container = document.getElementById('product-detail-content');
    if (!container) return;
    container.innerHTML = `
        <div class="product-detail-error">
            <h2>Không tìm thấy sản phẩm</h2>
            <p>${message}</p>
            <a href="store.html" class="btn btn-secondary"><i class='bx bx-arrow-back'></i> Quay về cửa hàng</a>
        </div>
    `;
}

async function loadProductDetail() {
    const productId = getProductIdFromUrl();
    if (!productId) {
        renderError('Không tìm thấy mã sản phẩm trong đường dẫn.');
        return;
    }

    try {
        const response = await requestApi(`/api/products/${encodeURIComponent(productId)}`);
        const product = await response.json();
        renderProductDetails(product);
    } catch (err) {
        console.error('Product load failed:', err);
        renderError('Không thể tải chi tiết. Vui lòng thử lại sau.');
    }
}

window.addEventListener('DOMContentLoaded', loadProductDetail);
