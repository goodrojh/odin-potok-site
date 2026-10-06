/*
 * Интерактивные блоки — по одному на раздел.
 *
 * Идея простая: услугу можно описать словами, а можно дать потрогать.
 * Человек, который сам провалил пятисекундный тест или не угадал, какой
 * баннер лучше, запоминает это сильнее любого текста — и рассказывает.
 *
 * Каждый блок включается, только если на странице есть его контейнер,
 * поэтому файл один на весь сайт.
 */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const el = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rub = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
  const num = (n) => Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ');
  const plural = (n, one, few, many) => {
    const a = Math.abs(Math.round(n)) % 100; const b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b > 1 && b < 5) return few;
    return b === 1 ? one : many;
  };

  /* ================================================================ */
  /* 1. Реклама: калькулятор на ваших числах                          */
  /* ================================================================ */
  /* Ничего не выдумываем и ничего не обещаем: это арифметика по тем
     цифрам, которые человек вписал сам. Поэтому ему можно верить. */
  (function calc() {
    const root = el('calc');
    if (!root) return;
    if (typeof NICHES === 'undefined') return;

    // Спрашиваем только то, что предприниматель знает про себя: нишу, чек
    // и сколько продаж ему нужно. Цену заявки и доходимость до сделки
    // подставляем мы — за этим к агентству и приходят.
    const st = { i: 0, check: 60000, sales: 10 };

    root.innerHTML = `
      <div class="calc__in">
        <label class="calc__f">
          <span>Чем занимаетесь</span>
          <select id="cfNiche" class="calc__sel">${NICHES.map((x, i) => `<option value="${i}">${esc(x.n)}</option>`).join('')}</select>
        </label>
        <label class="calc__f">
          <span>Средний чек<b class="calc__v" id="cvCheck"></b></span>
          <input type="range" id="cfCheck" min="5000" max="1500000" step="5000" value="${st.check}" />
        </label>
        <label class="calc__f">
          <span>Сколько продаж нужно в месяц<b class="calc__v" id="cvSales"></b></span>
          <input type="range" id="cfSales" min="1" max="120" step="1" value="${st.sales}" />
        </label>
        <div class="calc__ours" id="calcOurs"></div>
      </div>
      <div class="calc__out">
        <div class="calc__hero" id="calcHero"></div>
        <div class="calc__flow" id="calcFlow"></div>
        <div class="calc__kpis" id="calcKpis"></div>
        <p class="calc__note" id="calcVerdict"></p>
      </div>`;

    function draw() {
      const nz = NICHES[st.i];
      const leads = Math.ceil(st.sales / (nz.cr / 100));
      const budget = Math.round(leads * nz.cpl / 1000) * 1000;   // круглая цифра читается лучше
      const revenue = st.sales * st.check;
      const share = revenue > 0 ? budget / revenue * 100 : 0;
      const cps = st.sales > 0 ? budget / st.sales : 0;

      el('calcOurs').innerHTML = `<b>Это мы подставляем за вас</b>
        <span>Заявка в нише «${esc(nz.n)}» — около <i>${rub(nz.cpl)}</i>, до сделки доходит <i>${nz.cr}%</i> заявок.
        Средние цифры по рынку: на разборе пересчитаем по вашим.</span>`;

      el('calcHero').className = 'calc__hero';
      el('calcHero').innerHTML = `<b>${rub(budget)}</b>
        <span>бюджет на рекламу в месяц, чтобы получать ${num(st.sales)} ${plural(st.sales, 'продажу', 'продажи', 'продаж')}</span>`;

      const rows = [
        { t: 'Заявок', v: num(leads), w: 100 },
        { t: 'Продаж', v: num(st.sales), w: Math.max(4, nz.cr) },
      ];
      el('calcFlow').innerHTML = rows.map((r) => `<div class="calc__bar">
        <span class="calc__bt">${r.t}</span>
        <span class="calc__btrack"><span class="calc__bfill" style="width:${Math.min(100, r.w)}%"></span></span>
        <b>${r.v}</b></div>`).join('');

      el('calcKpis').innerHTML = [
        ['Заявок в месяц', num(leads)],
        ['Цена продажи', rub(cps)],
        ['Выручка', rub(revenue)],
        ['Доля рекламы', share.toFixed(1) + '%'],
      ].map(([t, v], i) => `<div class="calc__kpi${i === 3 ? (share <= 25 ? ' is-ok' : ' is-bad') : ''}"><b>${v}</b><span>${t}</span></div>`).join('');

      el('calcVerdict').innerHTML = share <= 25
        ? `Реклама заберёт <b>${share.toFixed(1)}%</b> выручки — для этой ниши нормально. Начинать имеет смысл с каналов:
           <b>${esc(nz.ch)}</b>. Плюс наша работа — от 35 000 ₽ в месяц за канал.`
        : `При таком чеке реклама съедает <b>${share.toFixed(1)}%</b> выручки — многовато. Обычно лечится одним из трёх:
           поднять чек, добавить допродажи или сократить потери между заявкой и сделкой. На разборе смотрим, что доступнее именно вам.`;
    }

    const bindRange = (id, key, out, fmt) => {
      const inp = el(id);
      const sync = () => {
        inp.style.setProperty('--p', ((st[key] - inp.min) / (inp.max - inp.min) * 100).toFixed(1) + '%');
        el(out).textContent = fmt(st[key]);
      };
      inp.addEventListener('input', (e) => { st[key] = Number(e.target.value); sync(); draw(); });
      sync();
    };
    el('cfNiche').addEventListener('change', (e) => { st.i = Number(e.target.value); draw(); });
    bindRange('cfCheck', 'check', 'cvCheck', rub);
    bindRange('cfSales', 'sales', 'cvSales', (v) => num(v) + ' шт');
    draw();
  }());

  /* ================================================================ */
  /* 2. Сайты: пятисекундный тест                                     */
  /* ================================================================ */
  /* Самый честный способ объяснить, зачем нужен сайт: дать человеку
     провалить тест на своём же сайте-ровеснике, а потом показать разницу. */
  (function fiveSec() {
    const root = el('test5');
    if (!root) return;

    const PAGES = {
      bad: {
        label: 'Сайт, каких большинство',
        html: `<div class="mock mock--bad">
          <div class="mock__nav"><span class="mock__logo">ПРОФСТРОЙГРУПП</span><span>О компании</span><span>Услуги</span><span>Портфолио</span><span>Контакты</span></div>
          <div class="mock__body">
            <h4>Комплексные решения для вашего бизнеса</h4>
            <p>Наша компания более 10 лет успешно работает на рынке, предлагая широкий спектр услуг высочайшего качества. Индивидуальный подход к каждому клиенту, гибкая система скидок и профессиональная команда специалистов.</p>
            <span class="mock__btn">Подробнее</span>
          </div>
        </div>`,
      },
      good: {
        label: 'Сайт, который отвечает сразу',
        html: `<div class="mock mock--good">
          <div class="mock__nav"><span class="mock__logo">ПРОФСТРОЙ</span><span>Цены</span><span>Работы</span><span>Отзывы</span><span class="mock__ph">+7 843 000-00-00</span></div>
          <div class="mock__body">
            <h4>Фасады под ключ в Казани<br />за 45 дней</h4>
            <p class="mock__price">от 2 400 ₽ за м² · смета за 1 день</p>
            <ul class="mock__ul"><li>Договор с фиксированной ценой</li><li>Гарантия 5 лет</li><li>Работаем с юрлицами и НДС</li></ul>
            <span class="mock__btn mock__btn--go">Рассчитать смету за 2 минуты</span>
          </div>
        </div>`,
      },
    };

    const QUIZ = [
      { q: 'Чем занимается компания?', o: ['Фасадные работы', 'Что-то строительное, точнее не понял', 'Консалтинг'], ok: { bad: 1, good: 0 } },
      { q: 'Сколько это стоит?', o: ['Цены не было', 'От 2 400 ₽ за м²', 'По запросу, после замера'], ok: { bad: 0, good: 1 } },
      { q: 'Что предлагали сделать дальше?', o: ['Рассчитать смету', 'Нажать «Подробнее» и читать ещё', 'Позвонить в офис'], ok: { bad: 1, good: 0 } },
    ];

    let variant = 'bad';
    let answers = [];

    const intro = () => `<div class="t5__intro">
      <p class="t5__lead">Человек решает, остаться на сайте или закрыть, примерно за пять секунд. Проверим на себе: сейчас будет первый экран обычного сайта. Смотрите, потом три вопроса.</p>
      <button class="btn" data-t5="go">Показать на 5 секунд</button>
    </div>`;

    const show = () => {
      root.innerHTML = `<div class="t5__stage">
        <div class="t5__timer"><span id="t5n">5</span></div>
        ${PAGES[variant].html}
      </div>`;
      let n = 5;
      const tick = setInterval(() => {
        n -= 1;
        const box = el('t5n');
        if (box) box.textContent = String(n);
        if (n <= 0) { clearInterval(tick); answers = []; quiz(0); }
      }, 1000);
    };

    const quiz = (i) => {
      if (i >= QUIZ.length) return result();
      const q = QUIZ[i];
      root.innerHTML = `<div class="t5__quiz">
        <span class="t5__step">Вопрос ${i + 1} из ${QUIZ.length}</span>
        <h3>${q.q}</h3>
        <div class="t5__opts">${q.o.map((o, k) => `<button class="t5__opt" data-pick="${k}">${esc(o)}</button>`).join('')}</div>
      </div>`;
      root.querySelectorAll('[data-pick]').forEach((b) => b.addEventListener('click', () => {
        answers.push(Number(b.dataset.pick) === q.ok[variant]);
        quiz(i + 1);
      }));
    };

    // Считаем не «правильные ответы», а то, что человек реально узнал с экрана.
    // На плохом сайте узнать нечего, и ноль здесь — честный ноль, а не двойка.
    const FACTS = {
      bad: ['Чем занимаются — непонятно', 'Цены не было', 'Дальше предлагали «Подробнее»'],
      good: ['Фасады под ключ в Казани', 'от 2 400 ₽ за м²', 'Рассчитать смету за 2 минуты'],
    };

    const result = () => {
      const good = variant === 'good';
      const learned = good ? answers.filter(Boolean).length : 0;
      root.innerHTML = `<div class="t5__res">
        <div class="t5__score ${learned ? 'is-ok' : ''}">${learned} из ${QUIZ.length}</div>
        <span class="t5__step">столько вы успели узнать за пять секунд</span>
        <h3>${good ? 'Вот и вся разница' : 'Так выглядит сайт глазами клиента'}</h3>
        <ul class="t5__facts">${FACTS[variant].map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
        <p class="t5__lead">${good
          ? 'Те же пять секунд, но человек вышел с ответом: что продают, сколько стоит и что делать дальше. Ради этого и переделывают сайты — не ради «современнее смотрится».'
          : 'Вы смотрели внимательно и были настроены разобраться. Клиент, который пришёл с рекламы, — нет. Он не узнал ни что продают, ни сколько это стоит, ни что делать дальше, и ушёл к следующему из выдачи.'}</p>
        <div class="t5__cta">
          ${good
            ? '<a class="btn" href="#start">Хочу так же</a><button class="btn btn--ghost" data-t5="again">Пройти заново</button>'
            : '<button class="btn" data-t5="good">Показать, как надо</button>'}
        </div>
      </div>`;
    };

    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-t5]')?.dataset.t5;
      if (!act) return;
      if (act === 'go') show();
      if (act === 'good') { variant = 'good'; show(); }
      if (act === 'again') { variant = 'bad'; root.innerHTML = intro(); }
    });
    root.innerHTML = intro();
  }());

  /* ================================================================ */
  /* 3. Дизайн: слепой выбор                                          */
  /* ================================================================ */
  /* Смысл блока — не «угадайте», а «вы не угадали». После трёх пар
     становится понятно, почему макет нельзя утверждать на вкус. */
  (function abTest() {
    const root = el('abtest');
    if (!root) return;

    const PAIRS = [
      {
        a: { k: 'красиво', html: `<div class="ad ad--soft"><span class="ad__sm">Студия кухонь</span><b>Создаём<br />пространство<br />вашей мечты</b><span class="ad__btn">Узнать больше</span></div>` },
        b: { k: 'конкретно', html: `<div class="ad ad--hard"><b>Кухня на заказ<br />за 30 дней</b><span class="ad__price">от 180 000 ₽</span><span class="ad__btn ad__btn--go">Посчитать свою</span></div>` },
        win: 'b',
        why: 'Выигрывает конкретика. «Пространство мечты» подходит любой компании, поэтому не цепляет никого. Срок и цена отсекают тех, кому дорого, — и заявки дешевеют, даже если их становится меньше.',
      },
      {
        a: { k: 'весь текст', html: `<div class="ad ad--dense"><b>Бухгалтерское сопровождение ООО и ИП: ведение учёта, отчётность в ФНС, кадры, расчёт зарплаты, консультации юриста</b><span class="ad__btn">Оставить заявку</span></div>` },
        b: { k: 'одна мысль', html: `<div class="ad ad--hard"><b>Бухгалтер,<br />который отвечает<br />за ваши штрафы</b><span class="ad__price">договор с ответственностью</span><span class="ad__btn ad__btn--go">Проверить мою отчётность</span></div>` },
        win: 'b',
        why: 'В ленте баннер видят боковым зрением примерно секунду. Список услуг за это время не читается — успевает дойти одна мысль. Поэтому в креативе одна мысль и один страх клиента, а список услуг живёт на сайте.',
      },
      {
        a: { k: 'скидка', html: `<div class="ad ad--sale"><span class="ad__sm">Только до конца месяца</span><b>Скидка 40%<br />на все окна</b><span class="ad__btn">Успеть</span></div>` },
        b: { k: 'снятие риска', html: `<div class="ad ad--hard"><b>Замер и расчёт<br />бесплатно,<br />даже если не купите</b><span class="ad__price">приедем завтра</span><span class="ad__btn ad__btn--go">Выбрать время</span></div>` },
        win: 'b',
        why: 'Скидка собирает тех, кто ищет дёшево, и приучает ждать следующую акцию. Снятие риска приводит тех, кто готов покупать, но боится ошибиться, — и до сделки доходит заметно больше. Это не про «скидки не работают», а про то, кого вы зовёте.',
      },
    ];

    let i = 0; let score = 0;

    const round = () => {
      const p = PAIRS[i];
      root.innerHTML = `<div class="ab">
        <span class="ab__step">Пара ${i + 1} из ${PAIRS.length}</span>
        <h3>Какой макет обычно приносит заявки дешевле?</h3>
        <div class="ab__pair">
          <button class="ab__card" data-ab="a">${p.a.html}<span class="ab__pick">Выбрать этот</span></button>
          <button class="ab__card" data-ab="b">${p.b.html}<span class="ab__pick">Выбрать этот</span></button>
        </div>
        <p class="ab__note">Счёт: ${score} из ${i}</p>
      </div>`;
      root.querySelectorAll('[data-ab]').forEach((b) => b.addEventListener('click', () => reveal(b.dataset.ab)));
    };

    const reveal = (pick) => {
      const p = PAIRS[i];
      const ok = pick === p.win;
      if (ok) score += 1;
      root.innerHTML = `<div class="ab">
        <span class="ab__step ${ok ? 'is-ok' : 'is-bad'}">${ok ? 'Угадали' : 'Не угадали'}</span>
        <div class="ab__pair ab__pair--res">
          <div class="ab__card ${p.win === 'a' ? 'is-win' : 'is-lose'}">${p.a.html}<span class="ab__tag">${p.win === 'a' ? 'обычно лучше' : p.a.k}</span></div>
          <div class="ab__card ${p.win === 'b' ? 'is-win' : 'is-lose'}">${p.b.html}<span class="ab__tag">${p.win === 'b' ? 'обычно лучше' : p.b.k}</span></div>
        </div>
        <p class="ab__why">${p.why}</p>
        <button class="btn" data-next>${i + 1 < PAIRS.length ? 'Следующая пара' : 'Посмотреть итог'}</button>
      </div>`;
      $('[data-next]', root).addEventListener('click', () => { i += 1; i < PAIRS.length ? round() : total(); });
    };

    const total = () => {
      root.innerHTML = `<div class="ab ab--total">
        <div class="ab__score">${score} из ${PAIRS.length}</div>
        <h3>${score === PAIRS.length ? 'Вы угадали всё — и это редкость' : score === 0 ? 'Ноль из трёх — и это нормально' : 'Вот поэтому дизайн и не утверждают на глаз'}</h3>
        <p class="ab__why">${score === PAIRS.length
          ? 'Значит, вы уже думаете как покупатель трафика. Тогда вам будет просто с нами: мы спорим не о вкусе, а о стоимости заявки.'
          : 'Угадать, какой макет сработает, нельзя — ни вам, ни нам, ни дизайнеру с двадцатью годами опыта. Можно только проверить на живых людях. Поэтому мы отдаём креативы пакетами, запускаем их в рекламу и оставляем те, у которых заявка вышла дешевле.'}</p>
        <div class="ab__cta"><a class="btn" href="#start">Нужны креативы</a><button class="btn btn--ghost" data-reset>Пройти заново</button></div>
      </div>`;
      $('[data-reset]', root).addEventListener('click', () => { i = 0; score = 0; round(); });
    };

    round();
  }());

  /* ================================================================ */
  /* 4. Отдел продаж: разбор звонка                                   */
  /* ================================================================ */
  /* Показываем работу руками: вот запись разговора, найдите, где
     менеджер потерял сделку. Ровно это мы и делаем на аудите. */
  (function callReview() {
    const root = el('call');
    if (!root) return;

    const LINES = [
      { who: 'm', t: 'Алло, да, слушаю.', bad: 'Клиент не понял, куда попал. Нет приветствия, названия компании и имени.', fix: '«Компания такая-то, Сергей, здравствуйте!»' },
      { who: 'c', t: 'Здравствуйте, я с сайта, по кухням хотел узнать.' },
      { who: 'm', t: 'Ну, кухни делаем, да. Что вас интересует?', bad: 'Инициатива сразу отдана клиенту. Он не знает, что спрашивать, и начнёт с цены.', fix: '«Подскажу. Чтобы не гадать: кухня в новую квартиру или меняете старую?»' },
      { who: 'c', t: 'Ну сколько будет стоить примерно?' },
      { who: 'm', t: 'От ста восьмидесяти тысяч. Но это зависит от размеров, фурнитуры, столешницы, много от чего.', bad: 'Назвали цену, не узнав задачу. Дальше разговор будет только про деньги, а ценность не прозвучала.', fix: '«Назову точно после пары вопросов — иначе ошибусь в два раза. Сколько метров и какая планировка?»' },
      { who: 'c', t: 'А замер у вас платный?' },
      { who: 'm', t: 'Нет, замер бесплатный, мастер приедет в удобное для вас время.' },
      { who: 'c', t: 'Понятно. А рассрочка есть?' },
      { who: 'm', t: 'Есть, через банк.', bad: 'Ответ есть — и всё. Разговор рассыпается на справочную службу.', fix: 'Ответить и сразу вернуть инициативу: «Есть, на год без процентов. Давайте посчитаю ваш вариант — какой у вас метраж?»' },
      { who: 'c', t: 'А сроки какие?' },
      { who: 'm', t: 'Обычно месяц от замера до установки.' },
      { who: 'c', t: 'Ладно, я подумаю, спасибо.' },
      { who: 'm', t: 'Хорошо, обращайтесь.', bad: 'Сделку отпустили без следующего шага. Контакт не взят, повод вернуться не создан.', fix: '«Давайте сделаю бесплатный расчёт по вашим размерам и пришлю в WhatsApp — на что записать номер?»' },
      { who: 'c', t: '…' },
    ];

    const total = LINES.filter((l) => l.bad).length;
    // Нажимать можно любую реплику менеджера — иначе подсказка выдала бы ответ.
    const opened = new Set();
    const found = () => [...opened].filter((k) => LINES[k].bad).length;

    const render = () => {
      root.innerHTML = `<div class="call">
        <div class="call__head">
          <span class="call__who">Входящий звонок с сайта · 1 мин 12 с</span>
          <span class="call__score">Нашли ошибок: <b>${found()}</b> из ${total}</span>
        </div>
        <div class="call__list">
          ${LINES.map((l, k) => {
            const me = l.who === 'm';
            const open = opened.has(k);
            return `<div class="call__row call__row--${l.who}">
              <button class="call__bubble ${me ? 'is-check' : ''} ${open ? (l.bad ? 'is-open' : 'is-fine') : ''}" data-line="${k}" ${me ? '' : 'disabled'}>
                <span class="call__t">${esc(l.t)}</span>
                ${me && !open ? '<span class="call__hint">проверить эту реплику</span>' : ''}
              </button>
              ${open ? (l.bad ? `<div class="call__fix">
                <b>Что не так.</b> ${esc(l.bad)}<br />
                <b>Как надо.</b> ${esc(l.fix)}</div>` : '<div class="call__fine">Здесь всё в порядке — на этой реплике менеджер ничего не теряет.</div>') : ''}
            </div>`;
          }).join('')}
        </div>
        ${found() === total ? `<div class="call__done">
          <b>Это пять потерянных сделок из десяти — и ни одной записи в CRM.</b>
          <p>Менеджер не хамил и не ленился: он просто отвечал на вопросы. Этому не учат само собой, это ставится скриптом, листом качества и разбором звонков раз в неделю. Мы делаем именно это.</p>
          <a class="btn" href="#start">Разберите наши звонки</a>
        </div>` : '<p class="call__note">Нажимайте на реплики менеджера — там, где, по-вашему, он теряет клиента.</p>'}
      </div>`;
      root.querySelectorAll('[data-line]').forEach((b) => b.addEventListener('click', () => {
        opened.add(Number(b.dataset.line));
        render();
      }));
    };
    render();
  }());

  /* ================================================================ */
  /* 6. Вопросы: аккордеон                                            */
  /* ================================================================ */
  /* Разметка на страницах остаётся обычным <details> — и работает без
     скрипта. Здесь мы её только пересобираем в аккордеон: нумерация,
     открыт один пункт, у открытого вопроса крупнее кегль. */
  (function faq() {
    document.querySelectorAll('.faq').forEach((box) => {
      const items = [...box.querySelectorAll('details')].map((d) => ({
        q: d.querySelector('summary')?.textContent.trim() ?? '',
        a: d.querySelector('p')?.innerHTML ?? '',
        pill: d.dataset.pill || '',
      }));
      if (!items.length) return;

      box.classList.add('faq--acc');
      box.innerHTML = items.map((it, i) => `<div class="qa" data-i="${i}">
        <button class="qa__head" type="button" aria-expanded="false">
          <span class="qa__n">${String(i + 1).padStart(2, '0')}</span>
          <span class="qa__q">${esc(it.q)}</span>
          <span class="qa__ic" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
          </span>
        </button>
        <div class="qa__body"><div class="qa__in">
          <p class="qa__a">${it.a}</p>
          ${it.pill ? `<span class="qa__pill">${esc(it.pill)}</span>` : ''}
        </div></div>
      </div>`).join('');

      const rows = [...box.querySelectorAll('.qa')];
      const open = (row, on) => {
        const body = row.querySelector('.qa__body');
        row.classList.toggle('is-open', on);
        row.querySelector('.qa__head').setAttribute('aria-expanded', String(on));
        body.style.height = on ? body.querySelector('.qa__in').offsetHeight + 'px' : '0px';
      };
      rows.forEach((row) => row.querySelector('.qa__head').addEventListener('click', () => {
        const was = row.classList.contains('is-open');
        rows.forEach((r) => open(r, false));
        if (!was) open(row, true);
      }));
      rows.forEach((r) => open(r, false));
      open(rows[1] ?? rows[0], true);                 // один пункт открыт сразу
      addEventListener('resize', () => {
        const cur = rows.find((r) => r.classList.contains('is-open'));
        if (cur) open(cur, true);
      }, { passive: true });
    });
  }());

  /* ================================================================ */
  /* 5. Партнёрка: конструктор условий                                */
  /* ================================================================ */
  /* Вместо описания «гибкие правила» — пусть человек соберёт своё
     условие и увидит, сколько и когда получит партнёр. */
  (function ruleBuilder() {
    const root = el('rulecalc');
    if (!root) return;

    const KINDS = {
      percent: { t: 'Процент от оплаты, пока клиент платит', unit: '%', v: 20 },
      months: { t: 'Процент, но только первые месяцы', unit: '%', v: 25 },
      deal: { t: 'Фиксированная сумма за продажу', unit: '₽', v: 15000 },
      lead: { t: 'Фиксированная сумма за приведённого клиента', unit: '₽', v: 3000 },
    };
    const st = { kind: 'percent', rate: 20, price: 65000, months: 3, life: 6 };

    const render = () => {
      const k = KINDS[st.kind];
      const perMonth = st.kind === 'percent' || st.kind === 'months' ? st.price * st.rate / 100 : 0;
      const pay = [];
      for (let m = 1; m <= 12; m++) {
        if (st.kind === 'percent') pay.push(m <= st.life ? perMonth : 0);
        else if (st.kind === 'months') pay.push(m <= Math.min(st.life, st.months) ? perMonth : 0);
        else if (st.kind === 'deal') pay.push(m === 1 ? st.rate : 0);
        else pay.push(m === 1 ? st.rate : 0);
      }
      const sum = pay.reduce((a, b) => a + b, 0);
      const max = Math.max(...pay, 1);
      const share = st.price * st.life > 0 ? sum / (st.price * st.life) * 100 : 0;

      root.innerHTML = `<div class="rc">
        <div class="rc__in">
          <label class="rc__f"><span>Как платим партнёру</span>
            <select id="rcKind">${Object.entries(KINDS).map(([key, v]) => `<option value="${key}" ${key === st.kind ? 'selected' : ''}>${v.t}</option>`).join('')}</select></label>
          <label class="rc__f"><span>Ставка<b>${k.unit}</b></span>
            <input type="number" id="rcRate" value="${st.rate}" min="0" step="${k.unit === '%' ? 1 : 1000}" /></label>
          ${st.kind === 'months' ? `<label class="rc__f"><span>Сколько месяцев платим<b>мес</b></span>
            <input type="number" id="rcMonths" value="${st.months}" min="1" max="12" /></label>` : ''}
          <label class="rc__f"><span>Клиент платит в месяц<b>₽</b></span>
            <input type="number" id="rcPrice" value="${st.price}" min="0" step="5000" /></label>
          <label class="rc__f"><span>Сколько месяцев останется<b>мес</b></span>
            <input type="number" id="rcLife" value="${st.life}" min="1" max="12" /></label>
        </div>
        <div class="rc__out">
          <div class="rc__big"><b>${rub(sum)}</b><span>получит партнёр за этого клиента</span></div>
          <div class="rc__chart">${pay.map((v, i) => `<span class="rc__col" title="${i + 1}-й месяц: ${rub(v)}">
            <span class="rc__colfill" style="height:${v > 0 ? Math.max(6, v / max * 100) : 0}%"></span>
            <span class="rc__coln">${i + 1}</span></span>`).join('')}</div>
          <p class="rc__note">${st.kind === 'lead'
            ? 'Начисление появится сразу, как вы подтвердите, что клиент от партнёра, — продажа не обязательна.'
            : st.kind === 'deal'
              ? 'Начисление появится в месяц, когда клиент оплатит. Не оплатил — партнёр видит «ждёт оплаты», денег нет.'
              : 'Начисления появляются каждый месяц после реальной оплаты клиента. Перестал платить — начисления прекращаются сами.'}
            ${sum > 0 ? ` Это <b>${share.toFixed(1)}%</b> от всего, что заплатит клиент за ${st.life} мес.` : ''}</p>
        </div>
      </div>`;

      const bind = (id, key, fix) => {
        const node = el(id);
        if (node) node.addEventListener('input', (e) => { st[key] = fix(e.target.value); render(); el(id)?.focus(); });
      };
      el('rcKind').addEventListener('change', (e) => {
        st.kind = e.target.value;
        st.rate = KINDS[st.kind].v;
        render();
      });
      bind('rcRate', 'rate', (v) => Math.max(0, Number(v) || 0));
      bind('rcMonths', 'months', (v) => Math.min(12, Math.max(1, Number(v) || 1)));
      bind('rcPrice', 'price', (v) => Math.max(0, Number(v) || 0));
      bind('rcLife', 'life', (v) => Math.min(12, Math.max(1, Number(v) || 1)));
    };
    render();
  }());
})();
