/* =========================================
   CONTACT & REVIEWS DYNAMIC LOGIC
   =========================================
   LƯU Ý: navMenu, navToggle, navClose, navLinks, header
   đã được khai báo trong script.js — KHÔNG khai báo lại
   để tránh SyntaxError làm hỏng toàn bộ file này.
   ========================================= */

const apiUrl = '/api';

// Priority button toggle
function setPriority(btn) {
    document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// FAQ — <details> + name="gunpla-faq" (chỉ mở một câu); đồng bộ class open cho style
function initFaqAccordion() {
    const faqGrid = document.getElementById('faq-grid');
    if (!faqGrid) return;

    faqGrid.querySelectorAll('.faq-details').forEach(details => {
        details.addEventListener('toggle', () => {
            details.classList.toggle('open', details.open);
        });
    });
}

// =============================================
//  HỆ THỐNG CHỌN SAO ĐÁNH GIÁ — viết lại đơn giản & chắc chắn
//  Click sao N → sao 1..N sáng vàng, lưu vào hidden input
// =============================================

/** Tô sáng / tắt các ngôi sao theo điểm số đã cho */
function _paintStars(stars, score) {
    stars.forEach(function(star) {
        var v = parseInt(star.getAttribute('data-value'), 10);
        if (v <= score) {
            // Sao sáng: filled icon + màu vàng
            star.className = 'bx bxs-star review-star-icon is-lit';
            star.style.color = '#f59e0b';
            star.style.filter = 'drop-shadow(0 0 5px rgba(245,158,11,0.6))';
            star.style.transform = 'scale(1.15)';
        } else {
            // Sao tắt: outline icon + xám
            star.className = 'bx bx-star review-star-icon';
            star.style.color = 'rgba(148,163,184,0.55)';
            star.style.filter = '';
            star.style.transform = '';
        }
    });
}

/** Cập nhật nhãn điểm số */
function _updateRatingLabel(score) {
    var label = document.getElementById('review-rating-label');
    if (!label) return;
    if (score > 0) {
        label.textContent = score + '/5 sao';
        label.classList.add('has-score');
        label.style.color = '#f59e0b';
    } else {
        label.textContent = 'Chưa chọn điểm';
        label.classList.remove('has-score');
        label.style.color = '';
    }
}

/** Đặt điểm đánh giá (khóa lại) */
function setStarRating(group, hiddenInput, value) {
    if (!group || !hiddenInput) return;
    var score = Math.max(0, Math.min(5, parseInt(value, 10) || 0));
    hiddenInput.value = score > 0 ? String(score) : '';
    group.dataset.rating = String(score);
    var stars = Array.prototype.slice.call(group.querySelectorAll('.review-star-icon'));
    _paintStars(stars, score);
    _updateRatingLabel(score);
}

/** Khởi tạo tương tác chọn sao — gắn event trực tiếp lên từng sao */
function initReviewStarRating() {
    var group = document.getElementById('review-rating-group');
    var input = document.getElementById('review-rating');
    if (!group || !input) return;

    // Khởi tạo ban đầu: chưa có điểm
    group.dataset.rating = '0';
    input.value = '';
    var allStars = Array.prototype.slice.call(group.querySelectorAll('.review-star-icon'));
    _paintStars(allStars, 0);
    _updateRatingLabel(0);

    // Tránh gắn event 2 lần
    if (group.dataset.ratingBound === '1') return;
    group.dataset.ratingBound = '1';

    // Gắn event trực tiếp lên mỗi ngôi sao
    allStars.forEach(function(star) {
        var starVal = parseInt(star.getAttribute('data-value'), 10);

        // Hover vào: tô sáng sao 1..starVal
        star.addEventListener('mouseenter', function() {
            _paintStars(allStars, starVal);
            _updateRatingLabel(starVal);
        });

        // Click: khóa điểm
        star.addEventListener('click', function(e) {
            e.preventDefault();
            group.dataset.rating = String(starVal);
            input.value = String(starVal);
            _paintStars(allStars, starVal);
            _updateRatingLabel(starVal);
        });

        // Keyboard: Enter / Space để chọn
        star.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                group.dataset.rating = String(starVal);
                input.value = String(starVal);
                _paintStars(allStars, starVal);
                _updateRatingLabel(starVal);
            }
        });
    });

    // Mouseleave trên cả nhóm: khôi phục điểm đã khóa
    group.addEventListener('mouseleave', function() {
        var locked = parseInt(group.dataset.rating, 10) || 0;
        _paintStars(allStars, locked);
        _updateRatingLabel(locked);
    });
}

