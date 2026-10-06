/*
 * Плюшевая фактура на кнопках — тот же язык, что и в полосе «поток».
 *
 * Буквы из пушинок красивы только на большом кегле: на кнопке в 15 пикселей
 * они превратились бы в кашу. Поэтому текст остаётся чётким, а из пушинок
 * собирается сама кнопка: точки слетаются в её форму, потом тихо дышат,
 * а при наведении рассыпаются и собираются заново.
 *
 * Разметка: <a class="btn" data-plush>…</a>
 */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nodes = document.querySelectorAll('[data-plush]');
  if (!nodes.length || reduced) return;

  /** Мягкая пушинка — один раз в маленький холст, дальше копируем. */
  function fluff(rgb, a) {
    const S = 40;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    grad.addColorStop(0, `rgba(${rgb},${a})`);
    grad.addColorStop(0.45, `rgba(${rgb},${a * 0.5})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, S, S);
    return c;
  }

  function start(btn) {
    const light = btn.classList.contains('btn--ghost');
    const sprite = fluff(light ? '99,86,200' : '255,255,255', light ? 0.3 : 0.42);
    const cv = document.createElement('canvas');
    cv.className = 'plush';
    cv.setAttribute('aria-hidden', 'true');
    btn.insertBefore(cv, btn.firstChild);
    const ctx = cv.getContext('2d');

    let w = 0; let h = 0; let pts = []; let raf = 0; let running = false;
    let scatter = 0;                       // 1 — только что рассыпали

    function build() {
      const box = btn.getBoundingClientRect();
      if (!box.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = box.width; h = box.height;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(46, Math.max(14, w / 6.5)));
      pts = Array.from({ length: n }, () => {
        const tx = 6 + Math.random() * (w - 12);
        const ty = 5 + Math.random() * (h - 10);
        return { tx, ty, x: tx, y: ty, s: 16 + Math.random() * 16, ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 0.8 };
      });
    }

    function frame(now) {
      ctx.clearRect(0, 0, w, h);
      scatter *= 0.94;
      for (const p of pts) {
        const bx = Math.sin(now / 1200 * p.sp + p.ph) * 2.2;
        const by = Math.cos(now / 1500 * p.sp + p.ph) * 1.6;
        const sx = Math.sin(p.ph * 7) * 26 * scatter;
        const sy = Math.cos(p.ph * 5) * 14 * scatter;
        p.x += (p.tx + bx + sx - p.x) * 0.09;
        p.y += (p.ty + by + sy - p.y) * 0.09;
        const s = p.s * (0.9 + 0.1 * Math.sin(now / 900 * p.sp + p.ph));
        ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s);
      }
      if (running) raf = requestAnimationFrame(frame);
    }

    function play(on) {
      const next = on && !document.hidden;
      if (next === running) return;
      running = next;
      if (running) raf = requestAnimationFrame(frame);
      else cancelAnimationFrame(raf);
    }

    build();
    if (!pts.length) return;
    btn.addEventListener('pointerenter', () => { scatter = 1; });
    addEventListener('resize', () => { build(); }, { passive: true });
    document.addEventListener('visibilitychange', () => play(!document.hidden));
    new IntersectionObserver((rows) => play(rows[0].isIntersecting), { threshold: 0 }).observe(btn);
    play(true);
  }

  // Шапку рисует app.js — он подключён выше и к этому моменту уже отработал.
  // Через requestAnimationFrame делать нельзя: во вкладке, открытой в фоне,
  // он не вызывается, и кнопки остались бы пустыми до переключения на неё.
  nodes.forEach(start);
})();
