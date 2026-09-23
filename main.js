/* ============================================================
   肌極工作室 ・ 官方網站
   - 「STUDIO」與「COACHES」是要換成真實資料的地方
   ============================================================ */
'use strict';

const STUDIO = {
  phone: '（請填入電話）',
  line: '（請填入 LINE ID）',
  address: '台中市神岡區社口里中山路742巷7號',
  hours: '09:00–21:00',
};

// photo：教練照片檔案路徑，放進 coaches/ 資料夾（例如 coaches/steven.jpg）即可自動顯示；
//        沒有檔案時會自動顯示姓名字首當作預設圖。certs：證照／資歷，還沒拿到資料前先留白提示。
const COACHES = [
  {
    id: 'steven', name: 'Steven', role: '肌力・體態教練', photo: 'coaches/steven.jpg',
    tags: ['重量訓練', '體態雕塑', '基礎肌力', '放鬆與舒緩服務'],
    bio: '以循序漸進的方式，帶您建立正確的動作與長期習慣，讓力量與線條一起進步。',
    certs: ['（教練資歷／證照，待補充）'],
  },
  {
    id: 'ber', name: 'Ber', role: '減脂・恢復教練', photo: 'coaches/ber.jpg',
    tags: ['減脂塑形', '功能性訓練', '運動恢復', '放鬆與舒緩服務'],
    bio: '從日常體能與生活節奏出發，設計您做得到、也做得久的訓練計畫。',
    certs: ['（教練資歷／證照，待補充）'],
  },
];

// 健身諮詢頁內嵌的 Google 表單（回覆會自動寄到表單擁有者信箱，並可連結 Google 試算表）
const GFORM_ID = '1FAIpQLSfdv10wPhHXLqQmfGU9Xld2O3-WJLb_I3J317aU8ZJ2-Go7tw';
const GFORM_ENTRY = { coach: 'entry.1372673715', goal: 'entry.162615366' };
const GFORM_COACH_LABEL = { steven: 'Steven', ber: 'Ber' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 小工具 ---------- */
const pad = n => String(n).padStart(2, '0');

/* ============================================================
   進場動畫（IntersectionObserver）
   ============================================================ */
const io = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }
}, { threshold: .15, rootMargin: '0px 0px -6% 0px' });

function armReveals(view) {
  $$('[data-reveal]', view).forEach(el => {
    el.classList.remove('in');
    io.observe(el);
  });
}

/* ============================================================
   首頁：教練卡（由資料產生）
   ============================================================ */
function renderCoachCards() {
  $('#coachCards').innerHTML = COACHES.map((c, i) => `
    <article class="coach" data-reveal style="--d:${0.1 + i * 0.1}s">
      <span class="coach-mono" aria-hidden="true">${c.name[0]}</span>
      <p class="role">${c.role}</p>
      <h3>${c.name}</h3>
      <p class="bio">${c.bio}</p>
      <div class="chips">${c.tags.map(t => `<span>${t}</span>`).join('')}</div>
      <a class="btn btn-sm" href="#/coaches?coach=${c.id}">認識 ${c.name} <i class="arr">→</i></a>
    </article>`).join('');
}

/* ============================================================
   認識教練頁：每位教練的完整介紹
   ============================================================ */
function renderCoachDetail() {
  $('#coachDetail').innerHTML = COACHES.map((c, i) => `
    <article class="cd" id="coach-${c.id}" data-reveal style="--d:${0.1 + i * 0.12}s">
      <div class="cd-photo">
        <span class="cd-fallback" aria-hidden="true">${c.name[0]}</span>
        <img src="${c.photo}" alt="${c.name} 教練照片" loading="lazy" onerror="this.remove()">
      </div>
      <div class="cd-info">
        <p class="role">${c.role}</p>
        <h2>${c.name}</h2>
        <p class="bio">${c.bio}</p>
        <div class="chips">${c.tags.map(t => `<span>${t}</span>`).join('')}</div>
        ${c.certs?.length ? `
        <div class="cd-certs">
          <h4>專業資歷</h4>
          <ul>${c.certs.map(x => `<li>${x}</li>`).join('')}</ul>
        </div>` : ''}
        <a class="btn" href="#/consult?coach=${c.id}">預約諮詢 ${c.name} <i class="arr">→</i></a>
      </div>
    </article>`).join('');
}

