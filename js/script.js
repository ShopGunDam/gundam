/* =========================================
   MOBILE MENU TOGGLE
   ========================================= */
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');
const navLinks = document.querySelectorAll('.nav-link');

// Show menu
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.add('show-menu');
    });
}

// Hide menu
if (navClose) {
    navClose.addEventListener('click', () => {
        navMenu.classList.remove('show-menu');
    });
}

// Hide menu when clicking a link (mobile)
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('show-menu');
    });
});

/* =========================================
   STICKY HEADER & ACTIVE LINK
   ========================================= */
const header = document.getElementById('header');
const sections = document.querySelectorAll('section[id]');

function scrollActive() {
    const scrollY = window.scrollY;

    // Sticky header
    if (scrollY >= 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }

    // Active link
    sections.forEach(current => {
        const sectionHeight = current.offsetHeight;
        const sectionTop = current.offsetTop - 100;
        const sectionId = current.getAttribute('id');

        
        const link = document.querySelector(`.nav-menu a[href*=${sectionId}]`);
        if (link) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        }
    });
}

window.addEventListener('scroll', scrollActive);

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

const cubes = document.querySelectorAll('.cube');
const heroSection = document.querySelector('.hero');

if (heroSection && cubes.length > 0) {
    heroSection.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;

        cubes.forEach((cube, index) => {
            // Give different cubes different speeds based on index
            const speed = (index + 1) * 2;
            cube.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });
    
    // Reset transform when mouse leaves
    heroSection.addEventListener('mouseleave', () => {
        cubes.forEach((cube) => {
            cube.style.transform = `translate(0px, 0px)`;
        });
    });
}

/* =========================================
   HORIZONTAL SCROLL WITH MOUSE WHEEL (UNIVERSE TRACK)
   ========================================= */
const universeTrack = document.querySelector('.universe-track');
if (universeTrack) {
    universeTrack.addEventListener('wheel', (e) => {
        if (window.innerWidth > 768) {
            e.preventDefault();
            universeTrack.scrollLeft += e.deltaY;
        }
    });
}

/* =========================================
   GLITCH TEXT RANDOM TRIGGER
   ========================================= */
const glitchTexts = document.querySelectorAll('.glitch');
setInterval(() => {
    glitchTexts.forEach(text => {
        if (Math.random() > 0.8) {
            text.style.animationDuration = "0.5s";
            setTimeout(() => {
                text.style.animationDuration = "5s";
            }, 500);
        }
    });
}, 2000);



/* =========================================
   STORE DYNAMIC FILTERING & SORTING PROTOCOL
   ========================================= */
const storeLayout = document.querySelector('.store-container');

