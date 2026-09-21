/* ============================================================
   肌極工作室 ・ 官方網站
   - 「STUDIO」與「COACHES」是要換成真實資料的地方
   ============================================================ */
'use strict';

const STUDIO = {
  phone: '（請填入電話）',
  line: '（請填入 LINE ID）',
  address: '（請填入地址）',
  hours: '（請填入營業時間）',
};

const COACHES = [
  {
    id: 'steven', name: 'Steven', role: '肌力・體態教練',
    tags: ['重量訓練', '體態雕塑', '基礎肌力'],
    bio: '以循序漸進的方式，帶妳建立正確的動作與長期習慣，讓力量與線條一起進步。',
  },
  {
    id: 'ber', name: 'Ber', role: '減脂・恢復教練',
    tags: ['減脂塑形', '功能性訓練', '運動恢復'],
    bio: '從日常體能與生活節奏出發，設計妳做得到、也做得久的訓練計畫。',
  },
];

const GOALS = [
  { id: 'fatloss', label: '減脂塑形' },
  { id: 'muscle', label: '增肌力量' },
  { id: 'posture', label: '體態矯正' },
  { id: 'recover', label: '體能恢復' },
  { id: 'massage', label: '放鬆與舒緩服務' },
  { id: 'other', label: '其他' },
];

const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
const DAYS_AHEAD = 14;
const STORE_KEY = 'wzz_bookings_v1';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 小工具 ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

function loadBookings() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
}
function saveBooking(b) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify([...loadBookings(), b])); } catch { /* 隱私模式等情況 */ }
}

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
      <a class="btn btn-sm" href="#/consult?coach=${c.id}">預約 ${c.name} <i class="arr">→</i></a>
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

// 把理念文字拆成單字，捲動時逐字點亮（中文沒有空白斷詞，所以逐字處理）
(function splitWords() {
  const text = litText.textContent.trim();
  litText.setAttribute('aria-label', text);
  litText.innerHTML = [...text].map(ch => `<span class="w" aria-hidden="true">${ch}</span>`).join('');
  words = $$('.w', litText);
})();

function progressOf(el) {
  const r = el.getBoundingClientRect();
  return clamp(-r.top / (r.height - innerHeight));
}

function update() {
  ticking = false;
  const y = scrollY;

  // 導覽列：捲動後出現毛玻璃，往下捲隱藏、往上捲顯示
  nav.classList.toggle('solid', y > 30);
  nav.classList.toggle('hide', y > lastY && y > 240);
  lastY = y;

  if (currentView !== 'home') return;

  // Hero 視差
  hero.style.setProperty('--p', clamp(y / hero.offsetHeight).toFixed(4));

  // 文字逐字點亮
  const lp = progressOf(litSection);
  const n = words.length;
  const span = 6;
  for (let i = 0; i < n; i++) {
    const a = clamp((lp * 1.08 * (n + span) - i) / span);
    words[i].style.opacity = (.14 + a * .86).toFixed(3);
  }

  // 三步驟
  const sp = progressOf(story);
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
addEventListener('scroll', requestUpdate, { passive: true });
addEventListener('resize', requestUpdate);

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
const VIEWS = ['home', 'massage', 'consult'];
const TITLES = {
  home: '肌極工作室｜女性私人健身',
  massage: '放鬆與舒緩服務｜肌極工作室',
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
  if (name === 'consult') applyConsultParams(params);
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
   預約表單
   ============================================================ */
const form = $('#bookForm');
const state = { coach: null, date: null, time: null, goals: new Set() };
const dom = {
  coachPick: $('#coachPick'), dates: $('#dates'), slots: $('#slots'), slotHint: $('#slotHint'),
  goals: $('#goals'), name: $('#fName'), phone: $('#fPhone'), note: $('#fNote'),
  eName: $('#eName'), ePhone: $('#ePhone'), submit: $('#submitBtn'), submitHint: $('#submitHint'),
  sCoach: $('#sCoach'), sDate: $('#sDate'), sTime: $('#sTime'), sName: $('#sName'),
};
const coachById = id => COACHES.find(c => c.id === id);

function radioButtons(container) { return $$('[role="radio"]', container); }
function setChecked(container, el) {
  radioButtons(container).forEach(b => {
    b.setAttribute('aria-checked', String(b === el));
    b.tabIndex = b === el ? 0 : -1;
  });
}
// 方向鍵切換（radiogroup 的鍵盤操作）
function enableArrowNav(container) {
  container.addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    const list = radioButtons(container).filter(b => !b.disabled);
    const i = list.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = list[(i + (['ArrowLeft', 'ArrowUp'].includes(e.key) ? -1 : 1) + list.length) % list.length];
    next.focus(); next.click();
  });
}