function renderFooter() {
  $('#footInfo').innerHTML = [
    ['電話', STUDIO.phone], ['LINE', STUDIO.line], ['地址', STUDIO.address], ['時間', STUDIO.hours],
  ].map(([k, v]) => `<li><b>${k}</b>${v}</li>`).join('');
  $('#year').textContent = new Date().getFullYear();
}

/* ============================================================
   捲動驅動效果
   ============================================================ */
const nav = $('#nav');
const hero = $('#hero');
const litSection = $('.lit');
const litText = $('#litText');
const story = $('#story');
const ringFg = $('#ringFg');
const ringNum = $('#ringNum');
const storyBar = $('#storyBar');
const steps = $$('.step');
const RING_LEN = 552.9;
let words = [];
let lastY = 0;
let currentStep = -1;
let currentView = 'home';
let ticking = false;

// 元素的位置/高度只在版面真的變動時（載入、轉向、鍵盤收合…）量一次，
// 捲動當下完全不再讀取版面，避免手機捲動時邊寫樣式邊讀版面造成的頓挫、抖動。
const geo = { heroH: 0, litTop: 0, litH: 0, storyTop: 0, storyH: 0 };
function measure() {
  geo.heroH = hero.offsetHeight;
  geo.litTop = litSection.offsetTop;
  geo.litH = litSection.offsetHeight;
  geo.storyTop = story.offsetTop;
  geo.storyH = story.offsetHeight;
}

// 把理念文字拆成單字，捲動時逐字點亮（中文沒有空白斷詞，所以逐字處理）
(function splitWords() {
  const text = litText.textContent.trim();
  litText.setAttribute('aria-label', text);
  litText.innerHTML = [...text].map(ch => `<span class="w" aria-hidden="true">${ch}</span>`).join('');
  words = $$('.w', litText);
})();

function progressFromCache(top, height) {
  return clamp((scrollY - top) / (height - innerHeight));
}

function update() {
  ticking = false;
  const y = scrollY;
  const dy = y - lastY;

  // 導覽列：捲動後出現毛玻璃，往下捲隱藏、往上捲顯示
  // 只在位移超過一點雜訊範圍時才切換，避免手機捲動時的微小抖動讓導覽列閃爍
  nav.classList.toggle('solid', y > 30);
  if (Math.abs(dy) > 4) {
    nav.classList.toggle('hide', dy > 0 && y > 240);
    lastY = y;
  }

  if (currentView !== 'home') return;

  // Hero 視差
  hero.style.setProperty('--p', clamp(y / geo.heroH).toFixed(4));

  // 文字逐字點亮
  const lp = progressFromCache(geo.litTop, geo.litH);
  const n = words.length;
  const span = 6;
  for (let i = 0; i < n; i++) {
    const a = clamp((lp * 1.08 * (n + span) - i) / span);
    words[i].style.opacity = (.14 + a * .86).toFixed(3);
  }

  // 三步驟
  const sp = progressFromCache(geo.storyTop, geo.storyH);
  const idx = Math.min(steps.length - 1, Math.floor(sp * steps.length));
  ringFg.style.strokeDashoffset = (RING_LEN * (1 - sp)).toFixed(1);
  storyBar.style.transform = `scaleX(${sp.toFixed(4)})`;
  if (idx !== currentStep) {
    currentStep = idx;
    steps.forEach((s, i) => s.classList.toggle('on', i === idx));
    ringNum.textContent = pad(idx + 1);
  }
}
function requestUpdate() {
  if (!ticking) { ticking = true; requestAnimationFrame(update); }
}
function requestRemeasure() {
  measure();
  requestUpdate();
}
addEventListener('scroll', requestUpdate, { passive: true });
// 螢幕尺寸真的改變時才重新量版面：手機轉向、網址列自動收合展開都會觸發 resize
addEventListener('resize', requestRemeasure);
addEventListener('load', requestRemeasure);
// Google Fonts 是非同步載入的，字體真正套用的那一刻上方文字排版會微調，
// 下面區塊的實際位置也會跟著移動，所以字體就緒後要再量一次，快取的位置才會準
document.fonts?.ready?.then(requestRemeasure).catch(() => {});

