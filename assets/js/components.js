/* ============================================================
   components.js — Tab、Accordion、Counter、其他互動元件
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initAccordions();
    initCounters();
});

/* ── Tab 切換 ── */
function initTabs() {
    document.querySelectorAll('[data-tabs]').forEach(container => {
        const btns = container.querySelectorAll('.tab-btn');
        const panels = container.querySelectorAll('.tab-panel');

        btns.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                panels[i]?.classList.add('active');
            });
        });
        // 預設第一個
        if (btns[0] && panels[0]) {
            btns[0].classList.add('active');
            panels[0].classList.add('active');
        }
    });
}

/* ── Accordion ── */
function initAccordions() {
    document.querySelectorAll('.accordion').forEach(acc => {
        acc.querySelectorAll('.accordion-header').forEach(header => {
            header.addEventListener('click', () => {
                const isOpen = header.classList.contains('open');
                // 同一 accordion 只開一個
                acc.querySelectorAll('.accordion-header').forEach(h => h.classList.remove('open'));
                acc.querySelectorAll('.accordion-body').forEach(b => b.classList.remove('open'));
                if (!isOpen) {
                    header.classList.add('open');
                    header.nextElementSibling?.classList.add('open');
                }
            });
        });
        // 預設第一個打開（可選，移除此段即可全收合）
        // const first = acc.querySelector('.accordion-header');
        // first?.click();
    });
}

/* ── 數字計數器 ── */
function initCounters() {
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.target, 10);
            if (isNaN(target)) return;
            counterObserver.unobserve(el);
            animateCounter(el, target);
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));
}

function animateCounter(el, target) {
    const duration = 1800;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3); // easeOutCubic

    const frame = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const value = Math.floor(ease(progress) * target);
        el.textContent = value.toLocaleString();
        if (progress < 1) requestAnimationFrame(frame);
        else el.textContent = target.toLocaleString();
    };
    requestAnimationFrame(frame);
}
