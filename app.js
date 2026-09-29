/*
 * Сайт «Один поток». Три страницы: витрина, агентство, платформа.
 * Шапка, подвал и повторяющиеся блоки собираются здесь, чтобы тексты
 * правились в одном месте, а не в трёх файлах.
 */

/* ------------------------------------------------------------------ */
/* Что обычно правят                                                    */
/* ------------------------------------------------------------------ */

const CONTACTS = {
  telegram: 'onepotok',                 // без @; станет ссылкой t.me/onepotok
  phone: '+7 999 000-00-00',
  email: 'hello@odin-potok.ru',
  cabinet: 'http://localhost:3000',     // адрес кабинета: вход и пробный период
  trialDays: 14,
};

/** Карточки площадок в бегущей строке. logo — файл в assets/logos, иначе рисуем букву. */
const PLATFORMS = [
  { n: 'Яндекс Директ', t: 'Поиск и РСЯ', logo: 'yandex.png' },
  { n: 'Авито', t: 'Объявления и продвижение', logo: 'avito.png' },
  { n: 'ВКонтакте', t: 'Таргет и сообщества', logo: 'vk.png' },
  { n: 'Telegram Ads', t: 'Реклама в каналах', logo: 'telegram.png' },
  { n: '2ГИС', t: 'Карточка организации', logo: '2gis.png' },
  { n: 'amoCRM', t: 'Сделки и воронка', logo: 'amocrm.png' },
  { n: 'Битрикс24', t: 'Сделки и воронка', logo: 'bitrix24.png' },
  { n: 'Авито Ads', t: 'Медийная реклама', c: '#0b7fd4', s: 'Ad' },
  { n: 'DMP One', t: 'Сегменты и look-alike', c: '#6356c8', s: 'DMP' },
  { n: 'ИИ-менеджер', t: 'Ответы на заявки 24/7', c: '#1e1a36', s: 'AI' },
  { n: 'Яндекс Карты', t: 'Карточка и промо', c: '#ffcc00', s: 'К' },
  { n: 'Сквозная аналитика', t: 'Отчёт по каналам', c: '#8a7fe0', s: '∑' },
];

/** Что делаем в каждом канале — страница агентства. */
const CHANNELS = [
  { n: 'Яндекс Директ', d: 'Поиск, РСЯ и ретаргетинг. Семантика под ваши услуги, минус-слова, корректировки по звонкам и сделкам.' },
  { n: 'Авито', d: 'Карточки, объявления, автозагрузка и продвижение. Отдельная воронка под площадку, где решают быстро.' },
  { n: 'Авито Ads', d: 'Медийные размещения на аудиторию площадки: догоняем тех, кто уже смотрел похожие предложения.' },
  { n: 'ВКонтакте', d: 'Таргет по интересам и look-alike, лид-формы, сообщество и прогрев тех, кто пока не готов.' },
  { n: 'Telegram Ads', d: 'Реклама в профильных каналах и ретаргет на подписчиков. Хорошо работает на длинный чек.' },
  { n: 'DMP One', d: 'Сегменты по поведению и look-alike на базе ваших клиентов — там, где обычный таргет уже выдохся.' },
  { n: 'ИИ-менеджер', d: 'Отвечает на заявки за минуту в любое время, квалифицирует и передаёт менеджеру готовый диалог.' },
  { n: 'Настройка CRM', d: 'Воронка, поля, автоматизации, интеграции с каналами. Заявки падают в CRM с источником и записью разговора.' },
  { n: 'Сквозная аналитика', d: 'Один отчёт: сколько заявок, по какой цене и что из этого стало деньгами. Без сведения таблиц вручную.' },
];

/** Прайс агентства. */
const PRICES = [
  { n: 'Яндекс Директ', d: 'ведение, аналитика, еженедельные правки', p: '35 000 ₽/мес' },
  { n: 'Авито', d: 'карточки, объявления, продвижение', p: '40 000 ₽/мес' },
  { n: 'Авито Ads', d: 'медийные размещения', p: '35 000 ₽/мес' },
  { n: 'ВКонтакте', d: 'таргет, лид-формы, сообщество', p: '35 000 ₽/мес' },
  { n: 'DMP One', d: 'сегменты и look-alike', p: '42 000 ₽/мес' },
  { n: 'ИИ-менеджер', d: 'ответы на заявки и квалификация', p: '35 000 ₽/мес' },
  { n: 'Органический трафик', d: 'карты, отзывы, рассылки, боты', p: '35 000 ₽/мес' },
  { n: 'Настройка CRM', d: 'воронка, поля, интеграции — один раз', p: '20 000 ₽' },
];

