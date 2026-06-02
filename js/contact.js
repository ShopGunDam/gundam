/* =========================================
   CONTACT & REVIEWS DYNAMIC LOGIC
   ========================================= */

const apiUrl = 'http://localhost:5000/api';

// Mobile menu toggle
const navMenu = document.getElementById('nav-menu');
const navToggle = document.getElementById('nav-toggle');
const navClose = document.getElementById('nav-close');
const navLinks = document.querySelectorAll('.nav-link');

if (navToggle) {
    navToggle.addEventListener('click', () => navMenu.classList.add('show-menu'));
}
if (navClose) {
    navClose.addEventListener('click', () => navMenu.classList.remove('show-menu'));
}
navLinks.forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('show-menu'));
});

// Sticky header
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('scrolled', window.scrollY >= 50);
});

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

// Sao đánh giá: trái = 1, phải = 5; chọn N thì sao 1..N sáng + hiện "N/5 sao"
function setStarRating(group, hiddenInput, value) {
    if (!group || !hiddenInput) return;
    const score = Math.max(0, Math.min(5, Number(value) || 0));
    hiddenInput.value = score > 0 ? String(score) : '';
    group.dataset.rating = String(score);

    const stars = group.querySelectorAll('.review-star-icon');
    stars.forEach((star) => {
        const starValue = Number(star.getAttribute('data-value'));
        const lit = score > 0 && starValue <= score;
        star.classList.toggle('is-lit', lit);
        star.className = lit ? 'bx bxs-star review-star-icon is-lit' : 'bx bx-star review-star-icon';
        star.style.color = lit ? '#f59e0b' : '';
    });

    const label = document.getElementById('review-rating-label');
    if (label) {
        label.textContent = score > 0 ? `${score}/5 sao` : 'Chưa chọn điểm';
        label.classList.toggle('has-score', score > 0);
    }
}

function paintStarHover(group, hoverScore) {
    const saved = Number(group.dataset.rating) || 0;
    const display = hoverScore > 0 ? hoverScore : saved;

    group.querySelectorAll('.review-star-icon').forEach(star => {
        const v = Number(star.getAttribute('data-value'));
        const lit = display > 0 && v <= display;
        // Ngôi sao được highlight: dùng bxs-star + màu vàng (cả hover lẫn đã lưu)
        if (lit) {
            star.className = 'bx bxs-star review-star-icon is-lit';
            star.style.color = '#f59e0b';
        } else {
            star.className = 'bx bx-star review-star-icon';
            star.style.color = '';
        }
    });

    // Cập nhật nhãn số sao khi hover (ví dụ: "3/5 sao")
    const label = document.getElementById('review-rating-label');
    if (label) {
        label.textContent = display > 0 ? `${display}/5 sao` : 'Chưa chọn điểm';
        label.classList.toggle('has-score', display > 0);
    }
}

function initReviewStarRating() {
    const group = document.getElementById('review-rating-group');
    const input = document.getElementById('review-rating');
    if (!group || !input) return;

    setStarRating(group, input, 0);

    if (group.dataset.ratingBound) return;
    group.dataset.ratingBound = '1';

    group.addEventListener('click', (e) => {
        const star = e.target.closest('.review-star-icon');
        if (!star || !group.contains(star)) return;
        e.preventDefault();
        setStarRating(group, input, star.getAttribute('data-value'));
    });

    group.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const star = e.target.closest('.review-star-icon');
        if (!star) return;
        e.preventDefault();
        setStarRating(group, input, star.getAttribute('data-value'));
    });

    group.querySelectorAll('.review-star-icon').forEach(star => {
        star.addEventListener('mouseenter', () => {
            paintStarHover(group, Number(star.getAttribute('data-value')));
        });
    });

    group.addEventListener('mouseleave', () => {
        setStarRating(group, input, group.dataset.rating || 0);
    });
// FAQ Accordion
function toggleFaq(id) {
    const item = document.getElementById(id);
    if (!item) return;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
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
// 3D Tilt effect
function apply3DTiltEffect() {
    const cards3D = document.querySelectorAll('.info-card, .why-card, .testi-card, .social-card, .hours-card, .form-panel');
    cards3D.forEach(card => {
        // Remove existing reflex if any to avoid duplication
        const existingReflex = card.querySelector('.gundam-3d-reflex');
        if (existingReflex) existingReflex.remove();

        const reflex = document.createElement('div');
        reflex.className = 'gundam-3d-reflex';
        card.appendChild(reflex);
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const xPercent = (x / rect.width) - 0.5;
            const yPercent = (y / rect.height) - 0.5;
            
            const maxRotation = 10;
            const rotateX = -yPercent * maxRotation;
            const rotateY = xPercent * maxRotation;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
            card.style.transition = 'none';
            
            const reflexX = (x / rect.width) * 100;
            const reflexY = (y / rect.height) * 100;
            reflex.style.background = `radial-gradient(circle at ${reflexX}% ${reflexY}%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)`;
            reflex.style.opacity = '1';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease';
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
            reflex.style.transition = 'background 0.5s ease, opacity 0.5s ease';
            reflex.style.opacity = '0';
        });
    });
}

