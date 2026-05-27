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
    const productCards = document.querySelectorAll('.product-card');

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
            const manufacturer = card.getAttribute('data-manufacturer').toLowerCase();
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

    // Initial load
    if (priceSlider) {
        priceMaxVal.textContent = formatVND(priceSlider.value);
    }
    filterProducts();
}

/* =========================================
   TUTORIAL PORTAL FILTERING & SEARCH
   ========================================= */
const tutorialPortal = document.querySelector('.tutorial-portal');

if (tutorialPortal) {
    const filterBtns = document.querySelectorAll('.portal-filter-btn');
    const tutorialCards = document.querySelectorAll('.tutorial-card');
    const guideSearch = document.querySelector('.search-input');

    function filterTutorials() {
        const activeBtn = document.querySelector('.portal-filter-btn.active');
        const filterValue = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
        const searchQuery = guideSearch ? guideSearch.value.toLowerCase().trim() : '';

        tutorialCards.forEach(card => {
            const category = card.getAttribute('data-category');
            const title = card.querySelector('h3').textContent.toLowerCase();

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
}
