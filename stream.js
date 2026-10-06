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

  /**
   * Бусина: плотный шарик с бликом и тенью — края чёткие, но форма объёмная.
   * Рисуем один раз крупно и дальше уменьшаем: так получается аккуратное
   * сглаживание без размытого ореола.
   */
  function bead(rgb) {
    const S = 72; const r = S / 2 - 3;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const body = g.createRadialGradient(S * 0.38, S * 0.34, r * 0.1, S / 2, S / 2, r);
    body.addColorStop(0, `rgb(${Math.min(255, rgb[0] + 70)},${Math.min(255, rgb[1] + 70)},${Math.min(255, rgb[2] + 50)})`);
    body.addColorStop(0.55, `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
    body.addColorStop(1, `rgb(${Math.round(rgb[0] * 0.55)},${Math.round(rgb[1] * 0.52)},${Math.round(rgb[2] * 0.72)})`);
    g.fillStyle = body;
    g.beginPath(); g.arc(S / 2, S / 2, r, 0, 6.3); g.fill();
    const spot = g.createRadialGradient(S * 0.36, S * 0.3, 0, S * 0.36, S * 0.3, r * 0.52);
    spot.addColorStop(0, 'rgba(255,255,255,0.75)');
    spot.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = spot;
    g.beginPath(); g.arc(S * 0.36, S * 0.3, r * 0.52, 0, 6.3); g.fill();
    return c;
  }
  const SPRITES = COLORS.map(bead);
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
    const SCALE = [1, 0.74, 0.55, 0.4, 0.32];
    let keep = words.map(() => 1);

    let w = 0; let h = 0; let dpr = 1;
    let shapes = [];          // координаты точек для каждого слова
    let pts = [];             // сами точки
    let step = 0; let t0 = 0; let phase = 'hold';
    let raf = 0; let running = false; let visible = true;
    let pointer = { x: -999, y: -999 };

    /** Координаты закрашенных пикселей слова — цели для точек. */
    function sample(text, scale, gap, base) {
      const off = document.createElement('canvas');
      const ow = Math.round(w); const oh = Math.round(h);
      off.width = ow; off.height = oh;
      const c = off.getContext('2d');
      const size = base * scale;
      c.fillStyle = '#fff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = `800 ${Math.round(size)}px -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
      c.fillText(text, ow / 2, oh / 2);
      const data = c.getImageData(0, 0, ow, oh).data;
      const out = [];
      for (let y = 0; y < oh; y += gap) {
        for (let x = 0; x < ow; x += gap) {
          if (data[(y * ow + x) * 4 + 3] > 128) out.push(x + (Math.random() - 0.5) * gap, y + (Math.random() - 0.5) * gap);
        }
      }
      return out;
    }

    function build() {
      const box = host.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(320, box.width);
      h = Math.max(160, box.height);
      host.width = Math.round(w * dpr);
      host.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Шаг выборки подбираем так, чтобы самое большое слово уложилось в бюджет точек.
      // Кегль считаем по самому длинному слову, а дальше только уменьшаем:
      // так видно, что поток физически усыхает, а не просто меняет надпись.
      const longest = Math.max(...words.map((t) => t.length));
      const base = Math.min(h * 0.66, (w * 0.9) / Math.max(3.2, longest * 0.58));
      let gap = 5;
      for (let i = 0; i < 4; i++) {
        shapes = words.map((t, k) => sample(t, SCALE[k] ?? 0.3, gap, base));
        if (Math.max(...shapes.map((sh) => sh.length / 2)) <= 1500) break;
        gap += 1;
      }
      const n = Math.max(...shapes.map((sh) => Math.round(sh.length / 2)));
      keep = shapes.map((sh) => (sh.length / 2) / n);
      pts = Array.from({ length: n }, (_, i) => ({
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        fx: 0, fy: 0, tx: 0, ty: 0,
        fa: 0, ta: 1, a: 1,
        sw: (Math.random() - 0.5) * 0.9,          // завихрение по дороге
        s: (Math.random() < 0.18 ? 11 : 8) + Math.random() * 2,
        ph: Math.random() * 6.28,                 // фаза дыхания — вместо дрожи
        sp: 0.5 + Math.random() * 0.7,
        g: i % SPRITES.length,
      }));
      aim(0, true);
    }

    /** Раздаём точкам цели для шага i. Лишние уходят вниз и гаснут. */
    function aim(i, instant) {
      const shape = shapes[i];
      const slots = shape.length / 2;
      const alive = Math.max(1, Math.round(pts.length * keep[i]));
      pts.forEach((p, k) => {
        p.fx = p.x; p.fy = p.y; p.fa = p.a;
        if (k < alive) {
          const j = (k % slots) * 2;
          p.tx = shape[j]; p.ty = shape[j + 1]; p.ta = 1;
        } else {
          p.tx = p.x + (Math.random() - 0.5) * 120;
          p.ty = p.y + 90 + Math.random() * 160;
          p.ta = 0;
        }
        if (instant) { p.x = p.tx; p.y = p.ty; p.a = p.ta; }
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (p.a <= 0.02) continue;
        const s = p.s;
        ctx.globalAlpha = Math.min(1, p.a);
        ctx.drawImage(SPRITES[p.g], p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      if (!t0) t0 = now;
      const dt = now - t0;

      if (phase === 'hold' && dt > HOLD) { phase = 'morph'; t0 = now; aim((step + 1) % words.length); setCaption((step + 1) % words.length); }
      else if (phase === 'morph' && dt > MORPH) { phase = 'hold'; t0 = now; step = (step + 1) % words.length; }

      const k = phase === 'morph' ? ease(Math.min(1, dt / MORPH)) : 1;
      for (const p of pts) {
        if (phase === 'morph') {
          const arc = Math.sin(k * Math.PI) * p.sw * 60;
          p.x = p.fx + (p.tx - p.fx) * k + arc;
          p.y = p.fy + (p.ty - p.fy) * k - arc * 0.4;
          p.a = p.fa + (p.ta - p.fa) * k;
        } else {
          // Плавное дыхание по своей фазе: никакого случайного дрожания,
          // иначе облако мерцает и выглядит как помехи.
          p.x += (p.tx + Math.sin(now / 2600 * p.sp + p.ph) * 0.5 - p.x) * 0.05;
          p.y += (p.ty + Math.cos(now / 3000 * p.sp + p.ph) * 0.5 - p.y) * 0.05;
        }
        // Курсор расталкивает облако.
        const dx = p.x - pointer.x; const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 9000 && d2 > 0.01) {
          const f = (9000 - d2) / 9000;
          p.x += dx * f * 0.09;
          p.y += dy * f * 0.09;
        }
      }
      draw();
      if (running) raf = requestAnimationFrame(frame);
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
      if (running) { t0 = 0; raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    }

    build();
    setCaption(0);
    draw();
    if (reduced) return;

    let resizeTimer = 0;
    addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { build(); step = 0; phase = 'hold'; t0 = 0; setCaption(0); draw(); }, 200);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => play(visible));
    host.parentElement.addEventListener('pointermove', (e) => {
      const box = host.getBoundingClientRect();
      pointer = { x: e.clientX - box.left, y: e.clientY - box.top };
    }, { passive: true });
    host.parentElement.addEventListener('pointerleave', () => { pointer = { x: -999, y: -999 }; });
    new IntersectionObserver((rows) => { visible = rows[0].isIntersecting; play(visible); }, { threshold: 0 }).observe(host);
    play(true);
  }

  document.querySelectorAll('canvas.stream').forEach(start);
})();