// Mech corner injectors
function applyMechCorners() {
    document.querySelectorAll('.info-card, .why-card, .testi-card, .social-card').forEach(card => {
        card.style.position = 'relative';
        
        // Remove existing chassis and shifters if any to avoid duplication
        const existingChassis = card.querySelector('.mech-chassis');
        if (existingChassis) existingChassis.remove();
        card.querySelectorAll('.armor-shifter').forEach(s => s.remove());

        const chassis = document.createElement('div');
        chassis.className = 'mech-chassis';
        chassis.innerHTML = `
            <div class="mech-warning-label">
                <span class="blink-dot"></span>
                HATCH OPEN : SYSTEM ACTV
            </div>
        `;
        card.insertBefore(chassis, card.firstChild);
        
        const corners = ['tl', 'tr', 'bl', 'br'];
        corners.forEach(pos => {
            const shifter = document.createElement('div');
            shifter.className = `armor-shifter ${pos}`;
            card.appendChild(shifter);
        });
    });
}

// Scroll Reveal
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'perspective(1000px) translate3d(0, 0, 0) rotateX(0deg)';
        }
    });
}, { threshold: 0.1 });

function applyScrollReveal() {
    document.querySelectorAll('.info-card, .form-panel, .social-card, .hours-card, .faq-item, .why-card, .testi-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'perspective(1000px) translate3d(0, 50px, -80px) rotateX(15deg)';
        el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        revealObserver.observe(el);
    });
}

// Fetch and render reviews from database
async function fetchAndRenderReviews() {
    const testimonialsGrid = document.querySelector('.testimonials-grid');
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
        const reviews = await res.json();

        if (reviews.length === 0) {
            testimonialsGrid.innerHTML = '<p class="empty-reviews" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Chưa có đánh giá nào từ phi công...</p>';
            return;
        }

        testimonialsGrid.innerHTML = reviews.map(r => {
            // Get initials
            const initials = r.TenKH ? r.TenKH.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
            
            // Build stars
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < r.DiemDG) {
                    starsHtml += "<i class='bx bxs-star'></i>";
                } else {
                    starsHtml += "<i class='bx bx-star'></i>";
                }
            }

            // Grade fallback based on topic
            let grade = 'Newtype Mới · HG Builder';
            if (r.ChuDe === 'order') grade = 'Collector · PG Builder';
            else if (r.ChuDe === 'consult') grade = 'Newtype Mới · HG → MG';
            else if (r.ChuDe === 'shipping') grade = 'Đại Lý · TP. Đà Nẵng';

            return `
                <div class="testi-card">
                    <div class="testi-quote">"</div>
                    <div class="testi-stars">
                        ${starsHtml}
                    </div>
                    <p class="testi-text">${r.NoiDung}</p>
                    <div class="testi-author">
                        <div class="testi-avatar">${initials}</div>
                        <div>
                            <div class="testi-name">${r.TenKH}</div>
                            <div class="testi-grade">${grade}</div>
                        </div>
                        <span class="testi-badge">VERIFIED</span>
                    </div>
                </div>
            `;
        }).join('');

        // Apply effects
        apply3DTiltEffect();
        applyMechCorners();
        applyScrollReveal();

    } catch (err) {
        console.error("Failed to fetch reviews:", err);
    }
}

// Form Submission
const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
const ratingGroup = document.getElementById('rating-group');
const ratingInput = document.getElementById('input-rating');

if (ratingGroup && ratingInput) {
    ratingGroup.addEventListener('click', (event) => {
        const star = event.target.closest('.rating-star');
        if (!star) return;
        const value = star.dataset.value;
        if (!value) return;

        ratingInput.value = value;
        ratingGroup.querySelectorAll('.rating-star').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === value);
        });
    });
}

if (contactForm) {
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('input-name').value.trim();
        const phone = document.getElementById('input-phone').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const topic = document.getElementById('input-topic').value;
        const message = document.getElementById('input-message').value.trim();
        const rating = Number(ratingInput?.value || 5);

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
                body: JSON.stringify({ name, email, topic, message, rating })
            });

            if (res.ok) {
                contactForm.style.display = 'none';
                formSuccess.classList.add('show');
                await fetchAndRenderReviews(); // Fetch updated list
            } else {
                alert("Gửi phản hồi thất bại!");
            }
        } catch (err) {
            alert("Không thể kết nối đến máy chủ.");
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
window.addEventListener('DOMContentLoaded', () => {
    apply3DTiltEffect();
    applyMechCorners();
    applyScrollReveal();
    fetchAndRenderReviews();
});

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
