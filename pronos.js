/* PronoStats – onglet « Pronos » : sélections du modèle Poisson, version ludique */
(function () {
  const CSS = `
.rk{display:flex;gap:8px;overflow-x:auto;margin:0 -16px;padding:4px 16px 2px;scrollbar-width:none}
.rk::-webkit-scrollbar{display:none}
.rkb{flex:1 0 auto;padding:9px 12px;border-radius:14px;background:var(--surface);border:1px solid var(--line);color:var(--muted);font-weight:600;font-size:13.5px;white-space:nowrap}
.rkb small{display:block;font-weight:500;font-size:11px;opacity:.8}
.rkb.on{border-color:var(--gold);background:var(--gold-dim);color:var(--gold2)}
.hero{position:relative;overflow:hidden;background:radial-gradient(120% 90% at 85% 0%,rgba(212,175,55,.22),transparent 55%),linear-gradient(160deg,#1B2643,#0F1729);border:1px solid rgba(212,175,55,.45);border-radius:20px;padding:16px;display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;cursor:pointer}
.hero .tagline{font:700 12px Barlow;letter-spacing:1.4px;text-transform:uppercase;color:var(--gold)}
.hero .sel{font:700 26px/1.05 "Barlow Condensed",sans-serif;margin:6px 0 4px}
.hero .mt{color:var(--muted);font-size:13.5px}
.hero .odds{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
.pill{font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;background:rgba(255,255,255,.06);color:var(--text)}
.pill.g{background:var(--gold-dim);color:var(--gold2)}
.ring{--v:0;width:92px;height:92px;border-radius:50%;display:grid;place-items:center;
  background:conic-gradient(var(--gold2) calc(var(--v)*1%),rgba(255,255,255,.08) 0);position:relative}
.ring::before{content:"";position:absolute;inset:8px;border-radius:50%;background:#111A2E}
.ring b{position:relative;font:700 26px "Barlow Condensed",sans-serif;color:var(--gold2)}
.ring b small{font-size:14px}
.ring.sm{width:52px;height:52px}.ring.sm::before{inset:5px}.ring.sm b{font-size:16px}.ring.sm b small{font-size:10px}
.combo{background:var(--surface);border:1px dashed rgba(212,175,55,.5);border-radius:18px;padding:14px}
.combo h4{font:700 19px "Barlow Condensed",sans-serif;display:flex;justify-content:space-between;align-items:center}
.combo h4 span{font:600 13px Barlow;color:var(--muted)}
.cleg{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)}
.cleg:last-of-type{border-bottom:0}
.cleg i{font-style:normal;width:26px;height:26px;border-radius:8px;display:grid;place-items:center;background:var(--gold-dim);color:var(--gold2);font:700 14px "Barlow Condensed",sans-serif}
.cleg .s{font-weight:600}.cleg .m{color:var(--muted);font-size:12.5px}
.cleg .p{font:700 16px "Barlow Condensed",sans-serif;color:var(--gold2);white-space:nowrap}
.ctot{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:10px}
.ctot div{background:var(--bg);border-radius:12px;padding:8px 10px}
.ctot small{display:block;color:var(--muted);font-size:11.5px}
.ctot b{font:700 20px "Barlow Condensed",sans-serif}
.ghost{width:100%;margin-top:10px;padding:11px;border-radius:12px;border:1px solid rgba(212,175,55,.45);color:var(--gold);font-weight:600}
.pk{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;cursor:pointer;padding:12px 14px}
.pk .md{font-size:22px;width:30px;text-align:center}
.pk .md.n{font:700 15px "Barlow Condensed",sans-serif;color:var(--muted)}
.pk .s{font:700 17px/1.1 "Barlow Condensed",sans-serif}
.pk .m{color:var(--muted);font-size:12.5px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pk .w{font-size:11px;color:#E0A458;margin-top:2px}
.bar{height:5px;border-radius:3px;background:var(--surface2);margin-top:7px;overflow:hidden}
.bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,var(--gold),var(--gold2))}
.mk{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:9px 0;border-bottom:1px solid var(--line);cursor:pointer}
.mk.on{background:var(--gold-dim);margin:0 -10px;padding:9px 10px;border-radius:10px;border-bottom-color:transparent}
.mk .l{font-size:14px}.mk .v{font:700 16px "Barlow Condensed",sans-serif;text-align:right}
.mk .bar{grid-column:1/-1;margin-top:3px}
.xg{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:4px 0 12px}
.xg div{text-align:center}.xg b{font:700 30px "Barlow Condensed",sans-serif;color:var(--gold2);display:block}
.xg small{color:var(--muted);font-size:11.5px}
.xg .sc{background:var(--bg);border-radius:12px;padding:8px 12px}
.verdict{margin-top:10px;padding:12px;border-radius:12px;font-weight:600;text-align:center}
.verdict.ok{background:rgba(63,191,127,.14);color:var(--win)}
.verdict.no{background:rgba(226,98,94,.12);color:var(--loss)}
.verdict.warn{background:rgba(224,164,88,.14);color:#E0A458}
.disc{color:var(--muted);font-size:11.5px;text-align:center;margin:18px 6px 0;line-height:1.5}
.secth{display:flex;justify-content:space-between;align-items:baseline}
.secth small{color:var(--muted);font:500 12px Barlow;text-transform:none;letter-spacing:0}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  const NIVEAUX = [
    { id: 'sur', nom: '🛡️ Sûr', sous: '75 % et +', min: 0.75, max: 1.01 },
    { id: 'equi', nom: '⚖️ Équilibré', sous: '60 – 75 %', min: 0.60, max: 0.75 },
    { id: 'audace', nom: '🔥 Audacieux', sous: '45 – 60 %', min: 0.45, max: 0.60 },
  ];
  const LIB = {
    'Over 1,5 match': '+1,5 but', 'Over 2,5 match': '+2,5 buts', 'Over 3,5 match': '+3,5 buts',
    'Domicile Over 0,5': '{D} marque', 'Domicile Over 1,5': '{D} +1,5 but', 'Domicile Over 2,5': '{D} +2,5 buts',
    'Extérieur Over 0,5': '{E} marque', 'Extérieur Over 1,5': '{E} +1,5 but', 'Extérieur Over 2,5': '{E} +2,5 buts',
    'Les deux équipes marquent – Oui': 'Les 2 marquent', 'Les deux équipes marquent – Non': 'Les 2 ne marquent pas',
    'Victoire domicile (1)': 'Victoire {D}', 'Match nul (N)': 'Match nul', 'Victoire extérieur (2)': 'Victoire {E}',
    'Double chance 1N': '{D} ou nul', 'Double chance N2': '{E} ou nul', 'Double chance 12': 'Pas de nul',
  };
  const TYPE = m => /^Over|Over/.test(m) ? 'Plus/Moins buts' : /deux équipes/.test(m) ? 'Les deux marquent'
    : /Double chance/.test(m) ? 'Double chance' : '1N2';
  const MARGE = 0.05, SUSPECT = 0.25;
  let niveau = 'sur', compP = 'Tous', jourP = 'auj';
  const JOURS = [{ id: 'auj', nom: "📅 Aujourd'hui", d: 0 }, { id: 'dem', nom: '⏭️ Demain', d: 1 }, { id: 'sem', nom: '🗓️ 7 jours', d: null }];
  try { niveau = localStorage.getItem('ps_niveau') || 'sur'; } catch (e) {}

  const lib = (m, x) => (LIB[m] || m).replace('{D}', x.dom).replace('{E}', x.ext);
  const pct = p => Math.round(p * 100);
  const cote = p => (1 / p).toFixed(2).replace('.', ',');
  const coteMin = p => (1 / p * (1 + MARGE)).toFixed(2).replace('.', ',');
  const ring = (p, sm) => `<div class="ring ${sm ? 'sm' : ''}" style="--v:${pct(p)}"><b>${pct(p)}<small>%</small></b></div>`;
  const faible = x => /faible/i.test(x.fiab);
  const futurs = () => (D.pronos || []).filter(x => new Date(x.date) > new Date());
  const ecartJour = iso => { const a = new Date(iso), b = new Date(); a.setHours(0, 0, 0, 0); b.setHours(0, 0, 0, 0); return Math.round((a - b) / 864e5); };
  const duJour = () => { const j = JOURS.find(x => x.id === jourP); return futurs().filter(x => j.d == null || ecartJour(x.date) === j.d); };
  const listeCourante = () => duJour().filter(x => compP === 'Tous' || x.comp === compP);

  /** Meilleure sélection de chaque match dans la fourchette du niveau choisi. */
  function selections(nv, liste) {
    const out = [];
    liste.forEach((x, i) => {
      let best = null;
      Object.keys(x.p).forEach(m => {
        const p = x.p[m];
        if (p == null || p < nv.min || p >= nv.max) return;
        if (!best || p > best.p) best = { m: m, p: p };
      });
      if (best) out.push({ x: x, i: i, m: best.m, p: best.p });
    });
    return out.sort((a, b) => (faible(a.x) - faible(b.x)) || (b.p - a.p));
  }

  function vuePronos() {
    const jours = `<div class="rk">${JOURS.map(j => `<button class="rkb ${j.id === jourP ? 'on' : ''}" data-jour="${j.id}">${j.nom}<small>${j.d == null ? 'tous les matchs' : futurs().filter(x => ecartJour(x.date) === j.d).length + ' match(s)'}</small></button>`).join('')}</div>`;
    if (!futurs().length) return `<div class="empty">Pas encore de pronos.<br>Ils arrivent à la prochaine mise à jour (toutes les heures).</div>`;
    const tous = duJour();
    if (!tous.length) return jours + `<div class="empty">Aucun match ${jourP === 'auj' ? "aujourd'hui" : 'demain'} 😴<br>Regarde ${jourP === 'auj' ? 'demain' : 'les 7 prochains jours'} juste au-dessus.</div>`;
    const comps = [...new Set(tous.map(x => x.comp))];
    if (compP !== 'Tous' && !comps.includes(compP)) compP = 'Tous';
    const liste = tous.filter(x => compP === 'Tous' || x.comp === compP);
    const nv = NIVEAUX.find(n => n.id === niveau) || NIVEAUX[0];
    const sels = selections(nv, liste);
    const fiables = sels.filter(s => !faible(s.x));

    let h = jours + `<div class="rk" style="margin-top:8px">${NIVEAUX.map(n => `<button class="rkb ${n.id === nv.id ? 'on' : ''}" data-niv="${n.id}">${n.nom}<small>${n.sous}</small></button>`).join('')}</div>`;
    h += chips(comps, compP, 'pcomp');

    const banker = fiables[0] || sels[0];
    if (banker) {
      const x = banker.x;
      h += `<h2>${nv.id === 'sur' ? (jourP === 'auj' ? '🎯 Le banker du jour' : jourP === 'dem' ? '🎯 Le banker de demain' : '🎯 Le banker de la semaine') : nv.id === 'equi' ? '🎯 Le coup sûr… ou presque' : '🎯 Le coup de poker'}</h2>
      <div class="hero" data-pm="${banker.i}" data-pk="${esc(banker.m)}">
        <div><div class="tagline">${esc(x.comp)} · ${libJour(x.date)} ${heure(x.date)}</div>
          <div class="sel">${esc(lib(banker.m, x))}</div>
          <div class="mt">${esc(x.dom)} – ${esc(x.ext)}</div>
          <div class="odds"><span class="pill g">Cote juste ${cote(banker.p)}</span><span class="pill">Vise ≥ ${coteMin(banker.p)}</span>${faible(x) ? '<span class="pill">⚠ Peu de matchs</span>' : ''}</div>
        </div>${ring(banker.p)}</div>`;
    }

    const legs = []; const vus = new Set();
    for (const s of fiables) { if (vus.has(s.i)) continue; vus.add(s.i); legs.push(s); if (legs.length === 3) break; }
    if (legs.length >= 2) {
      const pt = legs.reduce((a, s) => a * s.p, 1);
      h += `<h2>🧩 Le combo ${jourP === 'auj' ? 'du jour' : jourP === 'dem' ? 'de demain' : 'de la semaine'}</h2><div class="combo">
        <h4>${legs.length} sélections <span>3 matchs différents</span></h4>
        ${legs.map((s, k) => `<div class="cleg" data-pm="${s.i}" data-pk="${esc(s.m)}"><i>${k + 1}</i>
          <div><div class="s">${esc(lib(s.m, s.x))}</div><div class="m">${esc(s.x.dom)} – ${esc(s.x.ext)} · ${heure(s.x.date)}</div></div>
          <span class="p">${pct(s.p)} %</span></div>`).join('')}
        <div class="ctot"><div><small>Chances (théoriques)</small><b>${pct(pt)} %</b></div><div><small>Cote juste du combo</small><b>${cote(pt)}</b></div></div>
        <button class="ghost" data-combo="1">+ Suivre ce combo dans Mes paris</button></div>`;
    }

    h += `<h2 class="secth">🏆 Classement des sélections <small>${sels.length} match${sels.length > 1 ? 's' : ''}</small></h2>`;
    if (!sels.length) h += `<div class="empty">Aucune sélection dans cette fourchette.<br>Essaie un autre niveau de risque.</div>`;
    else h += `<div class="card group">${sels.slice(0, 30).map((s, k) => `
      <div class="pk" data-pm="${s.i}" data-pk="${esc(s.m)}" style="${k ? 'border-top:1px solid var(--line)' : ''}">
        <span class="md ${k > 2 ? 'n' : ''}">${['🥇', '🥈', '🥉'][k] || '#' + (k + 1)}</span>
        <div style="min-width:0"><div class="s">${esc(lib(s.m, s.x))}</div>
          <div class="m">${esc(s.x.dom)} – ${esc(s.x.ext)} · ${libJour(s.x.date)} ${heure(s.x.date)}</div>
          ${faible(s.x) ? '<div class="w">⚠ Échantillon faible</div>' : ''}
          <div class="bar"><i style="width:${pct(s.p)}%"></i></div></div>
        ${ring(s.p, true)}</div>`).join('')}</div>`;
    h += `<p class="disc">Probabilités estimées par le même modèle que ton tableau (loi de Poisson, non calibré).<br>Ce sont des tendances, pas des certitudes : une sélection n'a de valeur que si la cote dépasse la « cote juste ».</p>`;
    return h;
  }

  /* ---------- Fiche match ---------- */
  function ficheMatch(x, focus) {
    const ordre = Object.keys(x.p).sort((a, b) => x.p[b] - x.p[a]);
    focus = focus || ordre[0];
    ouvrir(`<h3>${esc(x.dom)} – ${esc(x.ext)}</h3>
      <div style="color:var(--muted);margin:-8px 0 12px;font-size:13px">${esc(x.comp)} · ${libJour(x.date)} ${heure(x.date)} ${faible(x) ? '· ⚠ peu de matchs' : ''}</div>
      <div class="xg"><div><b>${fmt(x.lD && +x.lD.toFixed(2))}</b><small>buts attendus<br>${esc(x.dom)}</small></div>
        <div class="sc"><small>Score le + probable</small><b style="font-size:24px">${esc(x.score)}</b></div>
        <div><b>${fmt(x.lE && +x.lE.toFixed(2))}</b><small>buts attendus<br>${esc(x.ext)}</small></div></div>
      <label>Tester une cote · ${esc(lib(focus, x))} (${pct(x.p[focus])} %)</label>
      <div class="row2"><input id="vCote" type="number" inputmode="decimal" step="0.01" min="1.01" placeholder="Cote du bookmaker">
        <button class="primary" style="margin:0" id="vAdd">+ Mes paris</button></div>
      <div id="vRes"></div>
      <label style="margin-top:16px">Tous les marchés (touche pour tester)</label>
      <div>${ordre.map(m => `<div class="mk ${m === focus ? 'on' : ''}" data-mk="${esc(m)}"><span class="l">${esc(lib(m, x))}</span>
        <span class="v">${pct(x.p[m])} % <small style="color:var(--muted);font:500 11.5px Barlow">· ${cote(x.p[m])}</small></span>
        <div class="bar"><i style="width:${pct(x.p[m])}%"></i></div></div>`).join('')}</div>`);
    const sh = $('#sheet');
    const test = () => {
      const c = parseFloat(String($('#vCote').value).replace(',', '.')), p = x.p[focus], r = $('#vRes');
      if (!(c > 1)) { r.innerHTML = ''; return; }
      const ev = p * c - 1;
      r.innerHTML = ev > SUSPECT ? `<div class="verdict warn">⚠️ Écart très élevé (+${Math.round(ev * 100)} %) : vérifie la saisie, le bookmaker sait souvent quelque chose que le modèle ignore.</div>`
        : ev > MARGE ? `<div class="verdict ok">✅ Valeur positive : +${Math.round(ev * 100)} % d'espérance selon le modèle</div>`
        : `<div class="verdict no">❌ Pas de valeur : il faudrait une cote ≥ ${coteMin(p)}</div>`;
    };
    $('#vCote').oninput = test;
    sh.querySelectorAll('[data-mk]').forEach(el => el.onclick = () => ficheMatch(x, el.dataset.mk));
    $('#vAdd').onclick = () => {
      const c = $('#vCote').value;
      fermer(); formPari(x.dom + ' - ' + x.ext);
      $('#pType').value = TYPE(focus);
      if (c) { $('#pCote').value = c; $('#pCote').dispatchEvent(new Event('input')); }
      const lab = document.createElement('div'); lab.className = 'gain';
      lab.innerHTML = `<span>Sélection</span><b style="font-size:15px">${esc(lib(focus, x))}</b>`;
      $('#fPari').insertBefore(lab, $('#fPari').firstChild);
    };
  }

  /* ---------- Intégration à l'appli ---------- */
  const nav = $('#tabs');
  nav.style.gridTemplateColumns = 'repeat(5,1fr)';
  const b = document.createElement('button');
  b.dataset.tab = 'pronos';
  b.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></svg><span>Pronos</span>`;
  nav.insertBefore(b, nav.firstChild);

  const rendreBase = rendre;
  rendre = function () {
    if (tab !== 'pronos') return rendreBase();
    if (!D) return;
    $('#maj').textContent = D.maj || '';
    $('#fab').hidden = true;
    $('#view').innerHTML = vuePronos();
  };

  $('#view').addEventListener('click', e => {
    if (tab !== 'pronos') return;
    const n = e.target.closest('[data-niv]');
    if (n) { niveau = n.dataset.niv; try { localStorage.setItem('ps_niveau', niveau); } catch (er) {} rendre(); return; }
    const jr = e.target.closest('[data-jour]');
    if (jr) { jourP = jr.dataset.jour; compP = 'Tous'; rendre(); return; }
    const c = e.target.closest('[data-pcomp]');
    if (c) { compP = c.dataset.pcomp; rendre(); return; }
    if (e.target.closest('[data-combo]')) {
      const legs = [...$('#view').querySelectorAll('.cleg')].map(el => {
        const x = listeCourante()[+el.dataset.pm];
        return { x: x, m: el.dataset.pk };
      });
      formPari('Combo : ' + legs.map(l => lib(l.m, l.x)).join(' + '));
      $('#pType').value = 'Combiné';
      return;
    }
    const pm = e.target.closest('[data-pm]');
    if (pm) {
      ficheMatch(listeCourante()[+pm.dataset.pm], pm.dataset.pk);
    }
  });

  tab = 'pronos';
  majTabs();
})();