if (storeLayout) {
    const searchInput = document.querySelector('.sidebar-search-input');
    const categoryCheckboxes = document.querySelectorAll('.filter-checkbox[data-filter="category"]');
    const manufacturerCheckboxes = document.querySelectorAll('.filter-checkbox[data-filter="manufacturer"]');
    const priceSlider = document.querySelector('.price-slider');
    const priceMaxVal = document.querySelector('.price-max-val');
    const btnResetFilters = document.querySelector('.btn-reset-filters');
    const sortSelect = document.querySelector('.sort-select');
    const matchesCount = document.querySelector('.matches-count');
    const productsFlex = document.querySelector('.products-flex');

    // Create empty state element if it doesn't exist
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-matches hide';
    emptyState.innerHTML = `
        <i class='bx bx-radar'></i>
        <h3>KHÔNG CÓ DỮ LIỆU TRÙNG KHỚP</h3>
        <p>Thử điều chỉnh lại bộ lọc để dò tìm tín hiệu mô hình khác.</p>
    `;
    productsFlex.appendChild(emptyState);

    // Format money helper
    function formatVND(value) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value).replace(/₫/g, '₫');
    }

    // Dynamic price display
    if (priceSlider && priceMaxVal) {
        priceSlider.addEventListener('input', () => {
            priceMaxVal.textContent = formatVND(priceSlider.value);
            filterProducts();
        });
    }

    // Event listeners for filters
    if (searchInput) searchInput.addEventListener('input', filterProducts);
    categoryCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    manufacturerCheckboxes.forEach(cb => cb.addEventListener('change', filterProducts));
    if (sortSelect) sortSelect.addEventListener('change', sortProducts);

    // Reset filters action
    if (btnResetFilters) {
        btnResetFilters.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            categoryCheckboxes.forEach(cb => cb.checked = false);
            manufacturerCheckboxes.forEach(cb => cb.checked = false);
            if (priceSlider) {
                priceSlider.value = priceSlider.max;
                priceMaxVal.textContent = formatVND(priceSlider.max);
            }
            filterProducts();
        });
    }

    function filterProducts() {
        const productCards = document.querySelectorAll('.product-card');
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

        // Gather selected categories
        const selectedCategories = [];
        categoryCheckboxes.forEach(cb => {
            if (cb.checked) selectedCategories.push(cb.value.toLowerCase());
        });

        // Gather selected manufacturers
        const selectedManufacturers = [];
        manufacturerCheckboxes.forEach(cb => {
            if (cb.checked) selectedManufacturers.push(cb.value.toLowerCase());
        });

        const maxPrice = priceSlider ? parseFloat(priceSlider.value) : Infinity;

        let visibleCount = 0;

        productCards.forEach(card => {
            const name = card.querySelector('.product-name').textContent.toLowerCase();
            const category = card.getAttribute('data-category').toLowerCase();
            // In case data-manufacturer doesn't exist, handle gracefully
            const manufacturer = (card.getAttribute('data-manufacturer') || '').toLowerCase();
            const price = parseFloat(card.getAttribute('data-price'));

            // Check if matches criteria
            const matchesSearch = searchQuery === '' || name.includes(searchQuery);
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(category);
            const matchesManufacturer = selectedManufacturers.length === 0 || selectedManufacturers.includes(manufacturer);
            const matchesPrice = price <= maxPrice;

            if (matchesSearch && matchesCategory && matchesManufacturer && matchesPrice) {
                card.classList.remove('hide');
                visibleCount++;
                // Micro transition fade
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                }, 30);
            } else {
                card.classList.add('hide');
            }
        });

        // Update matches count in toolbar
        if (matchesCount) {
            matchesCount.textContent = visibleCount;
        }

        // Show/hide empty state
        if (visibleCount === 0) {
            emptyState.classList.remove('hide');
        } else {
            emptyState.classList.add('hide');
        }
    }

    function sortProducts() {
        if (!sortSelect) return;
        const productCards = document.querySelectorAll('.product-card');
        const criteria = sortSelect.value;
        const cardsArray = Array.from(productCards);

        // Sort DOM elements
        cardsArray.sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price'));
            const priceB = parseFloat(b.getAttribute('data-price'));
            const nameA = a.querySelector('.product-name').textContent.toLowerCase();
            const nameB = b.querySelector('.product-name').textContent.toLowerCase();

            if (criteria === 'price-asc') {
                return priceA - priceB;
            } else if (criteria === 'price-desc') {
                return priceB - priceA;
            } else if (criteria === 'alpha-asc') {
                return nameA.localeCompare(nameB);
            } else if (criteria === 'alpha-desc') {
                return nameB.localeCompare(nameA);
            }
            return 0; // default (scan order)
        });

        // Re-append sorted cards in flex container (keeping emptyState at the end)
        cardsArray.forEach(card => {
            productsFlex.insertBefore(card, emptyState);
        });
    }

    function normalizeCategoryValue(value) {
        if (!value) return null;
        const lower = value.toString().toLowerCase().trim();
        const map = {
            'hg': 'high grade (hg)',
            'high grade': 'high grade (hg)',
            'high grade (hg)': 'high grade (hg)',
            'mg': 'master grade (mg)',
            'master grade': 'master grade (mg)',
            'master grade (mg)': 'master grade (mg)',
            'rg': 'real grade (rg)',
            'real grade': 'real grade (rg)',
            'real grade (rg)': 'real grade (rg)',
            'pg': 'perfect grade (pg)',
            'perfect grade': 'perfect grade (pg)',
            'perfect grade (pg)': 'perfect grade (pg)',
            'phụ kiện': 'phụ kiện',
            'accessories': 'phụ kiện',
            'dụng cụ': 'dụng cụ',
            'tools': 'dụng cụ'
        };
        return map[lower] || lower;
    }

    function applyUrlFilters() {
        const params = new URLSearchParams(window.location.search);
        const categoryParam = params.get('category') || params.get('grade');
        const manufacturerParam = params.get('manufacturer');
        const queryParam = params.get('q') || params.get('search');

        if (queryParam && searchInput) {
            searchInput.value = queryParam;
        }

        if (categoryParam) {
            const normalizedCategory = normalizeCategoryValue(categoryParam);
            categoryCheckboxes.forEach(cb => {
                cb.checked = normalizeCategoryValue(cb.value) === normalizedCategory;
            });
        }

        if (manufacturerParam) {
            const normalizedManufacturer = manufacturerParam.toString().toLowerCase().trim();
            manufacturerCheckboxes.forEach(cb => {
                cb.checked = cb.value.toString().toLowerCase().trim() === normalizedManufacturer;
            });
        }

        if (priceSlider && params.has('maxPrice')) {
            const maxPrice = parseFloat(params.get('maxPrice'));
            if (!Number.isNaN(maxPrice)) {
                priceSlider.value = Math.min(maxPrice, priceSlider.max);
                priceMaxVal.textContent = formatVND(priceSlider.value);
            }
        }

        filterProducts();
    }

    // Expose functions globally so async loaded products can re-run them
    window.filterProducts = filterProducts;
    window.sortProducts = sortProducts;

    // Initial load
    if (priceSlider) {
        priceMaxVal.textContent = formatVND(priceSlider.value);
    }
    applyUrlFilters();
}

