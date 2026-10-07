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
  { n: 'Яндекс Карты', t: 'Карточка и промо', logo: 'yandex-maps.png' },
  { n: 'Сквозная аналитика', t: 'Отчёт по каналам', c: '#8a7fe0', s: '∑' },
];

/**
 * Каналы и цены одним списком — на странице это один блок.
 * gift — значок «сайт в подарок», once — разовая работа,
 * p: null — цена считается под задачу.
 */
const CHANNELS = [
  { n: 'Яндекс Директ', logo: 'yandex.png', gift: true, p: 35000,
    d: 'Поиск, РСЯ и ретаргетинг. Семантика под ваши услуги, минус-слова, корректировки ставок по звонкам и сделкам.' },
  { n: 'Авито', logo: 'avito.png', p: 35000,
    d: 'Карточки, объявления, автозагрузка и продвижение. Отдельная воронка под площадку, где решают быстро.' },
  { n: 'Авито Ads', logo: 'avito.png', gift: true, p: 35000,
    d: 'Медийные размещения на аудиторию площадки: догоняем тех, кто уже смотрел похожие предложения.' },
  { n: 'ВКонтакте', logo: 'vk.png', gift: true, p: 35000,
    d: 'Таргет по интересам и look-alike, лид-формы, сообщество и прогрев тех, кто пока не готов.' },
  { n: 'Telegram Ads', logo: 'telegram.png', gift: true, p: 35000,
    d: 'Реклама в профильных каналах и ретаргет на подписчиков. Хорошо работает на длинный чек.' },
  { n: 'SEO-продвижение', c: '#1e1a36', s: 'SEO', p: 50000,
    d: 'Структура сайта под запросы, тексты, скорость и ссылки. Первые позиции через 3–4 месяца, зато без оплаты за клик.' },
  { n: '2ГИС и Яндекс Карты', logo: 'yandex-maps.png', p: 35000,
    d: 'Карточка организации, отзывы, приоритетное размещение. Дешёвые заявки от тех, кто ищет рядом.' },
  { n: 'DMP One', c: '#6356c8', s: 'DMP', p: 42000,
    d: 'Сегменты по поведению и look-alike на базе ваших клиентов — там, где обычный таргет уже выдохся.' },
  { n: 'Настройка CRM', logo: 'amocrm.png', p: 20000, once: true,
    d: 'Воронка, поля, автоматизации, интеграции с каналами. Заявки падают в CRM с источником и записью разговора.' },
  { n: 'Сквозная аналитика', c: '#1e1a36', s: '∑', p: null,
    d: 'Один отчёт: сколько заявок, по какой цене и что из этого стало деньгами. Считаем под вашу связку каналов и CRM.' },
];

/**
 * Ориентиры по нишам для расчёта бюджета: цена заявки и доля заявок,
 * которые доходят до сделки. Это средние по рынку цифры — на разборе
 * считаем по вашим. Правятся здесь.
 */
const NICHES = [
  { n: 'Ремонт и отделка',      cpl: 1100, cr: 12, ch: 'Яндекс Директ, Авито, 2ГИС' },
  { n: 'Мебель на заказ',       cpl: 900,  cr: 15, ch: 'Авито, Яндекс Директ, ВКонтакте' },
  { n: 'Окна, двери, потолки',  cpl: 750,  cr: 18, ch: 'Авито, Яндекс Директ, 2ГИС' },
  { n: 'Строительство домов',   cpl: 2200, cr: 8,  ch: 'Яндекс Директ, ВКонтакте, Telegram Ads' },
  { n: 'Медицина и клиники',    cpl: 800,  cr: 20, ch: 'Яндекс Директ, 2ГИС и Карты' },
  { n: 'Услуги для бизнеса',    cpl: 1800, cr: 10, ch: 'Яндекс Директ, Telegram Ads, DMP One' },
  { n: 'Оборудование и B2B',    cpl: 3000, cr: 7,  ch: 'Яндекс Директ, Telegram Ads' },
  { n: 'Автоуслуги и сервис',   cpl: 500,  cr: 22, ch: 'Авито, 2ГИС, Яндекс Директ' },
  { n: 'Обучение и курсы',      cpl: 600,  cr: 12, ch: 'ВКонтакте, Telegram Ads, Яндекс Директ' },
  { n: 'Недвижимость',          cpl: 2500, cr: 6,  ch: 'Яндекс Директ, ВКонтакте, Telegram Ads' },
];

