/* ============================================================
   animations.js — IntersectionObserver 入場動畫
   ============================================================ */

const ANIM_SELECTORS = [
    '.animate-on-scroll',
    '.animate-fade',
    '.animate-left',
    '.animate-right',
    '.animate-scale',
].join(',');

let observer;

function createObserver() {
    return new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.10, rootMargin: '0px 0px -30px 0px' });
}

/**
 * 觀察所有尚未 .visible 的動畫元素（可多次呼叫）
 * content-loader.js 動態注入內容後需呼叫此函式
 */
function observeAll() {
    if (!observer) observer = createObserver();
    document.querySelectorAll(ANIM_SELECTORS).forEach(el => {
        if (!el.classList.contains('visible')) {
            observer.observe(el);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // 設定 stagger delay
    document.querySelectorAll('.stagger').forEach(parent => {
        Array.from(parent.children).forEach((child, i) => {
            child.style.setProperty('--stagger-i', i);
        });
    });

    observer = createObserver();
    // rAF 確保 layout 完成後觀察（首屏元素不被漏掉）
    requestAnimationFrame(() => setTimeout(observeAll, 80));
});

// 全域匯出，供 content-loader.js 呼叫
window.observeAnimations = observeAll;
