/*
 * «Поток» — фирменный приём сайта.
 *
 * Название компании и есть идея картинки: разрозненные источники сходятся
 * в один поток и доходят до результата. Поэтому фон не изображение, а
 * рисунок, который считается в браузере: точки летят слева, сжимаются в
 * узкое горло и расходятся веером справа.
 *
 * Два применения:
 *   .stream  в первом экране — еле заметная фактура под содержимым;
 *   .stream  в полосе под ним — тот же поток в полную силу, с подписью.
 *
 * Бережём батарею и глаза: при prefers-reduced-motion рисуем один кадр и
 * останавливаемся, вне экрана и в фоновой вкладке — не считаем ничего.
 */
(() => {
  const ACCENT = [99, 86, 200];
  const ACCENT2 = [138, 127, 224];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // n — плотность, waist — ширина горла, speed — скорость, warm — доля светлых точек.
  const MODES = {
    home: { n: 1.00, waist: 0.030, speed: 1.00, warm: 0.55 },
    agency: { n: 1.15, waist: 0.022, speed: 1.20, warm: 0.70 },
    web: { n: 0.95, waist: 0.045, speed: 0.95, warm: 0.45 },
    design: { n: 0.95, waist: 0.055, speed: 0.90, warm: 0.35 },
    sales: { n: 1.05, waist: 0.026, speed: 1.10, warm: 0.60 },
    platform: { n: 0.85, waist: 0.035, speed: 0.85, warm: 0.50 },
  };

  function start(host) {
    const ctx = host.getContext && host.getContext('2d', { alpha: true });
    if (!ctx) return;
    const mode = MODES[host.dataset.stream] ?? MODES.home;
    const band = host.classList.contains('stream--band');
    const rnd = (a, b) => a + Math.random() * (b - a);

    let w = 0; let h = 0; let parts = []; let raf = 0;
    let running = false; let visible = true;
    let mouse = { x: -999, y: -999 };

    function spawn(anywhere) {
      return {
        x: anywhere ? rnd(0, w) : rnd(-90, -10),
        lane: rnd(-1, 1),
        y: 0, py: 0,
        v: rnd(0.6, 1.7) * mode.speed,
        r: rnd(0.8, band ? 2.8 : 2.2),
        a: rnd(0.35, 1),
        c: Math.random() < mode.warm ? ACCENT : ACCENT2,
        bright: Math.random() < (band ? 0.14 : 0.08),
      };
    }

    /** Вертикаль точки: слева широко, в горле почти ноль, справа снова веером. */
    function yAt(p, t) {
      const waist = 0.63;
      const d = Math.abs(t - waist);
      const k = t < waist ? 1 : 0.72;                       // справа веер мягче
      const spread = mode.waist + Math.pow(d / waist, 1.6) * 0.46 * k;
      const wave = Math.sin(t * 5.4 + p.lane * 3.3) * 0.015;
      return h * (0.5 + p.lane * spread + wave);
    }

    function resize() {
      const box = host.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = Math.max(320, box.width);
      h = Math.max(120, box.height);
      host.width = Math.round(w * dpr);
      host.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const base = band ? w / 4.2 : w / 6;
      parts = Array.from({ length: Math.round(Math.min(340, Math.max(70, base)) * mode.n) }, () => spawn(true));
      for (const p of parts) { p.y = yAt(p, p.x / w); p.py = p.y; }
    }

    function step() {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.x += p.v;
        if (p.x > w + 50) Object.assign(p, spawn(false));
        const t = Math.max(0, Math.min(1, p.x / w));
        p.py = p.y;
        p.y = yAt(p, t);

        if (band) {                                          // курсор расталкивает поток
          const dx = p.x - mouse.x; const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 16000) {
            const f = (16000 - d2) / 16000;
            p.x += dx * f * 0.06;
            p.y += dy * f * 0.18;
          }
        }

        const fade = t < 0.07 ? t / 0.07 : t > 0.92 ? (1 - t) / 0.08 : 1;
        const al = p.a * fade * (p.bright ? 1 : 0.75);
        ctx.strokeStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${al * 0.9})`;
        ctx.lineWidth = p.r;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x - p.v * (band ? 18 : 12), p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        if (p.bright) {
          ctx.fillStyle = `rgba(${p.c[0]},${p.c[1]},${p.c[2]},${al})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 1.6, 0, 6.3);
          ctx.fill();
        }
      }
      if (running) raf = requestAnimationFrame(step);
    }

    function play(on) {
      const next = on && !reduced && !document.hidden;
      if (next === running) return;
      running = next;
      if (running) raf = requestAnimationFrame(step);
      else cancelAnimationFrame(raf);
    }

    resize();
    if (reduced) { step(); return; }

    addEventListener('resize', () => { resize(); if (!running) step(); }, { passive: true });
    document.addEventListener('visibilitychange', () => play(visible));
    if (band) {
      host.parentElement.addEventListener('pointermove', (e) => {
        const box = host.getBoundingClientRect();
        mouse = { x: e.clientX - box.left, y: e.clientY - box.top };
      }, { passive: true });
      host.parentElement.addEventListener('pointerleave', () => { mouse = { x: -999, y: -999 }; });
    }
    new IntersectionObserver((rows) => { visible = rows[0].isIntersecting; play(visible); }, { threshold: 0 }).observe(host);
    play(true);
  }

  document.querySelectorAll('canvas.stream').forEach(start);
})();