/** Hàm tương thích ngược (dùng trong submit reset) — wrapper của setStarRating */
function paintStarHover(group, hoverScore) {
    if (!group) return;
    var stars = Array.prototype.slice.call(group.querySelectorAll('.review-star-icon'));
    _paintStars(stars, hoverScore);
    _updateRatingLabel(hoverScore);
}

// Floating Quick Contact
let floatOpen = false;
function toggleFloat() {
    floatOpen = !floatOpen;
    const btns = document.querySelectorAll('.float-btn');
    const toggle = document.getElementById('float-toggle');
    btns.forEach(btn => btn.classList.toggle('visible', floatOpen));
    if (toggle) toggle.classList.toggle('open', floatOpen);
}

/* ---------- Modern motion system ---------- */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function lerp(start, end, factor) {
    return start + (end - start) * factor;
}

// Scroll progress bar
function initScrollProgress() {
    const bar = document.getElementById('scroll-progress');
    if (!bar) return;

    let ticking = false;
    const update = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = `${pct}%`;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });
    update();
}

// Hero parallax
function initHeroParallax() {
    if (prefersReducedMotion) return;
    const hero = document.getElementById('contact-hero');
    const content = document.querySelector('.reveal-hero');
    const orbs = document.querySelectorAll('.hero-orb');
    if (!hero) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const rect = hero.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) {
                    ticking = false;
                    return;
                }
                const progress = Math.min(1, Math.max(0, -rect.top / rect.height));
                if (content) {
                    content.style.transform = `translateY(${progress * 24}px)`;
                }
                orbs.forEach((orb, i) => {
                    orb.style.transform = `translateY(${progress * (20 + i * 12)}px)`;
                });
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// Đánh dấu phần tử đang trong viewport
function revealElementsInViewport() {
    document.querySelectorAll('.reveal-section, .reveal-stagger').forEach(el => {
        const rect = el.getBoundingClientRect();
        const inView = rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
        if (inView) {
            el.classList.add('is-visible');
        }
    });
}

// Intersection reveal (sections + stagger)
function initRevealAnimations() {
    const targets = document.querySelectorAll('.reveal-section, .reveal-stagger');

    if (prefersReducedMotion) {
        targets.forEach(el => el.classList.add('is-visible'));
        return;
    }

    // Hiện ngay các khối đã vào màn hình (form, social, giờ hoạt động...)
    revealElementsInViewport();

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

    targets.forEach(el => sectionObserver.observe(el));

    window.addEventListener('scroll', () => {
        requestAnimationFrame(revealElementsInViewport);
    }, { passive: true });

    // Bật animation ẩn/hiện sau khi đã gán is-visible cho phần trong viewport
    requestAnimationFrame(() => {
        document.body.classList.add('motion-ready');
    });
}

// Smooth tilt with requestAnimationFrame
function applySmoothTilt() {
    if (prefersReducedMotion) return;

    document.querySelectorAll('.tilt-card, .form-panel.glass-card, .social-card, .hours-card').forEach(card => {
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let rafId = null;

        const animate = () => {
            currentX = lerp(currentX, targetX, 0.12);
            currentY = lerp(currentY, targetY, 0.12);
            card.style.transform = `perspective(800px) rotateX(${currentY}deg) rotateY(${currentX}deg) translateY(-2px)`;
            if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
                rafId = requestAnimationFrame(animate);
            }
        };

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const xPct = (e.clientX - rect.left) / rect.width - 0.5;
            const yPct = (e.clientY - rect.top) / rect.height - 0.5;
            targetX = xPct * 6;
            targetY = -yPct * 6;
            if (!rafId) rafId = requestAnimationFrame(animate);
        });

        card.addEventListener('mouseleave', () => {
            targetX = 0;
            targetY = 0;
            if (!rafId) rafId = requestAnimationFrame(animate);
        });
    });
}

// Form focus glow
function initFormFocusEffects() {
    document.querySelectorAll('.form-group').forEach(group => {
        const input = group.querySelector('.form-control');
        if (!input) return;
        const onFocus = () => group.classList.add('is-focused');
        const onBlur = () => group.classList.remove('is-focused');
        input.addEventListener('focus', onFocus);
        input.addEventListener('blur', onBlur);
    });
}

// Animate review cards on render
function animateReviewCards() {
    const cards = document.querySelectorAll('.testi-card');
    cards.forEach((card, index) => {
        card.classList.remove('testi-enter');
        void card.offsetWidth;
        card.style.animationDelay = `${index * 0.08}s`;
        card.classList.add('testi-enter');
        applySmoothTiltToElement(card);
    });
}