/** Что делаем в сайтах — страница «Создание сайтов». */
const WEB_WORKS = [
  { n: 'Посадочная под рекламу', d: 'Одна страница под один канал и одно предложение. Пишется под те запросы, по которым вы покупаете клики, — иначе реклама греет чужую воронку.' },
  { n: 'Лендинг', d: 'Полноценная продающая страница: оффер, доказательства, расчёт, формы. Для услуг с длинным решением — с калькулятором и подбором.' },
  { n: 'Многостраничный сайт', d: 'Услуги, кейсы, цены, о компании, блог. Структура собирается под поисковые запросы, чтобы страницы работали и без рекламы.' },
  { n: 'Интернет-магазин', d: 'Каталог, фильтры, корзина, оплата и доставка. Выгрузка товаров из 1С или таблицы, заказы падают в CRM.' },
  { n: 'Переделка сайта', d: 'Сайт есть, но заявок нет. Разбираем по аналитике, где теряются люди, и переделываем то, что мешает, — без переписывания всего.' },
  { n: 'Поддержка', d: 'Правки, новые страницы, обновления, мониторинг скорости и доступности. Чтобы сайт не умирал через полгода после сдачи.' },
];

/** Цены на сайты. Правятся здесь. */
const WEB_PRICES = [
  { n: 'Посадочная под рекламный канал', d: 'одна страница, запуск за 7–10 дней', p: 'от 60 000 ₽' },
  { n: 'Лендинг', d: 'прототип, дизайн, вёрстка, подключение к CRM', p: 'от 90 000 ₽' },
  { n: 'Многостраничный сайт', d: 'до 10 страниц, структура под поиск', p: 'от 180 000 ₽' },
  { n: 'Интернет-магазин', d: 'каталог, оплата, доставка, выгрузка товаров', p: 'от 320 000 ₽' },
  { n: 'Переделка существующего сайта', d: 'по данным аналитики, без полного переписывания', p: 'от 70 000 ₽' },
  { n: 'Поддержка и правки', d: 'часы на правки, мониторинг, обновления', p: 'от 20 000 ₽/мес' },
];

/**
 * Примеры сделанных сайтов. Добавляйте сюда — раздел появится сам:
 *   { n: 'Название', d: 'Ниша, что сделали', url: 'https://…', img: 'works/имя.png' }
 * Картинку кладите в site/assets/works/. Без img покажем аккуратную заглушку.
 */
const WORKS = [];

/** Этапы работы над сайтом. */
const WEB_STEPS = [
  { t: 'Разбираемся', d: 'Кто покупает, за что платит, что спрашивает перед покупкой. Смотрим конкурентов и то, что уже есть у вас в аналитике.' },
  { t: 'Прототип', d: 'Схема страниц без картинок: что за чем идёт и почему. Согласуем смысл до того, как рисовать, — так правки дешевле.' },
  { t: 'Дизайн', d: 'Макеты для компьютера и телефона. Не «красиво вообще», а под ваш продукт и вашу цену.' },
  { t: 'Сборка', d: 'Вёрстка, скорость, формы в CRM, аналитика и цели. Проверяем на реальных телефонах, а не только в браузере.' },
  { t: 'Запуск', d: 'Домен, хостинг, сертификат, поисковые системы. Передаём доступы — всё оформлено на вас.' },
  { t: 'После запуска', d: 'Смотрим, как ведут себя люди, и правим то, что мешает. Сайт — не памятник, а инструмент.' },
];