/** Цены по отделу продаж. */
const SALES_PRICES = [
  { n: 'Мини-аудит отдела продаж', d: 'вводный разбор с рекомендациями и файлом-отчётом', p: 'бесплатно' },
  { n: 'Полный аудит', d: 'записи разговоров, скрипты, система рекомендаций', p: 'от 40 000 ₽' },
  { n: 'Скрипт продаж', d: 'разработка и корректировка под вашу нишу', p: 'от 25 000 ₽' },
  { n: 'Регламенты и отчётность', d: 'лист качества, формы отчётов, инструкции', p: 'от 20 000 ₽' },
  { n: 'Подбор менеджера под ключ', d: 'вакансия, воронка, собеседования, гарантия', p: 'от 50 000 ₽' },
  { n: 'Аренда руководителя отдела продаж', d: 'ведение отдела по договору и KPI', p: 'от 120 000 ₽/мес' },
  { n: 'Выездной тренинг для команды', d: '2 дня, 16 часов', p: 'от 300 000 ₽' },
  { n: 'Консультация', d: '1,5 часа, пакет документов под запрос, запись встречи', p: 'от 40 000 ₽' },
];

/* ------------------------------------------------------------------ */
/* Сборка                                                              */
/* ------------------------------------------------------------------ */

const $ = (s, root = document) => root.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const PAGE = document.body.dataset.page || 'home';
const TG = `https://t.me/${CONTACTS.telegram.replace(/^@/, '')}`;

function header() {
  const links = [
    { href: 'index.html', t: 'Главная', k: 'home' },
    { href: 'agency.html', t: 'Привлечение заявок', k: 'agency' },
    { href: 'sales.html', t: 'Отдел продаж', k: 'sales' },
    { href: 'platform.html', t: 'Учёт партнёрки', k: 'platform' },
  ];
  const cta = PAGE === 'platform' ? `<a class="btn btn--sm" href="#trial">Попробовать бесплатно</a>`
    : PAGE === 'sales' ? `<a class="btn btn--sm" href="#audit">Бесплатный аудит</a>`
    : `<a class="btn btn--sm" href="${PAGE === 'agency' ? '#start' : 'agency.html#start'}">Разбор за 30 минут</a>`;
  return `<div class="wrap head__in">
    <a class="brand" href="index.html"><img src="assets/logo-mark.png" alt="" /> Один поток</a>
    <nav class="nav" id="nav">
      ${links.map((l) => `<a href="${l.href}" class="${l.k === PAGE ? 'is-active' : ''}">${l.t}</a>`).join('')}
    </nav>
    <div class="head__cta">
      <a class="btn btn--ghost btn--sm" href="${CONTACTS.cabinet}" target="_blank" rel="noopener">Войти</a>
      ${cta}
      <button class="burger" id="burger" aria-label="Меню">☰</button>
    </div>
  </div>`;
}

function footer() {
  return `<div class="wrap">
    <div class="foot__grid">
      <div class="foot__col">
        <div class="brand" style="color:#fff"><img src="assets/logo-mark-white.png" alt="" /> Один поток</div>
        <p style="color:rgba(255,255,255,.65);font-size:15px;max-width:34ch">Привлекаем заявки и считаем партнёрскую сеть. Кабинеты, данные и клиенты — ваши.</p>
      </div>
      <div class="foot__col">
        <b>Привлечение заявок</b>
        <a href="agency.html">Что входит</a>
        <a href="agency.html#how">Как работаем</a>
        <a href="agency.html#prices">Цены</a>
      </div>
      <div class="foot__col">
        <b>Отдел продаж</b>
        <a href="sales.html#what">Что делаем</a>
        <a href="sales.html#prices">Цены</a>
        <a href="sales.html#audit">Бесплатный аудит</a>
      </div>
      <div class="foot__col">
        <b>Учёт партнёрки</b>
        <a href="platform.html">Возможности</a>
        <a href="platform.html#trial">Пробный период</a>
        <a href="${CONTACTS.cabinet}" target="_blank" rel="noopener">Войти в кабинет</a>
      </div>
      <div class="foot__col">
        <b>Связь</b>
        <a href="${TG}" target="_blank" rel="noopener">@${CONTACTS.telegram.replace(/^@/, '')}</a>
        <a href="tel:${CONTACTS.phone.replace(/[^\d+]/g, '')}">${CONTACTS.phone}</a>
        <a href="mailto:${CONTACTS.email}">${CONTACTS.email}</a>
      </div>
    </div>
    <div class="foot__bottom">
      <span>© ${new Date().getFullYear()} Один поток</span>
      <span>Продажи на вас, заявки на нас</span>
    </div>
  </div>`;
}