function applySmoothTiltToElement(card) {
    if (prefersReducedMotion || !card.classList.contains('testi-card')) return;
    if (card.dataset.tiltBound) return;
    card.dataset.tiltBound = '1';
    card.classList.add('tilt-card');

    let currentX = 0, currentY = 0, targetX = 0, targetY = 0, rafId = null;
    const animate = () => {
        currentX = lerp(currentX, targetX, 0.12);
        currentY = lerp(currentY, targetY, 0.12);
        card.style.transform = `perspective(800px) rotateX(${currentY}deg) rotateY(${currentX}deg)`;
        if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
            rafId = requestAnimationFrame(animate);
        }
    };
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
        targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 5;
        if (!rafId) rafId = requestAnimationFrame(animate);
    });
    card.addEventListener('mouseleave', () => {
        targetX = 0;
        targetY = 0;
        if (!rafId) rafId = requestAnimationFrame(animate);
    });
}

function revealPriorityBlocks() {
    [
        '.contact-main-grid',
        '.info-cards-row',
        '#testimonials',
        '#contact-info',
        '#faq-grid'
    ].forEach(sel => {
        document.querySelectorAll(sel).forEach(el => el.classList.add('is-visible'));
    });
}

function initModernMotion() {
    revealPriorityBlocks();
    initScrollProgress();
    initHeroParallax();
    initRevealAnimations();
    initFaqAccordion();
    applySmoothTilt();
    initFormFocusEffects();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderReviewCard(r) {
    const initials = r.TenKH
        ? r.TenKH.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';

    let starsHtml = '';
    const score = Number(r.DiemDG) || 0;
    for (let i = 0; i < 5; i++) {
        starsHtml += i < score
            ? "<i class='bx bxs-star'></i>"
            : "<i class='bx bx-star'></i>";
    }

    const grade = r.ChuDe ? escapeHtml(r.ChuDe) : '';

    return `
        <div class="testi-card">
            <div class="testi-quote">"</div>
            <div class="testi-stars">${starsHtml}</div>
            <p class="testi-text">${escapeHtml(r.NoiDung)}</p>
            <div class="testi-author">
                <div class="testi-avatar">${initials}</div>
                <div>
                    <div class="testi-name">${escapeHtml(r.TenKH)}</div>
                    ${grade ? `<div class="testi-grade">${grade}</div>` : ''}
                </div>
                <span class="testi-badge">VERIFIED</span>
            </div>
        </div>
    `;
}

function showReviewsEmptyState(container, message, isError) {
    const cls = isError ? 'reviews-error' : 'empty-reviews';
    const icon = isError ? 'bx-error' : 'bx-info-circle';
    container.innerHTML = `
        <p class="${cls}">
            <i class='bx ${icon}'></i>
            ${escapeHtml(message)}
        </p>
    `;
}

// Fetch and render reviews from database only
async function fetchAndRenderReviews() {
    const testimonialsGrid = document.getElementById('reviews-grid') || document.querySelector('.testimonials-grid');
    if (!testimonialsGrid) return;

    try {
        const res = await fetch(`${apiUrl}/reviews`);
        if (!res.ok) {
            showReviewsEmptyState(testimonialsGrid, 'Không tải được đánh giá. Vui lòng thử lại sau.', true);
            return;
        }

        const reviews = await res.json();

        if (!Array.isArray(reviews) || reviews.length === 0) {
            showReviewsEmptyState(testimonialsGrid, 'Chưa có đánh giá nào từ phi công...', false);
            return;
        }

        testimonialsGrid.innerHTML = reviews.map(renderReviewCard).join('');
        animateReviewCards();

    } catch (err) {
        console.error('Failed to fetch reviews:', err);
        showReviewsEmptyState(testimonialsGrid, 'Không thể kết nối đến máy chủ. Đánh giá chỉ hiển thị khi backend sẵn sàng.', true);
    }
}

// Load logged-in user profile from backend for form prefill
async function loadReviewerProfile() {
    const username = sessionStorage.getItem('gunpla_user');
    if (!username) return;

    try {
        const res = await fetch(`${apiUrl}/profile/${encodeURIComponent(username)}`);
        if (!res.ok) return;

        const profile = await res.json();

        const reviewName = document.getElementById('review-name');
        const reviewEmail = document.getElementById('review-email');
        const contactName = document.getElementById('input-name');
        const contactEmail = document.getElementById('input-email');
        const contactPhone = document.getElementById('input-phone');

        if (profile.TenKH) {
            if (reviewName) reviewName.value = profile.TenKH;
            if (contactName) contactName.value = profile.TenKH;
        }
        if (profile.Email) {
            if (reviewEmail) reviewEmail.value = profile.Email;
            if (contactEmail) contactEmail.value = profile.Email;
        }
        if (profile.SDT && contactPhone && !contactPhone.value) {
            contactPhone.value = profile.SDT;
        }
    } catch (err) {
        console.error('Failed to load profile:', err);
    }
}

// Form Submission — góp ý (không có sao)
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('input-name').value.trim();
        const phone = document.getElementById('input-phone').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const topic = document.getElementById('input-topic').value;
        const message = document.getElementById('input-message').value.trim();

        if (!name || !phone || !message) {
            [document.getElementById('input-name'), document.getElementById('input-phone'), document.getElementById('input-message')].forEach(field => {
                if (field && !field.value.trim()) {
                    field.style.borderColor = 'var(--secondary-color)';
                    field.style.boxShadow = '0 0 0 1px var(--secondary-color)';
                    setTimeout(() => {
                        field.style.borderColor = '';
                        field.style.boxShadow = '';
                    }, 2000);
                }
            });
            return;
        }

        const submitBtn = document.getElementById('submit-btn');
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> ĐANG GỬI...";
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${apiUrl}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email: email || '',
                    topic: topic ? `góp ý · ${topic} · ${phone}` : `góp ý · ${phone}`,
                    message,
                    rating: 5
                })
            });

            if (res.ok) {
                contactForm.style.opacity = '0';
                contactForm.style.transform = 'translateY(12px)';
                setTimeout(() => {
                    contactForm.style.display = 'none';
                    formSuccess.classList.add('show');
                }, 300);
                await fetchAndRenderReviews();
            } else {
                alert('Gửi phản hồi thất bại!');
            }
        } catch (err) {
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            submitBtn.innerHTML = "<i class='bx bx-send'></i> PHÁT TÍN HIỆU";
            submitBtn.disabled = false;
        }
    });
}