// 「向下捲動」按鈕
document.addEventListener('click', e => {
  const b = e.target.closest('[data-scroll]');
  if (!b) return;
  $(b.dataset.scroll).scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});

/* ============================================================
   路由 + 滑順轉場
   #/  #/massage  #/consult?coach=ber&goal=massage
   ============================================================ */
const wipe = $('#wipe');
const VIEWS = ['home', 'massage', 'coaches', 'consult'];
const TITLES = {
  home: '肌極工作室｜女性私人健身',
  massage: '放鬆與舒緩服務｜肌極工作室',
  coaches: '認識教練｜肌極工作室',
  consult: '健身諮詢預約｜肌極工作室',
};
let busy = false;
let pending = null;

function parseHash() {
  const [path, query = ''] = location.hash.replace(/^#/, '').split('?');
  const name = path.replace(/^\//, '') || 'home';
  return { name: VIEWS.includes(name) ? name : 'home', params: new URLSearchParams(query) };
}

const wait = ms => new Promise(r => setTimeout(r, ms));

function showView(name, params) {
  $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  currentView = name;
  document.title = TITLES[name];
  $$('[data-nav]').forEach(a => a.classList.toggle('cur', a.dataset.nav === name));
  window.scrollTo(0, 0);
  lastY = 0;
  nav.classList.remove('hide');
  armReveals($(`#view-${name}`));
  if (name === 'consult') loadConsultForm(params);
  if (name === 'coaches') scrollToCoach(params.get('coach'));
  currentStep = -1;
  update();
}

async function navigate(first = false) {
  const { name, params } = parseHash();
  if (first || reduceMotion) { showView(name, params); return; }

  if (busy) { pending = true; return; }
  busy = true;
  document.body.classList.add('locked');

  wipe.classList.remove('leave');
  void wipe.offsetWidth;                 // 重置動畫起點
  wipe.classList.add('cover');
  await wait(760);                       // 遮罩蓋滿
  showView(name, params);
  await wait(120);
  wipe.classList.remove('cover');
  wipe.classList.add('leave');
  await wait(640);
  wipe.classList.remove('leave');

  document.body.classList.remove('locked');
  busy = false;
  if (pending) { pending = null; navigate(); }
}

addEventListener('hashchange', () => navigate());

// 點目前所在頁的連結：不轉場，只回到頁面頂端
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]');
  if (!a) return;
  const target = new URL(a.href).hash;
  if (target === (location.hash || '#/')) {
    e.preventDefault();
    scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
});

/* ============================================================
   健身諮詢表單（內嵌 Google 表單）
   從連結帶入預設值：#/consult?coach=ber&goal=massage
   會自動預先勾選教練 / 諮詢方向，使用者送出時仍可自行修改。
   ============================================================ */
const gform = $('#gform');
const gformOpen = $('#gformOpen');

function buildFormSrc(params, embedded) {
  const url = new URL(`https://docs.google.com/forms/d/e/${GFORM_ID}/viewform`);
  if (embedded) url.searchParams.set('embedded', 'true');
  const coachLabel = GFORM_COACH_LABEL[params.get('coach')];
  if (coachLabel) url.searchParams.set(GFORM_ENTRY.coach, coachLabel);
  if (params.get('goal') === 'massage') url.searchParams.set(GFORM_ENTRY.goal, '運動按摩');
  return url.toString();
}

function loadConsultForm(params) {
  gform.src = buildFormSrc(params, true);
  gformOpen.href = buildFormSrc(params, false);
}

// 從連結帶入指定教練：#/coaches?coach=ber → 直接捲到該教練的介紹
function scrollToCoach(coachId) {
  const el = coachId && $(`#coach-${coachId}`);
  if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }));
}

/* ============================================================
   啟動
   ============================================================ */
renderCoachCards();
renderCoachDetail();
renderFooter();
measure();
navigate(true);
