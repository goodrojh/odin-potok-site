/*
 * «Поток» — облако точек, которое перетекает из слова в слово.
 *
 * Это не украшение: на каждом шаге часть точек отваливается и гаснет,
 * поэтому воронку видно глазами. Было «КЛИКИ» — осталась половина, стало
 * «ЗАЯВКИ»; ещё четверть — «ПРОДАЖИ»; горстка — «₽». Слова у каждой
 * страницы свои, смысл один: из чего во что перетекает ваш поток.
 *
 * Как устроено: слово рисуется в невидимый холст, из него вынимаются
 * координаты закрашенных пикселей — это и есть цели для точек. Дальше
 * обычная интерполяция с лёгким завихрением по дороге.
 *
 * Разметка: <canvas class="stream" data-flow="КЛИКИ|ЗАЯВКИ|₽"
 *                   data-caps="подпись|подпись|подпись"></canvas>
 */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const COLORS = [[138, 127, 224], [124, 110, 214], [173, 164, 240]];

  // Шерсть: тёплая светлая пряжа, глубокая тень в просветах между петлями.
  const WOOL = {
    deep: '#1d1740',      // тень под петлёй и фон полотна
    under: '#6354a8',     // изнанка пряди
    body: '#c9bfec',      // тело пряди
    bodyB: '#b7abe3',     // вторая прядь чуть темнее — петля круглее
    light: '#f4f1fe',     // блик по верху
  };

  const HOLD = 2100;        // сколько держим слово
  const MORPH = 1500;       // сколько перетекаем
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function start(host) {
    const ctx = host.getContext && host.getContext('2d', { alpha: true });
    if (!ctx) return;
    const words = (host.dataset.flow || 'ПОТОК').split('|');
    const caps = (host.dataset.caps || '').split('|');
    const capBox = host.closest('.flowband')?.querySelector('[data-flow-cap]');
    // Каждое следующее слово мельче предыдущего: точек на него нужно меньше,
    // и воронка получается сама собой — не «часть исчезла», а «осталось меньше».
    const SCALE = [1, 0.78, 0.6, 0.52, 0.46];
    const MIN_ROWS = 9;      // меньше рядов петель — и буква уже не читается
    let keep = words.map(() => 1);

    let w = 0; let h = 0; let dpr = 1;
    let shapes = [];          // координаты точек для каждого слова
    let masks = [];           // силуэты слов: по ним обрезаем связанное полотно
    let pts = [];             // точки самого слова
    let area = { y: 0, h: 0 };// куда ставим слово
    let cellW = 12; let cellH = 14;   // размер петли: ширина столбика и высота ряда
    let step = 0; let t0 = 0; let phase = 'hold';
    let raf = 0; let rafTouch = 0; let timer = 0; let touching = false;
    let running = false; let visible = true;
    let pointer = { x: -9999, y: -9999 };

    /**
     * Разбираем слово на петли: столбики строго друг под другом, ряды
     * чуть плотнее, чем высота петли, — тогда ряды находят друг на друга
     * и полотно получается сплошным, как на спицах.
     */
    function sample(text, scale, gap, base) {
      const off = document.createElement('canvas');
      const ow = Math.round(w); const oh = Math.round(h);
      off.width = ow; off.height = oh;
      const c = off.getContext('2d');
      c.fillStyle = '#fff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `800 ${Math.round(base * scale)}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
      c.fillText(text, ow / 2, area.y + area.h / 2);
      const data = c.getImageData(0, 0, ow, oh).data;
      masks.push(off);                        // силуэт слова для обрезки полотна
      const gy = Math.max(4, Math.round(gap * 0.78));
      const out = [];
      for (let y = Math.round(gy / 2); y < oh; y += gy) {
        for (let x = Math.round(gap / 2); x < ow; x += gap) {
          const xi = Math.round(x);
          if (data[(y * ow + xi) * 4 + 3] > 100) out.push(xi, y);
        }
      }
      return out;
    }

    /** Где стоит слово — берём из вёрстки, чтобы холст и разметка не разъезжались. */
    function measure(box) {
      const stage = host.closest('.flowband') && host.closest('.flowband').querySelector('.flowband__stage');
      if (stage) {
        const r = stage.getBoundingClientRect();
        area = { y: r.top - box.top, h: r.height };
      } else {
        area = { y: h * 0.4, h: h * 0.55 };
      }
    }

    function build() {
      const box = host.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(320, box.width);
      h = Math.max(160, box.height);
      host.width = Math.round(w * dpr);
      host.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure(box);

      // Шаг выборки подбираем так, чтобы самое большое слово уложилось в бюджет точек.
      // Кегль считаем по самому длинному слову, а дальше только уменьшаем:
      // так видно, что поток физически усыхает, а не просто меняет надпись.
      const longest = Math.max(...words.map((t) => t.length));
      const base = Math.min(area.h * 0.92, (w * 0.95) / Math.max(3.2, longest * 0.55));
      let gap = Math.max(8, Math.round(base / 19));
      for (let i = 0; i < 5; i++) {
        masks = [];
        // Ниже этого кегля крупная вязка перестаёт складываться в букву:
        // на «₽» оставалось шесть рядов петель и читался комок пряжи.
        // Короткому слову поднимаем кегль отдельно: усыхание и так видно по
        // числу букв, а последний знак — это итог, его надо разглядеть.
        const floor = (gap * 0.78 * MIN_ROWS) / (base * 0.7);
        const size = (t, k) => Math.max(SCALE[k] ?? 0.3, floor, t.length <= 2 ? 0.72 : 0);
        shapes = words.map((t, k) => sample(t, size(t, k), gap, base));
        const most = Math.max(...shapes.map((sh) => sh.length / 2));
        if (most <= 2600) break;
        gap += 2;
      }
      const n = Math.max(...shapes.map((sh) => sh.length / 2));
      keep = shapes.map((sh) => (sh.length / 2) / n);
      pts = Array.from({ length: n }, () => ({
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        fx: 0, fy: 0, tx: 0, ty: 0,
        fa: 0, ta: 1, a: 1,
        sw: (Math.random() - 0.5) * 0.9,
        ph: Math.random() * 6.28,
        sp: 0.5 + Math.random() * 0.7,
        k: 0.95 + Math.random() * 0.1,     // петли чуть разные — ручная вязка
      }));
      cellW = gap;
      cellH = Math.max(4, Math.round(gap * 0.78));
      aim(0, true);
    }

    /** Раздаём цели. Лишние уходят вниз и гаснут — это и есть воронка. */
    function aim(i, instant) {
      const shape = shapes[i];
      const slots = shape.length / 2;
      pts.forEach((p, k) => {
        p.fx = p.x; p.fy = p.y; p.fa = p.a;
        if (k < slots) {
          p.tx = shape[k * 2]; p.ty = shape[k * 2 + 1]; p.ta = 1;
        } else {
          p.tx = p.x + (Math.random() - 0.5) * 120;
          p.ty = p.y + 90 + Math.random() * 160;
          p.ta = 0;
        }
        if (instant) { p.x = p.tx; p.y = p.ty; p.a = p.ta; }
      });
    }

    /**
     * Одна петля — две толстые пряди, сходящиеся внизу. Рисуем их снизу
     * вверх слоями: тень, изнанка, тело, блик. Петли идут рядами сверху
     * вниз, поэтому нижний ряд перекрывает хвосты верхнего — ровно так
     * ложится пряжа на спицах.
     */
    function stitch(p) {
      const W = cellW * p.k; const H = cellH * p.k;
      const T = W * 0.46;                       // толщина пряди
      const x = p.x; const y = p.y;
      const top = y - H * 0.95; const bot = y + H * 0.40;

      const leg = (sx, cx) => {
        ctx.beginPath();
        ctx.moveTo(sx, top);
        ctx.quadraticCurveTo(cx, y + H * 0.18, x, bot);
        ctx.stroke();
      };
      const pair = (width, color, dx, dy) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.save();
        ctx.translate(dx, dy);
        leg(x - W * 0.44, x - W * 0.40);
        leg(x + W * 0.44, x + W * 0.40);
        ctx.restore();
      };

      pair(T * 1.3, WOOL.deep, 0, T * 0.30);    // тень в просвете
      pair(T * 1.08, WOOL.under, 0, T * 0.12);  // изнанка пряди
      pair(T, WOOL.body, 0, 0);                 // тело
      pair(T * 0.30, WOOL.light, -T * 0.16, -T * 0.20); // блик по верху
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Подложка: сплошное тёмное полотно, чтобы фон не просвечивал.
      ctx.fillStyle = WOOL.deep;
      for (const p of pts) {
        if (p.a <= 0.05) continue;
        ctx.globalAlpha = Math.min(1, p.a);
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, cellW * 0.66, cellH * 0.8, 0, 0, 6.3);
        ctx.fill();
      }
      for (const p of pts) {
        if (p.a <= 0.05) continue;
        ctx.globalAlpha = Math.min(1, p.a);
        stitch(p);
      }
      ctx.globalAlpha = 1;

      // Пока слово стоит — срезаем всё, что вылезло за букву: петли
      // торчали хвостами и буквы читались как пятно. На перетекании
      // обрезки нет, иначе пряжа не смогла бы разлететься.
      if (phase === 'hold' && masks[step]) {
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(masks[step], 0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    /**
     * Во время покоя не считаем и не перерисовываем вообще ничего: холст
     * стоит кадр в кадр, поэтому мерцать физически нечему. Движение есть
     * только на перетекании, дальше точки встают ровно по пикселям.
     */
    function snap() {
      const q = 1 / dpr;                       // прижимаем к пикселям устройства
      for (const p of pts) {
        p.x = Math.round(p.tx / q) * q;
        p.y = Math.round(p.ty / q) * q;
        p.a = p.ta;
      }
    }

    function frame(now) {
      if (!t0) t0 = now;
      const k = ease(Math.min(1, (now - t0) / MORPH));
      for (const p of pts) {
        const arc = Math.sin(k * Math.PI) * p.sw * 60;
        p.x = p.fx + (p.tx - p.fx) * k + arc;
        p.y = p.fy + (p.ty - p.fy) * k - arc * 0.4;
        p.a = p.fa + (p.ta - p.fa) * k;
      }
      draw();
      if (k >= 1) { phase = 'hold'; snap(); draw(); hold(); return; }
      raf = requestAnimationFrame(frame);
    }

    /**
     * Полотно под курсором расходится и возвращается на место. Кадры здесь
     * идут только пока мышь рядом или петли ещё не улеглись: как только всё
     * встало — замираем, и в покое снова ни одного лишнего кадра.
     */
    function settle() {
      let moving = false;
      const R2 = 11000;
      for (const p of pts) {
        let gx = p.tx; let gy = p.ty;
        const dx = p.tx - pointer.x; const dy = p.ty - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 0.01) {
          const f = (1 - d2 / R2) * 26 / Math.sqrt(d2);
          gx += dx * f; gy += dy * f;
        }
        p.x += (gx - p.x) * 0.16;
        p.y += (gy - p.y) * 0.16;
        if (Math.abs(gx - p.x) > 0.25 || Math.abs(gy - p.y) > 0.25) moving = true;
      }
      draw();
      if (!moving && pointer.x < -500) { snap(); draw(); touching = false; return; }
      rafTouch = requestAnimationFrame(settle);
    }

    function wake() {
      if (touching || phase !== 'hold' || reduced || !visible) return;
      touching = true;
      rafTouch = requestAnimationFrame(settle);
    }

    /** Ждём и запускаем следующее слово. */
    function hold() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        cancelAnimationFrame(rafTouch); touching = false;
        step = (step + 1) % words.length;
        aim(step);
        setCaption(step);
        phase = 'morph'; t0 = 0;
        raf = requestAnimationFrame(frame);
      }, HOLD);
    }

    function setCaption(i) {
      if (capBox && caps[i]) {
        capBox.style.opacity = '0';
        setTimeout(() => { capBox.textContent = caps[i]; capBox.style.opacity = '1'; }, 220);
      }
    }

    function play(on) {
      const next = on && !reduced && !document.hidden;
      if (next === running) return;
      running = next;
      if (running) { if (phase === 'morph') { t0 = 0; raf = requestAnimationFrame(frame); } else hold(); }
      else { cancelAnimationFrame(raf); cancelAnimationFrame(rafTouch); touching = false; clearTimeout(timer); }
    }

    build();
    setCaption(0);
    draw();
    if (reduced) return;

    let resizeTimer = 0;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); step = 0; phase = 'hold'; aim(0, true); setCaption(0); draw(); if (running) hold(); }, 200);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => play(visible));
    const band = host.parentElement;
    band.addEventListener('pointermove', (e) => {
      const box = host.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
      wake();
    }, { passive: true });
    band.addEventListener('pointerleave', () => { pointer = { x: -9999, y: -9999 }; });
    new IntersectionObserver((rows) => { visible = rows[0].isIntersecting; play(visible); }, { threshold: 0 }).observe(host);
    play(true);
  }

  document.querySelectorAll('canvas.stream').forEach(start);
})();