/* =========================================
   TUTORIAL PORTAL FILTERING & SEARCH
   ========================================= */
const tutorialPortal = document.querySelector('.tutorial-portal');

if (tutorialPortal) {
    const filterBtns = document.querySelectorAll('.portal-filter-btn');
    const tutorialGrid = document.querySelector('.tutorial-grid');
    const guideSearch = document.querySelector('.guide-search-input') || document.querySelector('.search-input');

    const categoryMeta = {
        news: { label: 'SỰ KIỆN', icon: 'bx bx-calendar-event', status: 'HOT' },
        promo: { label: 'ƯU ĐÃI', icon: 'bx bxs-gift', status: 'LIVE' },
        guide: { label: 'TIN SỰ KIỆN', icon: 'bx bx-book', status: 'NEW' },
        event: { label: 'SỰ KIỆN', icon: 'bx bx-calendar-event', status: 'HOT' },
        default: { label: 'TIN TỨC', icon: 'bx bx-news', status: 'MỚI' }
    };

    function normalizeCategory(value) {
        if (!value) return 'default';
        const key = value.toString().toLowerCase().trim();
        if (['news', 'sự kiện', 'event'].includes(key)) return 'news';
        if (['promo', 'ưu đãi', 'khuyến mãi'].includes(key)) return 'promo';
        if (['guide', 'tin sự kiện', 'hướng dẫn'].includes(key)) return 'guide';
        if (['article', 'tin tức'].includes(key)) return 'default';
        return key;
    }

    function createTutorialCard(item) {
        const categoryKey = normalizeCategory(item.category);
        const { label, icon, status } = categoryMeta[categoryKey] || categoryMeta.default;
        let imgSrc = item.img || 'assets/images/1780023776769.png';
        if (imgSrc && !imgSrc.startsWith('http') && imgSrc.startsWith('assets/')) {
            imgSrc = `${apiHosts[0]}/${imgSrc}`;
        }
        return `
            <a href="#" class="tutorial-card event-card" data-category="${categoryKey}">
                <div class="card-media">
                    <img src="${imgSrc}" alt="${item.title}">
                </div>
                <div class="card-body">
                    <div class="card-top">
                        <span class="card-type"><i class='${icon}'></i> ${label}</span>
                        <span class="card-date">${item.datePosted || ''}</span>
                    </div>
                    <div class="card-content">
                        <span class="card-id">NEWS-${item.id}</span>
                        <h3>${item.title}</h3>
                        <p class="card-excerpt">${item.excerpt || item.body || ''}</p>
                    </div>
                    <div class="card-meta">
                        <span class="card-status">${status}</span>
                    </div>
                </div>
            </a>
        `;
    }

    function renderNewsCards(newsItems = []) {
        if (!tutorialGrid) return;
        if (newsItems.length === 0) {
            tutorialGrid.innerHTML = `
                <div class="tutorial-empty">
                    <p>Chưa có bài viết nào được đăng. Vui lòng kiểm tra lại sau.</p>
                </div>
            `;
            return;
        }

        tutorialGrid.innerHTML = newsItems.map(createTutorialCard).join('');
    }

    async function loadNewsFromServer() {
        if (!tutorialGrid) return;
        try {
            const response = await requestApi('/api/news');
            const newsData = await response.json();
            renderNewsCards(newsData);
            filterTutorials();
        } catch (err) {
            tutorialGrid.innerHTML = `
                <div class="tutorial-empty error">
                    <p>Không thể tải dữ liệu tin tức. ${err.message}</p>
                </div>
            `;
            console.error(err);
        }
    }

    function filterTutorials() {
        if (!tutorialGrid) return;
        const tutorialCards = tutorialGrid.querySelectorAll('.tutorial-card');
        const activeBtn = document.querySelector('.portal-filter-btn.active');
        const filterValue = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
        const searchQuery = guideSearch ? guideSearch.value.toLowerCase().trim() : '';

        tutorialCards.forEach(card => {
            const category = card.getAttribute('data-category') || '';
            const title = card.querySelector('h3') ? card.querySelector('h3').textContent.toLowerCase() : '';
            const matchesCategory = filterValue === 'all' || category === filterValue;
            const matchesSearch = searchQuery === '' || title.includes(searchQuery);

            if (matchesCategory && matchesSearch) {
                card.classList.remove('hide');
                card.style.opacity = '0';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transition = 'opacity 0.4s ease';
                }, 10);
            } else {
                card.classList.add('hide');
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTutorials();
        });
    });

    if (guideSearch) {
        guideSearch.addEventListener('input', filterTutorials);
    }

    loadNewsFromServer();
}
/* =========================================
   SPOTLIGHT SLIDER LOGIC
   ========================================= */