/** Что делаем в дизайне — страница «Дизайн». */
const DESIGN_WORKS = [
  { n: 'Логотип и знак', d: 'Несколько направлений на выбор, отрисовка в вектор, версии для вывески, сайта и аватарки. Передаём исходники.' },
  { n: 'Фирменный стиль', d: 'Цвета, шрифты, графика, правила применения. Чтобы реклама, сайт и документы выглядели как одна компания.' },
  { n: 'Брендбук', d: 'Документ, по которому любой подрядчик соберёт макет в вашем стиле и не придёт за согласованием каждой мелочи.' },
  { n: 'Дизайн сайта', d: 'Макеты страниц под ваш продукт: компьютер и телефон, все состояния форм и кнопок. Можно отдать своим разработчикам.' },
  { n: 'Креативы для рекламы', d: 'Баннеры и видеообложки под Яндекс, ВКонтакте, Telegram и Авито. Пакетами, чтобы было что тестировать.' },
  { n: 'Презентации и КП', d: 'Коммерческое предложение, которое не стыдно отправить. Структура, цифры, верстка — читается за пять минут.' },
  { n: 'Упаковка соцсетей', d: 'Обложки, аватарки, шаблоны постов и историй. Чтобы вести самим и не рассыпаться.' },
  { n: 'Полиграфия и вывески', d: 'Визитки, буклеты, ценники, наружная реклама. Готовим в печать с нужными вылетами и цветами.' },
];

/** Цены на дизайн. Правятся здесь. */
const DESIGN_PRICES = [
  { n: 'Логотип', d: '3 направления, вектор, все версии, исходники', p: 'от 45 000 ₽' },
  { n: 'Фирменный стиль', d: 'логотип, цвета, шрифты, носители', p: 'от 120 000 ₽' },
  { n: 'Брендбук', d: 'правила применения и шаблоны', p: 'от 180 000 ₽' },
  { n: 'Дизайн сайта', d: 'макеты страниц: компьютер и телефон', p: 'от 90 000 ₽' },
  { n: 'Пакет рекламных креативов', d: '20 макетов под каналы, с адаптациями', p: 'от 35 000 ₽' },
  { n: 'Презентация или КП', d: 'структура, текст, вёрстка, до 15 полос', p: 'от 50 000 ₽' },
  { n: 'Упаковка соцсетей', d: 'обложки, аватарки, шаблоны постов', p: 'от 40 000 ₽' },
  { n: 'Полиграфия', d: 'визитки, буклеты, ценники — за макет', p: 'от 15 000 ₽' },
];