function buildCoachPick() {
  dom.coachPick.innerHTML = COACHES.map(c => `
    <button type="button" class="pick" role="radio" aria-checked="false" tabindex="0" data-id="${c.id}">
      <i class="ck"></i>
      <span class="nm">${c.name}</span>
      <span class="rl">${c.role}</span>
    </button>`).join('');
  dom.coachPick.addEventListener('click', e => {
    const b = e.target.closest('.pick'); if (!b) return;
    state.coach = b.dataset.id; state.time = null;
    setChecked(dom.coachPick, b);
    renderSlots(); renderSummary();
  });
  enableArrowNav(dom.coachPick);
}

function buildDates() {
  const today = new Date();
  dom.dates.innerHTML = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const label = i === 0 ? '今天' : i === 1 ? '明天' : `${d.getMonth() + 1}月`;
    return `<button type="button" class="date" role="radio" aria-checked="false" tabindex="0" data-date="${ymd(d)}">
      <small>週${WEEK[d.getDay()]}</small><strong>${d.getDate()}</strong><span>${label}</span></button>`;
  }).join('');
  dom.dates.addEventListener('click', e => {
    const b = e.target.closest('.date'); if (!b) return;
    state.date = b.dataset.date; state.time = null;
    setChecked(dom.dates, b);
    renderSlots(); renderSummary();
  });
  enableArrowNav(dom.dates);
}

function renderSlots() {
  const { coach, date } = state;
  if (!coach || !date) {
    dom.slots.innerHTML = '';
    dom.slotHint.textContent = '請先選擇教練與日期。';
    return;
  }
  const now = new Date();
  const isToday = date === ymd(now);
  const taken = new Set(loadBookings().filter(b => b.coach === coach && b.date === date).map(b => b.time));
  dom.slots.innerHTML = TIMES.map(t => {
    const past = isToday && Number(t.slice(0, 2)) <= now.getHours();
    const off = past || taken.has(t);
    return `<button type="button" class="slot" role="radio" aria-checked="false" tabindex="0" data-time="${t}" ${off ? 'disabled' : ''}>${t}</button>`;
  }).join('');
  const free = dom.slots.querySelectorAll('.slot:not(:disabled)').length;
  dom.slotHint.textContent = free ? `${coachById(coach).name} 於此日可預約 ${free} 個時段。` : '此日已無可預約時段，請改選其他日期。';
}
dom.slots.addEventListener('click', e => {
  const b = e.target.closest('.slot'); if (!b || b.disabled) return;
  state.time = b.dataset.time;
  setChecked(dom.slots, b);
  renderSummary();
});
enableArrowNav(dom.slots);

function buildGoals() {
  dom.goals.innerHTML = GOALS.map(g => `<button type="button" class="goal" aria-pressed="false" data-id="${g.id}">${g.label}</button>`).join('');
  dom.goals.addEventListener('click', e => {
    const b = e.target.closest('.goal'); if (!b) return;
    const on = !state.goals.has(b.dataset.id);
    on ? state.goals.add(b.dataset.id) : state.goals.delete(b.dataset.id);
    b.setAttribute('aria-pressed', String(on));
  });
}

const validName = v => v.trim().length >= 2;
const validPhone = v => /^[0-9+\-\s]{8,15}$/.test(v.trim());

function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return `${m} 月 ${d} 日（週${WEEK[new Date(y, m - 1, d).getDay()]}）`;
}
function setSummary(el, text) {
  el.textContent = text || '尚未選擇';
  el.classList.toggle('empty', !text);
  el.classList.toggle('ok', !!text);
}