// --- SPOTLIGHT DATA (CLEARED FOR MIGRATION) ---
const spotlightData = [];

let currentSpotlight = 0;

const spotTitle = document.getElementById('spotlight-title');
const spotPrice = document.getElementById('spotlight-price');
const spotImg = document.getElementById('spotlight-img');
const armorBar = document.getElementById('stat-armor');
const mobilityBar = document.getElementById('stat-mobility');
const weaponBar = document.getElementById('stat-weapon');
const prevBtn = document.getElementById('spot-prev');
const nextBtn = document.getElementById('spot-next');

function updateSpotlight(index) {
    const data = spotlightData[index];

    // Smooth transition
    spotImg.style.opacity = '0';
    spotImg.style.transform = 'translateX(20px)';
    
    setTimeout(() => {
        // Update text nodes carefully
        spotTitle.innerHTML = `${data.title} <br><span class="highlight" id="spotlight-highlight">${data.highlight}</span>`;
        spotPrice.innerText = data.price;
        spotImg.src = data.img;
        spotImg.alt = data.title + " " + data.highlight;

        
        // Update stats
        armorBar.style.width = data.armor;
        mobilityBar.style.width = data.mobility;
        weaponBar.style.width = data.weapon;

        
        spotImg.style.opacity = '1';
        spotImg.style.transform = 'translateX(0)';
    }, 300);
}

if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', () => {
        currentSpotlight = (currentSpotlight + 1) % spotlightData.length;
        updateSpotlight(currentSpotlight);
    });

    prevBtn.addEventListener('click', () => {
        currentSpotlight = (currentSpotlight - 1 + spotlightData.length) % spotlightData.length;
        updateSpotlight(currentSpotlight);
    });
}
/* =========================================
   STORE & CART LOGIC
   ========================================= */
const storeState = {
    products: [],
    cart: JSON.parse(localStorage.getItem('gst_cart')) || [],
    apiUrl: 'http://localhost:5000/api'
};

async function fetchStoreProducts() {
    try {
        const response = await fetch(`${storeState.apiUrl}/products`);
        storeState.products = await response.json();
        renderStoreProducts();
    } catch (err) {
        console.error("Store unreachable:", err);
    }
}

// --- Injected Cart Sidebar ---
const cartHTML = `
    <div class="cart-sidebar" id="cart-sidebar">
        <div class="cart-header">
            <h3>GIỎ HÀNG <span class="highlight">TACTICAL</span></h3>
            <div class="cart-close" id="cart-close"><i class='bx bx-x'></i></div>
        </div>
        <div class="cart-items-container" id="cart-items">
            <!-- Items injected here -->
        </div>
        <div class="cart-footer">
            <div class="cart-total-row">
                <span>TỔNG CỘNG:</span>
                <span class="highlight" id="cart-total-price">0₫</span>
            </div>
            <button class="btn btn-primary cart-checkout-btn" id="checkout-btn">
                <i class='bx bx-credit-card'></i> XÁC NHẬN THANH TOÁN
            </button>
        </div>
    </div>
    <div class="modal-overlay" id="cart-overlay"></div>
`;

document.body.insertAdjacentHTML('beforeend', cartHTML);

const cartSidebar = document.getElementById('cart-sidebar');
const cartClose = document.getElementById('cart-close');
const cartIcon = document.querySelector('.cart-icon');
const cartOverlay = document.getElementById('cart-overlay');
const cartCountBadge = document.querySelector('.cart-count');
const cartItemsWrapper = document.getElementById('cart-items');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');