function platformCard(p) {
  const ic = p.logo
    ? `<div class="plat__ic plat__ic--img"><img src="assets/logos/${p.logo}" alt="${esc(p.n)}" loading="lazy" /></div>`
    : `<div class="plat__ic" style="background:${p.c}">${esc(p.s)}</div>`;
  return `<div class="plat">${ic}<div class="plat__n">${esc(p.n)}</div><div class="plat__t">${esc(p.t)}</div></div>`;
}

function buildMarquee() {
  const rows = document.querySelectorAll('.marquee__row');
  if (!rows.length) return;
  const half = Math.ceil(PLATFORMS.length / 2);
  const parts = [PLATFORMS.slice(0, half), PLATFORMS.slice(half)];
  rows.forEach((el, i) => {
    const list = parts[i] ?? parts[0];
    el.innerHTML = [...list, ...list, ...list].map(platformCard).join('');
  });
}

function buildList(sel, items, tpl) {
  const box = $(sel);
  if (box) box.innerHTML = items.map(tpl).join('');
}

/* Появление блоков при прокрутке. */
function watchRise() {
  const io = new IntersectionObserver((rows) => {
    for (const r of rows) if (r.isIntersecting) { r.target.classList.add('is-in'); io.unobserve(r.target); }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.rise').forEach((el) => io.observe(el));
}

function watchHead() {
  const head = $('#head');
  if (!head) return;
  const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const nav = $('#nav'); const b = $('#burger');
  if (nav && b) {
    b.addEventListener('click', () => nav.classList.toggle('is-open'));
    nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') nav.classList.remove('is-open'); });
  }
}

/* Заявка: собираем текст и открываем мессенджер — сервер не нужен. */
function watchForms() {
  document.querySelectorAll('form[data-lead]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = new FormData(form);
      for (const k of ['name', 'contact']) {
        const el = form.elements[k];
        if (!String(d.get(k) || '').trim()) { el.focus(); el.style.borderColor = '#b3123c'; return; }
        el.style.borderColor = '';
      }
      const lines = ['Заявка с сайта «Один поток»', `Тема: ${form.dataset.lead}`, `Имя: ${d.get('name')}`, `Связь: ${d.get('contact')}`];
      if (d.get('biz')) lines.push(`Ниша: ${d.get('biz')}`);
      if (d.get('topic')) lines.push(`Интересует: ${d.get('topic')}`);
      if (d.get('msg')) lines.push(`Задача: ${d.get('msg')}`);
      const text = lines.join('\n');
      window.open(`${TG}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      try { navigator.clipboard?.writeText(text); } catch { /* не критично */ }
      const ok = form.querySelector('.form__ok');
      if (ok) ok.style.display = 'block';
      form.reset();
    });
  });
}

/* Подставляем адрес кабинета и число дней пробного периода в разметку. */
function applyContacts() {
  document.querySelectorAll('[data-cabinet]').forEach((a) => { a.href = CONTACTS.cabinet; a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('[data-tg]').forEach((a) => { a.href = TG; a.target = '_blank'; a.rel = 'noopener'; });
  document.querySelectorAll('[data-trial-days]').forEach((el) => { el.textContent = CONTACTS.trialDays; });
}

const hdr = $('#head'); if (hdr) hdr.innerHTML = header();
const ftr = $('#foot'); if (ftr) ftr.innerHTML = footer();
buildMarquee();
buildList('#channels', CHANNELS, (c) => `<div class="card rise"><h3>${esc(c.n)}</h3><p class="mt-s">${esc(c.d)}</p></div>`);
buildList('#sales-prices', SALES_PRICES, (p) => `<div class="price-row"><span><span class="price-row__n">${esc(p.n)}</span><br /><span class="price-row__d">${esc(p.d)}</span></span><span class="price-row__p">${esc(p.p)}</span></div>`);
buildList('#prices-list', PRICES, (p) => `<div class="price-row"><span><span class="price-row__n">${esc(p.n)}</span><br /><span class="price-row__d">${esc(p.d)}</span></span><span class="price-row__p">${esc(p.p)}</span></div>`);
applyContacts();
watchRise();
watchHead();
watchForms();
