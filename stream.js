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
   * Вязаная петля: две дуги «галочкой», как стежок на спицах. Рисуем
   * один раз крупно и дальше уменьшаем — край остаётся чётким, а форма
   * объёмной. Несколько наклонов, чтобы полотно не выглядело штампованным.
   */
  function stitch(rgb, tilt) {
    const S = 72;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    g.translate(S / 2, S / 2); g.rotate(tilt); g.translate(-S / 2, -S / 2);
    const dark = `rgb(${Math.round(rgb[0] * 0.62)},${Math.round(rgb[1] * 0.6)},${Math.round(rgb[2] * 0.78)})`;
    const light = `rgb(${Math.min(255, rgb[0] + 58)},${Math.min(255, rgb[1] + 58)},${Math.min(255, rgb[2] + 40)})`;
    const draw = (color, width, dy) => {
      g.strokeStyle = color; g.lineWidth = width; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      g.moveTo(S * 0.17, S * 0.22 + dy);
      g.quadraticCurveTo(S * 0.30, S * 0.80 + dy, S * 0.50, S * 0.80 + dy);
      g.quadraticCurveTo(S * 0.70, S * 0.80 + dy, S * 0.83, S * 0.22 + dy);
      g.stroke();
    };
    draw(dark, S * 0.30, S * 0.05);                 // тень снизу — петля объёмная
    draw(`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, S * 0.26, 0);
    draw(light, S * 0.10, -S * 0.04);               // блик по верху нити
    return c;
  }
  const TILTS = [-0.13, 0, 0.13];
  const SPRITES = [];
  for (const rgb of COLORS) for (const t of TILTS) SPRITES.push(stitch(rgb, t));
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
    let pts = [];             // точки самого слова
    let area = { y: 0, h: 0 };// куда ставим слово
    let stitchSize = 12;      // размер петли, считается от шага сетки
    let step = 0; let t0 = 0; let phase = 'hold';
    let raf = 0; let rafTouch = 0; let timer = 0; let touching = false;
    let running = false; let visible = true;
    let pointer = { x: -9999, y: -9999 };

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
      c.fillText(text, ow / 2, area.y + area.h / 2);
      const data = c.getImageData(0, 0, ow, oh).data;
      // Петли ставим рядами со сдвигом через ряд — так это читается как
      // вязаное полотно, а края букв получаются ровными, без бахромы.
      const gy = Math.max(3, Math.round(gap * 0.82));
      const out = [];
      for (let row = 0, y = 0; y < oh; y += gy, row++) {
        const off = row % 2 ? gap / 2 : 0;
        for (let x = off; x < ow; x += gap) {
          const xi = Math.round(x);
          if (data[(y * ow + xi) * 4 + 3] > 128) out.push(xi, y);
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
      const base = Math.min(area.h * 0.9, (w * 0.9) / Math.max(3.2, longest * 0.58));
      let gap = 7;
      for (let i = 0; i < 4; i++) {
        shapes = words.map((t, k) => sample(t, SCALE[k] ?? 0.3, gap, base));
        if (Math.max(...shapes.map((sh) => sh.length / 2)) <= 2000) break;
        gap += 1;
      }
      stitchSize = gap * 1.75;
      const n = Math.max(...shapes.map((sh) => Math.round(sh.length / 2)));
      keep = shapes.map((sh) => (sh.length / 2) / n);
      pts = Array.from({ length: n }, (_, i) => ({
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        fx: 0, fy: 0, tx: 0, ty: 0,
        fa: 0, ta: 1, a: 1,
        sw: (Math.random() - 0.5) * 0.9,          // завихрение по дороге
        ph: Math.random() * 6.28,                 // фаза дыхания — вместо дрожи
        sp: 0.5 + Math.random() * 0.7,
        g: (Math.random() * SPRITES.length) | 0,
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
      const s = stitchSize;
      for (const p of pts) {
        if (p.a <= 0.02) continue;
        ctx.globalAlpha = Math.min(1, p.a);
        ctx.drawImage(SPRITES[p.g], p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
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
