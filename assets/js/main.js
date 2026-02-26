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
        let html = await res.text();
        // 將 navbar/footer 中的 ../../ 動態替換為當前頁面正確的 ROOT_PREFIX
        html = html.replace(/href=\"\.\.\/\.\.\//g, 'href=\"' + window.ROOT_PREFIX);
        html = html.replace(/src=\"\.\.\/\.\.\//g, 'src=\"' + window.ROOT_PREFIX);
        el.innerHTML = html;
        el.dataset.loaded = 'true';
    } catch (e) {
        console.warn(`模板載入失敗 (${url}):`, e);
    }
}

/* ── 自動推導路徑 prefix ── */
window.ROOT_PREFIX = (function () {
    const scripts = document.querySelectorAll('script');
    let prefix = './';
    scripts.forEach(s => {
        const src = s.getAttribute('src');
        if (src && src.includes('assets/js/main.js')) {
            prefix = src.replace('assets/js/main.js', '');
        }
    });
    return prefix || './';
})();

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', async () => {

    // 注入 Navbar & Footer
    await Promise.all([
        injectTemplate('#navbar-placeholder', window.ROOT_PREFIX + 'assets/templates/navbar.html'),
        injectTemplate('#footer-placeholder', window.ROOT_PREFIX + 'assets/templates/footer.html'),
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
        try {
            const resolvedPath = new URL(link.href).pathname;
            // Check if it's the home page mapping
            const isHome = resolvedPath === '/' || resolvedPath.endsWith('/index.html') || resolvedPath.endsWith('/cap-cca.org/');
            const isCurrentHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/cap-cca.org/');

            if (!isHome && path.startsWith(resolvedPath)) {
                link.classList.add('active');
            } else if (isHome && isCurrentHome) {
                link.classList.add('active');
            }
        } catch (e) { }
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
