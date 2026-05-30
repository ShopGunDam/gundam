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