function updateCartUI() {
    // Update badge
    if(cartCountBadge) {
        cartCountBadge.innerText = storeState.cart.length;
    }

    // Render items
    if(cartItemsWrapper) {
        if(storeState.cart.length === 0) {
            cartItemsWrapper.innerHTML = '<p class="empty-cart-msg">Hệ thống chưa ghi nhận vật phẩm nào...</p>';
            cartTotalPrice.innerText = '0₫';
        } else {
            let total = 0;
            cartItemsWrapper.innerHTML = storeState.cart.map((item, index) => {
                const priceValue = parseInt(item.price.replace(/[^\d]/g, ''));
                total += priceValue;
                return `
                    <div class="cart-item">
                        <img src="${item.img || 'assets/images/default.png'}" alt="${item.name}" class="cart-item-img">
                        <div class="cart-item-info">
                            <div class="cart-item-name">${item.name}</div>
                            <div class="cart-item-price">${item.price}</div>
                        </div>
                        <i class='bx bx-trash-alt cart-item-remove' onclick="removeFromCart(${index})"></i>
                    </div>
                `;
            }).join('');
            cartTotalPrice.innerText = total.toLocaleString() + '₫';
        }
    }
    
    localStorage.setItem('gst_cart', JSON.stringify(storeState.cart));
}

function gotoProductDetail(productId) {
    window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
}

function addToCart(productId, event) {
    if (event) {
        event.stopPropagation();
    }
    const product = storeState.products.find(p => p.id === productId);
    if(product) {
        storeState.cart.push(product);
        updateCartUI();
        alert(`Đã thêm ${product.name} vào hệ thống giỏ hàng!`);
    }
}

function removeFromCart(index) {
    storeState.cart.splice(index, 1);
    updateCartUI();
}

// Sidebar Controls
if(cartIcon) {
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartSidebar.classList.add('open');
        cartOverlay.style.display = 'block';
    });
}

if(cartClose) {
    cartClose.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.style.display = 'none';
    });
}

if(cartOverlay) {
    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('open');
        cartOverlay.style.display = 'none';
    });
}

if(checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if(storeState.cart.length === 0) return alert("Giỏ hàng đang trống!");
        alert("Xác nhận thanh toán thành công! Đang thiết lập kênh vận chuyển...");
        storeState.cart = [];
        updateCartUI();
        cartSidebar.classList.remove('open');
        cartOverlay.style.display = 'none';
    });
}

// --- Render Store Products ---
function renderStoreProducts() {
    const productsFlex = document.querySelector('.products-flex');
    const matchesCount = document.querySelector('.matches-count');

    if (productsFlex) {
        if (storeState.products.length === 0) {
            productsFlex.innerHTML = '<div style="width:100%; text-align:center; padding:50px; color:var(--text-muted);">Sóng tín hiệu yếu... Không tìm thấy sản phẩm nào trong kho.</div>';
            if(matchesCount) matchesCount.innerText = '0';
            return;
        }

        productsFlex.innerHTML = storeState.products.map(p => `
            <div class="product-card" data-category="${p.series}" data-price="${p.price}" onclick="gotoProductDetail('${p.id}')">
                <div class="product-scanner"></div>
                <div class="product-img-wrapper">
                    <span class="product-badge">${p.series}</span>
                    <img src="${p.img || 'assets/images/default.png'}" alt="${p.name}" class="product-img">
                </div>
                <div class="product-info">
                    <span class="product-tech-id">${p.id}</span>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-specs">
                        <div class="spec-item"><i class='bx bx-cube'></i> Kho: ${p.stock}</div>
                    </div>
                    <div class="product-action-row">
                        <span class="product-price">${p.price}</span>
                        <button class="btn product-btn" onclick="addToCart('${p.id}', event)">
                            <i class='bx bx-cart-add'></i> MUA NGAY
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if(matchesCount) matchesCount.innerText = storeState.products.length;
        
        // Trigger filtering and sorting for newly rendered dynamic products
        if (window.filterProducts) {
            window.filterProducts();
        }
        if (window.sortProducts) {
            window.sortProducts();
        }
    }
}

// Initial Calls
window.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
    fetchStoreProducts(); // Fetch from Node.js
});

/* =========================================
   LOGIN HANDLING
   ========================================= */
const loginForm = document.querySelector('.login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('gst_admin_logged', 'true');
                window.location.href = result.role === 'Admin' ? 'admin.html' : 'index.html';
            } else {
                alert('Thông tin định danh không chính xác. Vui lòng thử lại!');
            }
        } catch (err) {
            alert('Không thể kết nối đến máy chủ xác thực.');
        }
    });
}