function renderSummary() {
  setSummary(dom.sCoach, state.coach && coachById(state.coach).name);
  setSummary(dom.sDate, fmtDate(state.date));
  setSummary(dom.sTime, state.time);
  dom.sName.textContent = dom.name.value.trim() || '—';

  const missing = [];
  if (!state.coach) missing.push('教練');
  if (!state.date) missing.push('日期');
  if (!state.time) missing.push('時段');
  if (!validName(dom.name.value)) missing.push('姓名');
  if (!validPhone(dom.phone.value)) missing.push('手機');
  dom.submit.disabled = missing.length > 0;
  dom.submitHint.textContent = missing.length ? `尚需完成：${missing.join('、')}` : '資料齊全，可以送出囉。';
}

dom.name.addEventListener('input', () => { dom.name.classList.remove('bad'); dom.eName.textContent = ''; renderSummary(); });
dom.phone.addEventListener('input', () => { dom.phone.classList.remove('bad'); dom.ePhone.textContent = ''; renderSummary(); });
dom.name.addEventListener('blur', () => {
  if (dom.name.value && !validName(dom.name.value)) { dom.name.classList.add('bad'); dom.eName.textContent = '請輸入至少 2 個字'; }
});
dom.phone.addEventListener('blur', () => {
  if (dom.phone.value && !validPhone(dom.phone.value)) { dom.phone.classList.add('bad'); dom.ePhone.textContent = '請輸入正確的手機號碼'; }
});

// 從連結帶入預設值：#/consult?coach=ber&goal=massage
function applyConsultParams(params) {
  const coachId = params.get('coach');
  if (coachById(coachId)) {
    const btn = $(`.pick[data-id="${coachId}"]`);
    state.coach = coachId; state.time = null;
    setChecked(dom.coachPick, btn);
  }
  const goal = params.get('goal');
  const gBtn = goal && $(`.goal[data-id="${goal}"]`);
  if (gBtn && !state.goals.has(goal)) { state.goals.add(goal); gBtn.setAttribute('aria-pressed', 'true'); }
  renderSlots(); renderSummary();
}

/* ---------- 送出 ---------- */
const doneModal = $('#done');
let lastReceipt = '';

form.addEventListener('submit', e => {
  e.preventDefault();
  renderSummary();
  if (dom.submit.disabled) return;

  const booking = {
    coach: state.coach, date: state.date, time: state.time,
    name: dom.name.value.trim(), phone: dom.phone.value.trim(),
    goals: [...state.goals], note: dom.note.value.trim(), createdAt: new Date().toISOString(),
  };
  saveBooking(booking);

  const goalText = booking.goals.map(id => GOALS.find(g => g.id === id).label).join('、') || '—';
  lastReceipt = [
    `教練：${coachById(booking.coach).name}`,
    `日期：${fmtDate(booking.date)}`,
    `時段：${booking.time}`,
    `姓名：${booking.name}`,
    `手機：${booking.phone}`,
    `方向：${goalText}`,
    booking.note ? `備註：${booking.note}` : null,
  ].filter(Boolean).join('\n');
  $('#receipt').textContent = lastReceipt;

  doneModal.hidden = false;
  document.body.classList.add('locked');
  $('#doneHome').focus();
});

function closeModal() { doneModal.hidden = true; document.body.classList.remove('locked'); }
function resetForm() {
  state.coach = state.date = state.time = null; state.goals.clear();
  form.reset();
  radioButtons(dom.coachPick).concat(radioButtons(dom.dates)).forEach(b => b.setAttribute('aria-checked', 'false'));
  $$('.goal').forEach(b => b.setAttribute('aria-pressed', 'false'));
  renderSlots(); renderSummary();
}

$('#doneClose').addEventListener('click', () => { closeModal(); resetForm(); });
$('#doneHome').addEventListener('click', () => { closeModal(); resetForm(); location.hash = '#/'; });
doneModal.addEventListener('click', e => { if (e.target === doneModal) { closeModal(); resetForm(); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && !doneModal.hidden) { closeModal(); resetForm(); } });
$('#copyBtn').addEventListener('click', async e => {
  const btn = e.currentTarget;
  try {
    await navigator.clipboard.writeText(`【肌極工作室】預約資訊\n${lastReceipt}`);
    btn.textContent = '已複製 ✓';
  } catch {
    btn.textContent = '請手動複製上方內容';
  }
  setTimeout(() => { btn.textContent = '複製預約資訊'; }, 2000);
});

/* ============================================================
   啟動
   ============================================================ */
renderCoachCards();
renderFooter();
buildCoachPick();
buildDates();
buildGoals();
renderSlots();
renderSummary();
navigate(true);
