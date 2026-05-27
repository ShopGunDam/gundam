        /* =========================================
           MOBILE MENU TOGGLE (Inherited from Nam)
           ========================================= */
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

        /* STICKY HEADER */
        const header = document.getElementById('header');
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY >= 50);
        });

        /* =========================================
           PRIORITY BUTTON TOGGLE
           ========================================= */
        function setPriority(btn) {
            document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        /* =========================================
           FAQ ACCORDION
           ========================================= */
        function toggleFaq(id) {
            const item = document.getElementById(id);
            const isOpen = item.classList.contains('open');

            // Close all
            document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));

            // Open clicked if it was closed
            if (!isOpen) item.classList.add('open');
        }

        /* =========================================
           CONTACT FORM SUBMIT
           ========================================= */
        const contactForm = document.getElementById('contact-form');
        const formSuccess = document.getElementById('form-success');

        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('input-name').value.trim();
            const phone = document.getElementById('input-phone').value.trim();
            const message = document.getElementById('input-message').value.trim();

            if (!name || !phone || !message) {
                // Shake animation on empty fields
                [document.getElementById('input-name'), document.getElementById('input-phone'), document.getElementById('input-message')].forEach(field => {
                    if (!field.value.trim()) {
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

            // Simulate sending
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.innerHTML = '<i class=\'bx bx-loader-alt bx-spin\'></i> ÄANG Gá»¬I...';
            submitBtn.disabled = true;

            setTimeout(() => {
                contactForm.style.display = 'none';
                formSuccess.classList.add('show');
            }, 1800);
        });

        /* =========================================
           AUTO HIGHLIGHT TODAY'S HOURS
           ========================================= */
        const today = new Date().getDay(); // 0=Sun, 6=Sat
        const allHoursRows = document.querySelectorAll('.hours-row');
        allHoursRows.forEach(row => row.classList.remove('today'));

        const todayBadgeHTML = ' <span class="today-badge">HÃ”M NAY</span>';

        if (today === 6) {
            // Saturday
            const satRow = document.getElementById('hours-saturday');
            if (satRow) satRow.classList.add('today');
        } else if (today === 0) {
            // Sunday
            allHoursRows[2]?.classList.add('today');
        } else {
            // Weekday
            allHoursRows[0]?.classList.add('today');
        }

        /* =========================================
           FLOATING QUICK CONTACT TOGGLE
           ========================================= */
        let floatOpen = false;
        function toggleFloat() {
            floatOpen = !floatOpen;
            const btns = document.querySelectorAll('.float-btn');
            const toggle = document.getElementById('float-toggle');
            btns.forEach(btn => btn.classList.toggle('visible', floatOpen));
            toggle.classList.toggle('open', floatOpen);
        }

        /* =========================================
           SCROLL REVEAL ANIMATION (3D PERSPECTIVE GUNDAM SCAN)
           ========================================= */
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'perspective(1000px) translate3d(0, 0, 0) rotateX(0deg)';
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.info-card, .form-panel, .social-card, .hours-card, .faq-item, .why-card, .testi-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'perspective(1000px) translate3d(0, 50px, -80px) rotateX(15deg)';
            el.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            revealObserver.observe(el);
        });

        /* =========================================
           INTERACTIVE 3D TILT & HOLO REFLECT (GUNDAM HUD)
           ========================================= */
        const cards3D = document.querySelectorAll('.info-card, .why-card, .testi-card, .social-card, .hours-card, .form-panel');
        
        cards3D.forEach(card => {
            // Táº¡o lá»›p pháº£n chiáº¿u holo láº¥p lÃ¡nh bÃªn trong card
            const reflex = document.createElement('div');
            reflex.className = 'gundam-3d-reflex';
            card.appendChild(reflex);
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // TÃ­nh toÃ¡n tá»· lá»‡ pháº§n trÄƒm lá»‡ch tá»« tÃ¢m (-0.5 Ä‘áº¿n 0.5)
                const xPercent = (x / rect.width) - 0.5;
                const yPercent = (y / rect.height) - 0.5;
                
                // GÃ³c nghiÃªng tá»‘i Ä‘a
                const maxRotation = 10; // degrees
                
                const rotateX = -yPercent * maxRotation;
                const rotateY = xPercent * maxRotation;
                
                // Ãp dá»¥ng transform 3D xoay theo chuá»™t vÃ  nÃ¢ng nháº¹ cÃ¡c lá»›p con lÃªn
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                card.style.transition = 'none'; // Pháº£n há»“i tá»©c thÃ¬ khÃ´ng bá»‹ trá»…
                
                // Táº¡o vá»‡t pháº£n sÃ¡ng di chuyá»ƒn theo chuá»™t
                const reflexX = (x / rect.width) * 100;
                const reflexY = (y / rect.height) * 100;
                reflex.style.background = `radial-gradient(circle at ${reflexX}% ${reflexY}%, rgba(59, 130, 246, 0.25) 0%, transparent 60%)`;
                reflex.style.opacity = '1';
            });
            
            card.addEventListener('mouseleave', () => {
                // Tráº£ vá» tráº¡ng thÃ¡i cÃ¢n báº±ng mÆ°á»£t mÃ 
                card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s ease';
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
                reflex.style.transition = 'background 0.5s ease, opacity 0.5s ease';
                reflex.style.opacity = '0';
            });
        });

        /* =========================================
           AUTO-INJECT GUNDAM ARMOR SHIFTERS & MECH CHASSIS
           ========================================= */
        document.querySelectorAll('.info-card, .why-card, .testi-card, .social-card').forEach(card => {
            // Äáº£m báº£o card cÃ³ position relative
            card.style.position = 'relative';
            
            // Táº¡o Mech Chassis (khung gáº§m cÆ¡ khÃ­ áº©n phÃ­a dÆ°á»›i)
            const chassis = document.createElement('div');
            chassis.className = 'mech-chassis';
            chassis.innerHTML = `
                <div class="mech-warning-label">
                    <span class="blink-dot"></span>
                    HATCH OPEN : SYSTEM ACTV
                </div>
            `;
            card.insertBefore(chassis, card.firstChild);
            
            // Táº¡o 4 táº¥m giÃ¡p gÃ³c trÆ°á»£t phÃ¢n rÃ£ (Armor Shifters)
            const corners = ['tl', 'tr', 'bl', 'br'];
            corners.forEach(pos => {
                const shifter = document.createElement('div');
                shifter.className = `armor-shifter ${pos}`;
                card.appendChild(shifter);
            });
        });
