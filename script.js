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
   3D CUBES PARALLAX ON MOUSEMOVE
   ========================================= */
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
        if(window.innerWidth > 768) {
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
   SPOTLIGHT SLIDER LOGIC
   ========================================= */
const spotlightData = [
    {
        title: "PG UNLEASHED",
        highlight: "RX-78-2",
        armor: "95%",
        mobility: "80%",
        weapon: "90%",
        price: "6,850,000₫",
        img: "assets/images/PG/pg_unleashed.png"
    },
    {
        title: "MG WING GUNDAM",
        highlight: "ZERO EW",
        armor: "70%",
        mobility: "95%",
        weapon: "85%",
        price: "1,550,000₫",
        img: "assets/images/MG/WingZero.png"
    },
    {
        title: "RG SAZABI",
        highlight: "MSN-04",
        armor: "85%",
        mobility: "75%",
        weapon: "95%",
        price: "1,150,000₫",
        img: "assets/images/RG/Sazabi.png"
    }
];

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
