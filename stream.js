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

  const YARN = ['rgb(150,139,232)', 'rgb(128,114,219)', 'rgb(176,167,243)'];
  const YARN_HI = ['rgb(196,189,250)', 'rgb(176,166,243)', 'rgb(214,209,252)'];

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
    let yarnW = 10;           // толщина нити, считается от шага сетки
    let step = 0; let t0 = 0; let phase = 'hold';
    let raf = 0; let rafTouch = 0; let timer = 0; let touching = false;
    let running = false; let visible = true;
    let pointer = { x: -9999, y: -9999 };

    /**
     * Разбираем слово на нити. Идём по рядам и собираем подряд идущие
     * закрашенные точки в одну нить — её потом и рисуем одной линией.
     * Короткие огрызки выбрасываем, иначе по краям букв остаётся бахрома.
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
      const gy = Math.max(4, Math.round(gap * 1.15));
      const threads = [];
      for (let y = Math.round(gy / 2); y < oh; y += gy) {
        let run = null;
        for (let x = 0; x < ow; x += gap) {
          const xi = Math.round(x);
          const on = data[(y * ow + xi) * 4 + 3] > 120;
          if (on) { (run ??= []).push(xi, y); continue; }
          if (run) { if (run.length >= 4) threads.push(run); run = null; }
        }
        if (run && run.length >= 4) threads.push(run);
      }
      return threads;
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
        const most = Math.max(...shapes.map((sh) => sh.reduce((a, t) => a + t.length / 2, 0)));
        if (most <= 2200) break;
        gap += 1;
      }
      // В каждой нити своё число точек. Берём самое «толстое» слово за основу.
      const total = (sh) => sh.reduce((a, t) => a + t.length / 2, 0);
      const n = Math.max(...shapes.map(total));
      keep = shapes.map((sh) => total(sh) / n);
      pts = Array.from({ length: n }, (_, i) => ({
        x: w / 2 + (Math.random() - 0.5) * w,
        y: h / 2 + (Math.random() - 0.5) * h,
        fx: 0, fy: 0, tx: 0, ty: 0,
        fa: 0, ta: 1, a: 1,
        sw: (Math.random() - 0.5) * 0.9,          // завихрение по дороге
        ph: Math.random() * 6.28,
        sp: 0.5 + Math.random() * 0.7,
        head: false,                               // начало новой нити
        g: 0,
      }));
      yarnW = gap * 0.92;
      aim(0, true);
    }

    /**
     * Раздаём точкам цели. Идём нить за нитью, чтобы соседние точки
     * остались соседями: тогда при перетекании нити тянутся, а не рвутся.
     * Лишние уходят вниз и гаснут — это и есть воронка.
     */
    function aim(i, instant) {
      const threads = shapes[i];
      let k = 0;
      for (const t of threads) {
        for (let j = 0; j < t.length; j += 2) {
          const p = pts[k];
          if (!p) break;
          p.fx = p.x; p.fy = p.y; p.fa = p.a;
          p.tx = t[j]; p.ty = t[j + 1]; p.ta = 1;
          p.head = j === 0;
          p.g = (k * 7 + i * 3) % YARN.length;
          if (instant) { p.x = p.tx; p.y = p.ty; p.a = p.ta; }
          k++;
        }
      }
      for (; k < pts.length; k++) {
        const p = pts[k];
        p.fx = p.x; p.fy = p.y; p.fa = p.a;
        p.tx = p.x + (Math.random() - 0.5) * 120;
        p.ty = p.y + 90 + Math.random() * 160;
        p.ta = 0; p.head = true;
        if (instant) { p.x = p.tx; p.y = p.ty; p.a = p.ta; }
      }
    }

    /**
     * Нить — это ломаная по её точкам. Рисуем дважды: толстым тёмным
     * снизу и тонким светлым сверху — получается круглая нитка с бликом.
     */
    function strokeRuns(width, colors, dy, alphaMul) {
      let i = 0;
      while (i < pts.length) {
        if (pts[i].a <= 0.05) { i++; continue; }
        const start = i;
        let j = i + 1;
        while (j < pts.length && !pts[j].head && pts[j].a > 0.05) j++;
        if (j - start > 1) {
          ctx.beginPath();
          ctx.moveTo(pts[start].x, pts[start].y + dy);
          for (let k = start + 1; k < j; k++) ctx.lineTo(pts[k].x, pts[k].y + dy);
          ctx.globalAlpha = Math.min(1, pts[start].a) * alphaMul;
          ctx.strokeStyle = colors[pts[start].g];
          ctx.lineWidth = width;
          ctx.stroke();
        }
        i = j;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      strokeRuns(yarnW, YARN, yarnW * 0.18, 1);          // тело нити
      strokeRuns(yarnW * 0.34, YARN_HI, -yarnW * 0.2, 0.9); // блик
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
