/* ============================================================
   main.js — 全域共用：模板注入、Navbar、Mobile選單、Back-to-top
   ============================================================ */

/* ── 模板注入 ── */
async function injectTemplate(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
        const res = await fetch(url + '?v=' + new Date().getTime());
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
    window.navbarLoaded = true;
    document.dispatchEvent(new Event('navbarLoaded'));

    // 動態填入期刊導覽連結（從 journals.json 讀取）
    injectJournalNavLinks();

    // 動態填入聯絡資訊（從 contact.json 讀取）
    injectContactInfo();

    initNavbar();
    initBackToTop();
    initMobileMenu();
    setActiveNavLink();
    initSmoothScroll();
    initFooterYear();
});

/* ── 動態聯絡資訊填入 ── */
async function injectContactInfo() {
    try {
        const res = await fetch(window.ROOT_PREFIX + 'assets/data/contact.json?v=' + Date.now());
        if (!res.ok) return;
        const d = await res.json();

        // ── 電子信箱 ──
        if (d.email) {
            // footer 聯絡區塊
            const emailItem = document.getElementById('footer-email-item');
            const emailText = document.querySelector('[data-email-text]');
            if (emailItem) emailItem.style.display = '';
            if (emailText) {
                emailText.textContent = d.email;
                emailText.href = 'mailto:' + d.email;
            }
            // footer icon 連結
            const emailIconLink = document.querySelector('[data-email-link]');
            if (emailIconLink) {
                emailIconLink.href = 'mailto:' + d.email;
                emailIconLink.style.display = '';
            }
            // member 頁面的 mailto 按鈕（若存在）
            document.querySelectorAll('a[href^="mailto:"]:not([data-email-text])').forEach(a => {
                if (a.href.includes('cap-cca.org')) {
                    a.href = 'mailto:' + d.email;
                    if (a.textContent.includes('@')) a.textContent = '📧 ' + d.email;
                }
            });
        }

        // ── 電話 ──
        if (d.phone) {
            const phoneItem = document.getElementById('footer-phone-item');
            const phoneTxt = document.querySelector('[data-phone-text]');
            if (phoneItem) phoneItem.style.display = '';
            if (phoneTxt) phoneTxt.textContent = d.phone;
        }

        // ── 地址 ──
        if (d.address) {
            const addrItem = document.getElementById('footer-address-item');
            const addrTxt = document.querySelector('[data-address-text]');
            if (addrItem) addrItem.style.display = '';
            if (addrTxt) addrTxt.textContent = d.address;
        }

        // ── 外部連結（社群）──
        const socialContainer = document.getElementById('footer-social-links');
        if (socialContainer && Array.isArray(d.links)) {
            // Facebook SVG icon map
            const iconMap = {
                facebook: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>',
                instagram: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
                youtube: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22 8s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C15.2 4 12 4 12 4s-3.2 0-5.8.2c-.6 0-1.9 0-3 1.3C2.3 6 2 8 2 8S1.7 10.3 1.7 12.5v2.1C1.7 16.8 2 19 2 19c0 .5.3 2 1.2 2.8 1.1 1.2 2.6 1.1 3.3 1.2C8.8 23.2 12 23.3 12 23.3s3.2 0 5.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.3.3-4.4v-2.1C22.3 10.3 22 8 22 8zM9.7 15.5V8.6l7.3 3.5-7.3 3.4z"/></svg>',
                line: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 5.8 2 10.5c0 4 3.4 7.4 8 8.2v3.3l4-2.7c.7.1 1.3.2 2 .2 5.5 0 10-3.8 10-8.5C26 5.8 17.5 2 12 2z"/></svg>',
            };
            d.links.forEach(link => {
                const a = document.createElement('a');
                a.href = link.url;
                a.target = '_blank';
                a.rel = 'noopener';
                a.setAttribute('aria-label', link.label);
                a.innerHTML = iconMap[link.icon] || link.label;
                socialContainer.insertBefore(a, socialContainer.querySelector('[data-email-link]'));
            });
        }
    } catch (e) {
        console.warn('聯絡資訊載入失敗:', e);
    }
}

/* ── 動態期刊導覽 ── */
async function injectJournalNavLinks() {
    try {
        const res = await fetch(window.ROOT_PREFIX + 'assets/data/journals.json?v=' + Date.now());
        if (!res.ok) return;
        const { journals } = await res.json();

        const desktopDropdown = document.getElementById('journal-dropdown');
        const mobileLinks = document.getElementById('journal-mobile-links');

        if (!journals || (!desktopDropdown && !mobileLinks)) return;

        // 只顯示 active = true 的期刊
        const activeJournals = journals.filter(j => j.active !== false);

        const makeLink = (j, prefix) =>
            `<a href="${prefix}journal/${j.id}/">${j.name}</a>`;
        const mobilePrefix = window.ROOT_PREFIX;

        if (desktopDropdown) {
            // 保留第一個「期刊總覽」，僅追加個別期刊
            const existing = desktopDropdown.querySelector('a');
            desktopDropdown.innerHTML = '';
            if (existing) desktopDropdown.appendChild(existing);
            activeJournals.forEach(j => {
                const a = document.createElement('a');
                a.href = `${mobilePrefix}journal/info.html?id=${j.id}`;
                a.textContent = j.name;
                desktopDropdown.appendChild(a);
            });
        }

        if (mobileLinks) {
            const existing = mobileLinks.querySelector('a');
            mobileLinks.innerHTML = '';
            if (existing) mobileLinks.appendChild(existing);
            activeJournals.forEach(j => {
                const a = document.createElement('a');
                a.href = `${mobilePrefix}journal/info.html?id=${j.id}`;
                a.textContent = j.name;
                mobileLinks.appendChild(a);
            });
        }
    } catch (e) {
        console.warn('期刊導覽連結載入失敗', e);
    }
}

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
