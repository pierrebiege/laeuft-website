// Graatzug — Interaktion. Kein Framework, nichts, was ohne JS fehlen würde.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ---------- Nav ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal ---------- */
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- Hero: 1910 blendet über ins Heute ---------- */
  const hero = $('#hero'), heroSticky = $('.hero-sticky'), yearEl = $('#heroYear'), capEl = $('#heroCap');
  if (hero && heroSticky) {
    const paint = () => {
      const r = hero.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = calm ? 1 : Math.min(1, Math.max(0, -r.top / (total * 0.7)));
      heroSticky.style.setProperty('--p', p.toFixed(3));
      yearEl.textContent = String(Math.round(1910 + p * (2027 - 1910)));
      capEl.style.opacity = p < 0.4 ? '1' : '0';
    };
    addEventListener('scroll', paint, { passive: true });
    paint();
  }

  /* ---------- Statement: Wort für Wort ---------- */
  const bw = $('#bigWords');
  if (bw) {
    bw.innerHTML = bw.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span> `).join('');
    const words = $$('.w', bw);
    const paint = () => {
      const r = bw.getBoundingClientRect();
      const vh = innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', calm || i < n));
    };
    addEventListener('scroll', paint, { passive: true });
    paint();
  }

  /* ---------- Zähler ---------- */
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  const cio = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, to = +el.dataset.to;
      if (calm) { el.textContent = fmt(to); return; }
      const t0 = performance.now(), dur = 1800;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 4)));
        el.textContent = fmt(v);
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  $$('.count').forEach((el) => cio.observe(el));

  /* ---------- 3D-Runde: Scrollfortschritt an die Szene ---------- */
  const stage = $('#courseStage'), frame = $('#terrain'), hudKm = $('#hudKm');
  let rev = 0;
  const sendRev = () => {
    if (!stage || !frame) return;
    const r = stage.getBoundingClientRect();
    const total = r.height - innerHeight * 0.6;
    const p = total > 0 ? Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / total)) : 1;
    const eff = matchMedia('(max-width: 700px)').matches ? 1 : p;
    if (Math.abs(eff - rev) > 0.001 || eff === 1 || eff === 0) {
      rev = eff;
      frame.contentWindow?.postMessage({ rev }, '*');
      hudKm.textContent = (rev * 6.7056).toFixed(2).replace('.', ',');
    }
  };
  addEventListener('scroll', sendRev, { passive: true });
  addEventListener('message', (e) => { if (e.data?.sceneReady) sendRev(); });
  if (frame) {
    new IntersectionObserver(([e]) => frame.contentWindow?.postMessage({ visible: e.isIntersecting }, '*'))
      .observe(frame);
  }
  // Auf dem Handy wird die Runde beim ersten Sichtkontakt einmal gezeichnet.
  if (matchMedia('(max-width: 700px)').matches && frame) {
    new IntersectionObserver(([e], o) => { if (e.isIntersecting) { sendRev(); o.disconnect(); } }, { threshold: 0.4 }).observe(frame);
  }

  /* ---------- Höhenprofil ---------- */
  const P = window.GS_PROFILE, svg = $('#profile'), tip = $('#profileTip');
  if (P && svg) {
    const W = 1000, H = 240, pad = 10;
    const lo = P.min - 20, hi = P.max + 20, L = P.pts[P.pts.length - 1][0];
    const x = (d) => (d / L) * W, y = (e) => H - pad - ((e - lo) / (hi - lo)) * (H - pad * 2);
    const line = P.pts.map(([d, e], i) => `${i ? 'L' : 'M'}${x(d).toFixed(1)},${y(e).toFixed(1)}`).join('');
    const grid = [1850, 1900, 1950].map((e) => `<line class="grid" x1="0" x2="${W}" y1="${y(e)}" y2="${y(e)}"/>`).join('');
    svg.innerHTML = `
      <defs><linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ff5a1f" stop-opacity=".35"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/>
      </linearGradient></defs>
      ${grid}
      <path class="area" d="${line}L${W},${H}L0,${H}Z"/>
      <path class="line" d="${line}"/>
      <line class="cursor" id="profCursor" x1="0" x2="0" y1="0" y2="${H}" visible="hidden" style="display:none"/>`;
    const cur = $('#profCursor');
    const axis = document.createElement('div');
    axis.className = 'profile-axis mono';
    axis.innerHTML = ['0', '1', '2', '3', '4', '5', '6', '6,7 km'].map((t) => `<span>${t}</span>`).join('');
    svg.parentElement.after(axis);
    const move = (clientX) => {
      const r = svg.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const d = f * L;
      const p = P.pts.reduce((a, b) => (Math.abs(b[0] - d) < Math.abs(a[0] - d) ? b : a));
      cur.setAttribute('x1', x(p[0])); cur.setAttribute('x2', x(p[0])); cur.style.display = '';
      tip.hidden = false;
      tip.style.left = `${(p[0] / L) * 100}%`;
      tip.textContent = `${(p[0] / 1000).toFixed(2).replace('.', ',')} km · ${fmt(p[1])} m`;
    };
    svg.addEventListener('pointermove', (e) => move(e.clientX));
    svg.addEventListener('pointerleave', () => { tip.hidden = true; cur.style.display = 'none'; });
  }

  /* ---------- Galerie: mit der Maus ziehen ---------- */
  $$('.gallery, .timeline, .tales, .history').forEach((g) => {
    let down = false, sx = 0, sl = 0;
    g.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = g.scrollLeft; g.style.cursor = 'grabbing'; });
    addEventListener('pointerup', () => { down = false; g.style.cursor = ''; });
    g.addEventListener('pointermove', (e) => { if (down) g.scrollLeft = sl - (e.clientX - sx); });
  });

  /* ---------- Sagen-Karussell ---------- */
  const tales = $('#tales');
  $$('.tn').forEach((btn) => btn.addEventListener('click', () => {
    const card = $('.tale', tales);
    tales.scrollBy({ left: (+btn.dataset.dir) * (card.getBoundingClientRect().width + 16), behavior: 'smooth' });
  }));

  /* ---------- Lotterie ---------- */
  const lot = $('#lottery'), lotMsg = $('#lotMsg');
  lot?.addEventListener('submit', async (e) => {
    e.preventDefault();
    $$('.bad', lot).forEach((el) => el.classList.remove('bad'));
    const missing = $$('[required]', lot).filter((el) => el.type === 'radio' ? !lot.querySelector(`[name="${el.name}"]:checked`) : el.type === 'checkbox' ? !el.checked : !el.value.trim());
    if (missing.length) {
      missing.forEach((el) => (el.type === 'radio' ? el.closest('.chips') : el).classList.add('bad'));
      lotMsg.className = 'form-msg';
      lotMsg.textContent = 'Bitte füll alle Pflichtfelder aus.';
      missing[0].focus?.();
      return;
    }
    const data = Object.fromEntries(new FormData(lot).entries());
    const btn = $('button[type=submit]', lot);
    btn.disabled = true; btn.textContent = 'Moment …';
    try {
      const r = await fetch('/api/graatzug/lotterie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Das hat nicht geklappt.');
      lot.reset();
      lotMsg.className = 'form-msg ok';
      lotMsg.textContent = `Du bist im Lostopf, ${data.vorname}. Eine Bestätigung ist unterwegs an ${data.email}.`;
      btn.textContent = 'Im Lostopf ✓';
    } catch (err) {
      lotMsg.className = 'form-msg';
      lotMsg.textContent = err.message;
      btn.disabled = false; btn.textContent = 'In den Lostopf';
    }
  });
})();