// Page initialization
async function initContactPage() {
    initModernMotion();
    initReviewStarRating();
    await loadReviewerProfile();
    await fetchAndRenderReviews();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initContactPage);
} else {
    initContactPage();
}

// Auto highlight today's operating hours
const todayDay = new Date().getDay();
const allHoursRows = document.querySelectorAll('.hours-row');
allHoursRows.forEach(row => row.classList.remove('today'));

if (todayDay === 6) {
    const satRow = document.getElementById('hours-saturday');
    if (satRow) satRow.classList.add('today');
} else if (todayDay === 0) {
    if (allHoursRows[2]) allHoursRows[2].classList.add('today');
} else {
    if (allHoursRows[0]) allHoursRows[0].classList.add('today');
}

// --- DEDICATED REVIEW FORM LOGIC ---
const directReviewForm = document.getElementById('direct-review-form');
const reviewSuccess = document.getElementById('review-success');

if (directReviewForm) {
    directReviewForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('review-name').value.trim();
        const email = document.getElementById('review-email').value.trim();
        const grade = document.getElementById('review-grade').value;
        const message = document.getElementById('review-message').value.trim();
        const rating = Number(document.getElementById('review-rating')?.value || 0);
        const reviewRatingGroup = document.getElementById('review-rating-group');

        if (!name || !message || rating < 1) {
            [document.getElementById('review-name'), document.getElementById('review-message')].forEach(field => {
                if (field && !field.value.trim()) {
                    field.style.borderColor = 'var(--secondary-color)';
                    field.style.boxShadow = '0 0 0 1px var(--secondary-color)';
                    setTimeout(() => {
                        field.style.borderColor = '';
                        field.style.boxShadow = '';
                    }, 2000);
                }
            });
            if (rating < 1 && reviewRatingGroup) {
                const label = document.getElementById('review-rating-label');
                if (label) label.style.color = 'var(--secondary-color)';
                setTimeout(() => { if (label) label.style.color = ''; }, 2000);
            }
            return;
        }

        const submitBtn = document.getElementById('review-submit-btn');
        submitBtn.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> ĐANG GỬI...";
        submitBtn.disabled = true;

        try {
            const res = await fetch(`${apiUrl}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email: email || '',
                    topic: grade,
                    message,
                    rating
                })
            });

            if (res.ok) {
                directReviewForm.style.display = 'none';
                reviewSuccess.style.display = 'block';
                await fetchAndRenderReviews();
                
                setTimeout(() => {
                    reviewSuccess.style.display = 'none';
                    directReviewForm.style.display = 'block';
                    directReviewForm.reset();
                    loadReviewerProfile();
                    const ratingGroup = document.getElementById('review-rating-group');
                    const ratingInput = document.getElementById('review-rating');
                    setStarRating(ratingGroup, ratingInput, 0);
                }, 4000);
            } else {
                alert('Gửi đánh giá thất bại!');
            }
        } catch (err) {
            alert('Không thể kết nối đến máy chủ.');
        } finally {
            submitBtn.innerHTML = "<i class='bx bx-send'></i> GỬI ĐÁNH GIÁ THẬT";
            submitBtn.disabled = false;
        }
    });
}
