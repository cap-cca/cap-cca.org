/* ============================================================
   content-loader.js — 從 JSON 讀取資料並渲染到頁面
   ============================================================ */

const BASE = window.ROOT_PREFIX + 'assets/data';
const BUST = `?v=${Date.now()}`;

async function loadJSON(path) {
    const res = await fetch(`${BASE}/${path}${BUST}`);
    if (!res.ok) throw new Error(`無法讀取 ${path}`);
    return res.json();
}

/* 動態注入後重新觀察動畫 */
function refreshAnimations() {
    // 更新 stagger delay
    document.querySelectorAll('.stagger').forEach(parent => {
        Array.from(parent.children).forEach((child, i) => {
            child.style.setProperty('--stagger-i', i);
        });
    });
    // 觸發新注入元素的觀察
    if (typeof window.observeAnimations === 'function') {
        window.observeAnimations();
    }
}

/* ── 最新消息：列表 ── */
async function renderNewsList(containerId, limit = 999) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const { articles } = await loadJSON('news.json');
        const sorted = [...articles].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        }).slice(0, limit);

        el.innerHTML = sorted.map(art => `
      <a class="card news-card animate-on-scroll" href="${window.ROOT_PREFIX}news/article/?id=${art.id}">
        <div class="news-card__accent news-card__accent--${getCategoryClass(art.category)}"></div>
        <div class="news-card__body">
          <div class="news-card__meta">
            <span class="badge badge--${getCategoryClass(art.category)}">${art.category}</span>
            <span class="news-card__date">${formatDate(art.date)}</span>
            ${art.pinned ? '<span class="badge badge--accent">置頂</span>' : ''}
          </div>
          <h3 class="news-card__title">${art.title}</h3>
          <p class="news-card__summary">${art.summary}</p>
          <span class="news-card__link">閱讀更多 →</span>
        </div>
      </a>
    `).join('');

        refreshAnimations();
    } catch (e) {
        console.warn('消息載入失敗', e);
        el.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1; padding: var(--space-8);">暫無資料</p>';
    }
}

/* ── 最新消息：單篇文章 ── */
async function renderNewsArticle() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return;
    try {
        const { articles } = await loadJSON('news.json');
        const art = articles.find(a => a.id === id);
        if (!art) {
            document.getElementById('article-body').innerHTML = '<p>找不到此文章</p>';
            return;
        }

        document.title = `${art.title} ｜社團法人中華亞太文化交流協會`;
        const titleEl = document.getElementById('article-title');
        const metaEl = document.getElementById('article-meta');
        const bodyEl = document.getElementById('article-body');
        const breadEl = document.getElementById('article-breadcrumb');

        if (titleEl) titleEl.textContent = art.title;
        if (breadEl) breadEl.textContent = art.title;
        if (metaEl) metaEl.innerHTML = `
      <span class="badge badge--${getCategoryClass(art.category)}">${art.category}</span>
      <span style="color: var(--color-neutral-500); font-size: var(--text-sm);">${formatDate(art.date)}</span>
    `;
        if (bodyEl) bodyEl.innerHTML = art.content || '';
    } catch (e) {
        console.warn(e);
    }
}

/* ── 課程 Tab ── */
async function renderCourses(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const { categories } = await loadJSON('courses.json');
        const tabList = el.querySelector('.tab-list');
        const tabPanels = el.querySelector('.tab-panels');
        if (!tabList || !tabPanels) return;

        // 取出目前的 hash（移除 #）來決定預設開啟的 tab
        const hash = window.location.hash.substring(1);
        let activeIndex = 0;
        if (hash) {
            const matchIndex = categories.findIndex(c => c.id === hash);
            if (matchIndex !== -1) activeIndex = matchIndex;
        }

        categories.forEach((cat, i) => {
            const isActive = i === activeIndex;

            const btn = document.createElement('button');
            btn.className = 'tab-btn' + (isActive ? ' active' : '');
            btn.textContent = `${cat.icon} ${cat.name}`;
            btn.setAttribute('data-target', cat.id);
            tabList.appendChild(btn);

            const panel = document.createElement('div');
            panel.className = 'tab-panel' + (isActive ? ' active' : '');
            panel.id = cat.id;
            panel.innerHTML = cat.courses.length === 0
                ? '<p class="text-muted" style="padding: var(--space-8); text-align: center;">課程規劃中，敬請期待</p>'
                : `<div class="grid grid-3">${cat.courses.map(c => `
            <div class="card" style="padding: var(--space-6);">
              <h4 style="font-family:var(--font-serif); margin-bottom: var(--space-3);">${c.name}</h4>
              <p style="font-size: var(--text-sm); color: var(--color-neutral-500); margin-bottom: var(--space-4); line-height: 1.7;">${c.description}</p>
              <div style="display:flex; gap: var(--space-2); flex-wrap:wrap;">
                <span class="badge badge--primary">🕒 ${c.hours} 小時</span>
                <span class="badge badge--neutral">👥 ${c.audience}</span>
                <span class="badge badge--accent">💰 ${c.fee}</span>
              </div>
            </div>`).join('')}
          </div>`;
            tabPanels.appendChild(panel);
        });

        // 初始化 Tab 事件
        const btns = tabList.querySelectorAll('.tab-btn');
        const panels = tabPanels.querySelectorAll('.tab-panel');
        btns.forEach((btn, i) => {
            btn.addEventListener('click', () => {
                btns.forEach(b => b.classList.remove('active'));
                panels.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                panels[i]?.classList.add('active');

                // 更新 URL hash
                const targetId = btn.getAttribute('data-target');
                if (targetId) {
                    window.history.replaceState(null, null, '#' + targetId);
                }
            });
        });

        refreshAnimations();
    } catch (e) {
        console.warn('課程載入失敗', e);
    }
}

async function renderStats(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const { stats } = await loadJSON('about.json');
        if (!stats) return;

        el.innerHTML = stats.map(s => `
            <div class="stat-item animate-scale">
                <div class="stat-number">
                    <span data-target="${s.value}">${s.value !== '?' ? '0' : '?'}</span><span class="stat-suffix">${s.suffix || ''}</span>
                </div>
                <div class="stat-label">${s.label}</div>
            </div>
        `).join('');

        if (typeof window.observeAnimations === 'function') {
            window.observeAnimations();
        }
        if (typeof window.initCounters === 'function') {
            window.initCounters();
        }
    } catch (e) {
        console.warn('亮點數字載入失敗', e);
    }
}

async function renderHistory(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        const { history } = await loadJSON('about.json');
        if (!history) return;

        el.innerHTML = history.map(h => `
            <div class="timeline-item animate-on-scroll">
                <div class="timeline-dot"></div>
                <div class="timeline-card">
                    <div class="timeline-year">${h.year}</div>
                    <p class="timeline-content">${h.content}</p>
                </div>
            </div>
        `).join('');

        if (typeof window.observeAnimations === 'function') {
            window.observeAnimations();
        }
    } catch (e) {
        console.warn('沿革載入失敗', e);
    }
}

/* ── 工具函式 ── */
function formatDate(str) {
    const d = new Date(str + 'T00:00:00');
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function getCategoryClass(cat) {
    const map = { '公告': 'announcement', '期刊': 'journal', '活動': 'event' };
    return map[cat] || 'primary';
}

// 全域匯出
window.CMS = { renderNewsList, renderNewsArticle, renderCourses, renderStats, renderHistory, loadJSON };