/** Тарифы платформы: предел партнёров, цена в месяц, для кого. */
const PRM_PLANS = [
  { limit: 5,   price: 3900,  who: 'Первая партнёрская программа' },
  { limit: 15,  price: 6900,  who: 'Рабочая программа и связка с CRM' },
  { limit: 30,  price: 9900,  who: 'Свои условия по каждой услуге', hot: true },
  { limit: 60,  price: 14900, who: 'Сеть приводит клиентов регулярно' },
  { limit: 120, price: 21900, who: 'Крупная сеть и выгрузки' },
  { limit: 300, price: 34900, who: 'Дилерская или агентская сеть' },
];
const PRM_SETUP = 10000;      // подключение, разово
const PRM_YEAR_OFF = 20;      // скидка за год, %

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
    { href: 'web.html', t: 'Создание сайтов', k: 'web' },
    { href: 'design.html', t: 'Дизайн', k: 'design' },
    { href: 'sales.html', t: 'Отдел продаж', k: 'sales' },
    { href: 'platform.html', t: 'Учёт партнёрки', k: 'platform' },
  ];
  // На внутренних страницах форма уже в первом экране — зовём к ней, а не на другую страницу.
  const cta = PAGE === 'platform' ? `<a class="btn btn--sm" href="#trial">Попробовать бесплатно</a>`
    : PAGE === 'home' ? `<a class="btn btn--sm" href="#start">Обсудить задачу</a>`
    : `<a class="btn btn--sm" href="#start">Оставить заявку</a>`;
  return `<div class="wrap head__in">
    <a class="brand" href="index.html"><img src="assets/logo-mark.png" alt="" /> Один поток</a>
    <nav class="nav" id="nav">
      ${links.map((l) => `<a href="${l.href}" class="${l.k === PAGE ? 'is-active' : ''}">${l.t}</a>`).join('')}
      <div class="nav__cta">
        <a class="btn btn--ghost btn--sm" href="${CONTACTS.cabinet}" target="_blank" rel="noopener">Войти в кабинет</a>
        ${cta}
      </div>
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
        <b>Услуги</b>
        <a href="agency.html">Привлечение заявок</a>
        <a href="web.html">Создание сайтов</a>
        <a href="design.html">Дизайн</a>
        <a href="sales.html">Отдел продаж</a>
      </div>
      <div class="foot__col">
        <b>Цены</b>
        <a href="agency.html#prices">Реклама</a>
        <a href="web.html#prices">Сайты</a>
        <a href="design.html#prices">Дизайн</a>
        <a href="sales.html#prices">Отдел продаж</a>
      </div>
      <div class="foot__col">
        <b>Учёт партнёрки</b>
        <a href="platform.html">Возможности</a>
        <a href="platform.html#prices">Тарифы</a>
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

/**
 * Форма прямо в первом экране — её не надо искать и никуда нажимать.
 * Разметка одна на все страницы: в html стоит <div data-hero-form="тема">,
 * а подписи задаются атрибутами, чтобы тексты правились рядом со страницей.
 */
function heroForm(box) {
  const topic = box.dataset.heroForm || 'Заявка с сайта';
  const title = box.dataset.title || 'Обсудим задачу?';
  const sub = box.dataset.sub || 'Ответим в течение рабочего дня и скажем, с чего начинать.';
  const pick = (box.dataset.pick || '').split('|').filter(Boolean);
  const i = box.dataset.i || Math.random().toString(36).slice(2, 7);
  return `<form class="hform rise" data-lead="${esc(topic)}" novalidate>
    <h2 class="hform__t">${esc(title)}</h2>
    <p class="hform__s">${esc(sub)}</p>
    <div class="form mt-m">
      <div class="f"><label for="hn${i}">Как к вам обращаться</label>
        <input id="hn${i}" name="name" placeholder="Имя" autocomplete="name" required /></div>
      <div class="f"><label for="hc${i}">Телефон или мессенджер</label>
        <input id="hc${i}" name="contact" placeholder="+7 900 000-00-00 или @telegram" required /></div>
      ${pick.length ? `<div class="f"><label for="ht${i}">Что нужно</label>
        <select id="ht${i}" name="topic">${pick.map((o) => `<option>${esc(o)}</option>`).join('')}</select></div>` : ''}
      <button class="btn btn--wide" type="submit">Оставить заявку</button>
      <div class="form__ok">Готово — открылся мессенджер с вашей заявкой. Если он не открылся, напишите нам: контакты в подвале.</div>
      <p class="form__note">Нажимая кнопку, вы соглашаетесь на обработку контактных данных для ответа на заявку.</p>
    </div>
  </form>`;
}

function buildHeroForms() {
  document.querySelectorAll('[data-hero-form]').forEach((box) => { box.outerHTML = heroForm(box); });
}

/** Витрина сделанных сайтов. Пусто — честно говорим об этом, а не прячем раздел. */
function buildWorks() {
  const box = document.getElementById('works-grid');
  if (!box) return;
  if (!WORKS.length) {
    box.innerHTML = `<div class="works__soon">
      <b>Витрину собираем</b>
      <p>Работы есть, но показывать их россыпью ссылок неправильно — готовим нормальные карточки.
        Напишите, и пришлём примеры по вашей нише прямо сейчас.</p>
      <a class="btn" href="#start">Попросить примеры</a>
    </div>`;
    return;
  }
  box.innerHTML = WORKS.map((w) => {
    const pic = w.img
      ? `<img src="assets/${w.img}" alt="${esc(w.n)}" loading="lazy" />`
      : `<span class="work__noimg">${esc(w.n.slice(0, 1))}</span>`;
    const inner = `<span class="work__pic">${pic}</span>
      <b class="work__n">${esc(w.n)}</b>
      <span class="work__d">${esc(w.d || '')}</span>`;
    return w.url
      ? `<a class="work rise" href="${esc(w.url)}" target="_blank" rel="noopener">${inner}<span class="work__go">Открыть сайт</span></a>`
      : `<div class="work rise">${inner}</div>`;
  }).join('');
}

function platformCard(p) {
  const ic = p.logo
    ? `<span class="plat__ic plat__ic--img"><img src="assets/logos/${p.logo}" alt="" loading="lazy" /></span>`
    : `<span class="plat__ic" style="background:${p.c}">${esc(p.s)}</span>`;
  return `<div class="plat" title="${esc(p.t)}">${ic}<span class="plat__n">${esc(p.n)}</span></div>`;
}

function buildMarquee() {
  const rows = document.querySelectorAll('.marquee__row');
  if (!rows.length) return;
  rows.forEach((el, i) => {
    // Второй ряд оставляем пустым: одна аккуратная строка читается лучше двух.
    el.innerHTML = i ? '' : [...PLATFORMS, ...PLATFORMS, ...PLATFORMS].map(platformCard).join('');
  });
}

function buildList(sel, items, tpl) {
  const box = $(sel);
  if (box) box.innerHTML = items.map(tpl).join('');
}

/* Тарифы платформы: карточки и переключатель периода оплаты. */
let prmYear = false;
function buildPlans() {
  const box = $('#plans');
  if (!box) return;
  const money = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  box.innerHTML = PRM_PLANS.map((p) => {
    const year = Math.round(p.price * (100 - PRM_YEAR_OFF) / 100);
    const month = prmYear ? year : p.price;
    const save = (p.price - year) * 12;
    return `<article class="plan${p.hot ? ' plan--hot' : ''}">
      ${p.hot ? '<span class="plan__flag">Выбирают чаще всего</span>' : ''}
      <span class="plan__limit">до ${p.limit} партнёров</span>
      <div class="plan__price">${money(month)}<span>/мес</span></div>
      <div class="plan__per">${prmYear ? `вместо ${money(p.price)} при оплате по месяцам` : `${money(Math.round(month / p.limit))} за партнёра`}</div>
      <p class="plan__who">${esc(p.who)}</p>
      <div class="plan__save">${prmYear ? `Экономия ${money(save)} за год` : `${money(year)}/мес при оплате за год`}</div>
    </article>`;
  }).join('');
  document.querySelectorAll('[data-period]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.period === 'year') === prmYear)));
}
function setPeriod(year) { prmYear = year; buildPlans(); }

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

buildHeroForms();
const hdr = $('#head'); if (hdr) hdr.innerHTML = header();
const ftr = $('#foot'); if (ftr) ftr.innerHTML = footer();
buildMarquee();
const logoChip = (x, big) => x.logo
  ? `<span class="chip${big ? ' chip--lg' : ''} chip--img"><img src="assets/logos/${x.logo}" alt="" loading="lazy" /></span>`
  : `<span class="chip${big ? ' chip--lg' : ''}" style="background:${x.c}">${esc(x.s)}</span>`;
const giftMark = `<span class="gmark" title="Сайт в подарок при работе от трёх месяцев">
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 13h18M12 9v12" />
    <path d="M12 9S10.5 4 8 4a2.5 2.5 0 0 0 0 5h4zM12 9s1.5-5 4-5a2.5 2.5 0 0 1 0 5h-4z" /></svg>Сайт в подарок</span>`;
const money = (n) => n.toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
buildList('#channels', CHANNELS, (c) => `<div class="chan rise">
  <div class="chan__head">${logoChip(c)}<b class="chan__n">${esc(c.n)}</b></div>
  ${c.gift ? giftMark : ''}
  <p class="chan__d">${esc(c.d)}</p>
  <div class="chan__p">${c.p ? `${money(c.p)}<i>${c.once ? 'один раз' : 'в месяц'}</i>` : 'считаем<i>под задачу</i>'}</div>
</div>`);
applyContacts();
watchRise();
watchHead();
watchForms();
