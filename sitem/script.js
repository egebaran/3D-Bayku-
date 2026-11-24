/**
 * EGE BARAN — KİŞİSEL WEB SİTESİ
 * Neo-brutalist Etkileşim Scripti
 */

document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initMobileMenu();
  initScrollSpy();
  initGeziFilter();
});

/* ==========================================================================
   1. YUMUŞAK KAYDIRMA (SMOOTH SCROLL)
   Navbar yüksekliğini hesaba katarak bağlantılara kaydırır
   ========================================================================== */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  const navbar = document.getElementById('navbar');
  const navLinks = document.getElementById('navLinks');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();

      // Mobil menü açıksa kapat
      if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
      }

      const navHeight = navbar ? navbar.offsetHeight : 0;
      const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - navHeight - 10;

      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: 'smooth'
      });
    });
  });
}

/* ==========================================================================
   2. MOBİL MENÜ TOGGLE
   ========================================================================== */
function initMobileMenu() {
  const toggleBtn = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  if (!toggleBtn || !navLinks) return;

  toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });

  // Sayfa dışına tıklandığında menüyü kapat
  document.addEventListener('click', (e) => {
    if (!toggleBtn.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
    }
  });
}

/* ==========================================================================
   3. SCROLL SPY (AKTİF MENÜ VURGUSU)
   ========================================================================== */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links .nav-link');

  if (!sections.length || !navItems.length) return;

  function updateActiveLink() {
    const scrollY = window.pageYOffset;
    const navbar = document.getElementById('navbar');
    const navHeight = navbar ? navbar.offsetHeight : 80;

    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - navHeight - 30;
      const sectionId = current.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navItems.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();
}

/* ==========================================================================
   4. GEZİ ZİYARETÇİ FİLTRESİ (KAŞİF & BİLGİN)
   ========================================================================== */
function initGeziFilter() {
  const filterBtns = document.querySelectorAll('.neo-filter-btn');
  const geziCards = document.querySelectorAll('.gezi-card');

  if (!filterBtns.length || !geziCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Buton aktiflik durumunu güncelle
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Kartları filtrele
      geziCards.forEach(card => {
        const persona = card.getAttribute('data-persona');
        if (filter === 'all' || persona === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}