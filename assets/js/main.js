/* ============================================================
   main.js — 全域共用：模板注入、Navbar、Mobile選單、Back-to-top
   ============================================================ */

/* ── 模板注入 ── */
async function injectTemplate(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        el.innerHTML = await res.text();
        el.dataset.loaded = 'true';
    } catch (e) {
        console.warn(`模板載入失敗 (${url}):`, e);
    }
}

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', async () => {

    // 注入 Navbar & Footer
    await Promise.all([
        injectTemplate('#navbar-placeholder', '/assets/templates/navbar.html'),
        injectTemplate('#footer-placeholder', '/assets/templates/footer.html'),
    ]);

    initNavbar();
    initBackToTop();
    initMobileMenu();
    setActiveNavLink();
    initSmoothScroll();
    initFooterYear();
});

/* ── Navbar Scroll ── */
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ── Mobile Menu ── */
function initMobileMenu() {
    const hamburger = document.querySelector('.navbar__hamburger');
    const menu = document.querySelector('.navbar__mobile-menu');
    const overlay = document.querySelector('.mobile-overlay');
    if (!hamburger || !menu) return;

    const open = () => {
        hamburger.classList.add('open');
        menu.classList.add('open');
        overlay?.classList.add('open');
        document.body.style.overflow = 'hidden';
    };
    const close = () => {
        hamburger.classList.remove('open');
        menu.classList.remove('open');
        overlay?.classList.remove('open');
        document.body.style.overflow = '';
    };

    hamburger.addEventListener('click', () =>
        hamburger.classList.contains('open') ? close() : open()
    );
    overlay?.addEventListener('click', close);
    document.addEventListener('keydown', e => e.key === 'Escape' && close());
}

/* ── Active Nav Link ── */
function setActiveNavLink() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '/' && path.startsWith(href)) {
            link.classList.add('active');
        } else if (href === '/' && (path === '/' || path === '/index.html')) {
            link.classList.add('active');
        }
    });
}

/* ── Smooth Scroll ── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = document.querySelector(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const offset = (document.querySelector('.navbar')?.offsetHeight || 70) + 16;
            window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
        });
    });
}

/* ── Back to Top ── */
function initBackToTop() {
    const btn = document.querySelector('.back-to-top');
    if (!btn) return;
    const toggle = () => btn.classList.toggle('visible', window.scrollY > 300);
    window.addEventListener('scroll', toggle, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    toggle();
}

/* ── Footer 年份 ── */
function initFooterYear() {
    document.querySelectorAll('.footer-year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}
