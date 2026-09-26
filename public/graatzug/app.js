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
  // Die 3D-Szene (Gelände, Satellitenbild, three.js) erst laden, wenn man
  // in ihre Nähe scrollt. Sonst bremst sie den Seitenaufbau.
  if (frame?.dataset.src) {
    new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return;
      frame.src = frame.dataset.src; o.disconnect();
    }, { rootMargin: '600px 0px' }).observe(frame);
  }
  let rev = 0;
  const mobile = () => matchMedia('(max-width: 700px)').matches;
  const post = (v) => {
    rev = v;
    frame?.contentWindow?.postMessage({ rev: v }, '*');
    if (hudKm) hudKm.textContent = (v * 6.7056).toFixed(2).replace('.', ',');
  };
  // Desktop: die Runde zeichnet sich mit dem Scrollen.
  const sendRev = () => {
    if (!stage || !frame) return;
    const r = stage.getBoundingClientRect();
    const total = r.height - innerHeight * 0.6;
    const p = total > 0 ? Math.min(1, Math.max(0, (innerHeight * 0.35 - r.top) / total)) : 1;
    if (Math.abs(p - rev) > 0.001 || p === 1 || p === 0) post(p);
  };
  addEventListener('scroll', sendRev, { passive: true });
  // Handy: kein Sticky-Scrollen, also spielt die Runde von selbst ab,
  // sobald die Karte sichtbar ist, und beginnt beim nächsten Mal von vorn.
  let ready = false, inView = false, anim = 0;
  const play = () => {
    cancelAnimationFrame(anim);
    if (calm) { post(1); return; }
    const t0 = performance.now(), dur = 9000;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      post(k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
      if (k < 1 && inView) anim = requestAnimationFrame(step);
    };
    post(0);
    anim = requestAnimationFrame(step);
  };
  // Die Szene meldet sich per Nachricht. Kommt die vor diesem Skript an,
  // geht sie verloren, deshalb wird zusätzlich nachgefragt.
  const onReady = () => {
    if (ready) return;
    ready = true;
    sendRev();
  };
  addEventListener('message', (e) => { if (e.data?.sceneReady) onReady(); });
  const poll = setInterval(() => {
    try { if (frame?.contentWindow?.sceneState?.().ready) { clearInterval(poll); onReady(); } } catch (_) {}
  }, 300);
  if (frame) {
    new IntersectionObserver(([e]) => {
      frame.contentWindow?.postMessage({ visible: e.isIntersecting }, '*');
      const was = inView; inView = e.intersectionRatio >= 0.35;

    }, { threshold: [0, 0.35] }).observe(frame);
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

/* ---------- Anmelde-Wizard ---------- */
(() => {
  const back = document.getElementById('wizard');
  if (!back) return;
  const form = document.getElementById('wzForm');
  const steps = [...form.querySelectorAll('.wz-s')];
  const bar = document.getElementById('wzBar'), err = document.getElementById('wzErr');
  const next = document.getElementById('wzNext'), prev = document.getElementById('wzBack'), nav = document.getElementById('wzNav');
  const chips = [...back.querySelectorAll('.wz-steps li')];
  const LAST = 3;
  let cur = 0, busy = false;

  const show = (i) => {
    cur = i;
    steps.forEach((s, j) => (s.hidden = j !== i));
    chips.forEach((c, j) => { c.classList.toggle('on', j === i); c.classList.toggle('done', j < i); });
    bar.style.width = `${Math.min(100, (i / LAST) * 100)}%`;
    prev.style.visibility = i === 0 ? 'hidden' : 'visible';
    next.textContent = i === LAST ? 'In den Lostopf' : 'Weiter';
    nav.hidden = i > LAST;
    err.textContent = '';
    if (i === LAST) summary();
    steps[i].querySelector('input:not([type=hidden]):not([tabindex="-1"]), select, textarea')?.focus({ preventScroll: true });
  };
  const open = () => { back.hidden = false; document.body.style.overflow = 'hidden'; if (cur > LAST) { form.reset(); show(0); } else show(cur); };
  const close = () => { back.hidden = true; document.body.style.overflow = ''; if (location.hash === '#anmelden') history.replaceState(null, '', location.pathname); };

  document.querySelectorAll('[data-open-wizard]').forEach((b) => b.addEventListener('click', open));
  back.querySelectorAll('[data-close-wizard]').forEach((b) => b.addEventListener('click', close));
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !back.hidden) close(); });
  if (location.hash === '#anmelden' || location.hash === '#lotterie') open();
  addEventListener('hashchange', () => { if (location.hash === '#anmelden') open(); });

  const valid = (i) => {
    const s = steps[i];
    s.querySelectorAll('.bad').forEach((el) => el.classList.remove('bad'));
    const miss = [...s.querySelectorAll('[required]')].filter((el) =>
      el.type === 'radio' ? !form.querySelector(`[name="${el.name}"]:checked`) : el.type === 'checkbox' ? !el.checked : !el.value.trim());
    const email = s.querySelector('[name=email]');
    if (email && email.value && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email.value.trim())) miss.push(email);
    const num = (n, a, b) => { const el = s.querySelector(`[name=${n}]`); if (el && el.value.trim() && !(+el.value >= a && +el.value <= b)) miss.push(el); };
    num('geburtsjahr', 1930, 2009); num('bestleistung', 0, 200); num('zielrunden', 1, 200);
    if (!miss.length) return true;
    miss.forEach((el) => (el.type === 'radio' ? el.closest('.chips') : el.type === 'checkbox' ? el.closest('.check') : el).classList.add('bad'));
    err.textContent = 'Bitte prüf die markierten Felder.';
    return false;
  };
  const summary = () => {
    const d = Object.fromEntries(new FormData(form));
    const esc = (t) => String(t || '–').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const anz = d.anzahl_backyards === '0' ? 'noch keins' : d.anzahl_backyards;
    document.getElementById('wzSum').innerHTML = `<dl>
      <div><dt>Name</dt><dd>${esc(d.vorname)} ${esc(d.nachname)}</dd></div>
      <div><dt>Kontakt</dt><dd>${esc(d.email)} · ${esc(d.telefon)}</dd></div>
      <div><dt>Jahrgang, Wohnort</dt><dd>${esc(d.geburtsjahr)} · ${esc(d.wohnort)}, ${esc(d.land)}</dd></div>
      <div><dt>Backyards bisher</dt><dd>${esc(anz)}, längstes ${esc(d.bestleistung)} Runden</dd></div>
      <div><dt>Ziel</dt><dd>${esc(d.zielrunden)} Runden</dd></div></dl>`;
  };
  prev.addEventListener('click', () => show(Math.max(0, cur - 1)));
  next.addEventListener('click', async () => {
    if (!valid(cur)) return;
    if (cur < LAST) return show(cur + 1);
    if (busy) return;
    busy = true; next.disabled = true; next.textContent = 'Moment …';
    const data = Object.fromEntries(new FormData(form));
    try {
      const r = await fetch('/api/graatzug/lotterie', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Das hat nicht geklappt. Versuch es nochmal.');
      document.getElementById('wzDoneText').textContent = `Danke, ${data.vorname}. Die Bestätigung ist unterwegs an ${data.email}. Nach Anmeldeschluss losen wir die Startplätze aus und melden uns bei allen.`;
      show(LAST + 1);
    } catch (e) {
      err.textContent = e.message;
      next.textContent = 'In den Lostopf';
    } finally { busy = false; next.disabled = false; }
  });
  form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); next.click(); } });
})();
