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
.heros,.combos{display:grid;gap:12px}
.lvg{display:grid;gap:10px}
.lv{background:linear-gradient(160deg,#2A1420,#141B30);border:1px solid rgba(248,113,113,.45);border-radius:16px;padding:10px 14px;cursor:pointer}
.lvt{display:flex;justify-content:space-between;font-size:12px;color:var(--muted)}
.lvt .pt{color:#F87171;font-weight:700}.lvt .pt.mi{color:var(--gold2)}.lvt .pt.fin{color:var(--muted)}
.lvt .pt.on{animation:clign 1.6s infinite}@keyframes clign{50%{opacity:.45}}
.lvs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin:6px 0 2px}
.lvs .eq{font-weight:600;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.lvs .eq.r{text-align:right}
.lvs b{font:700 26px "Barlow Condensed",sans-serif;color:var(--gold2)}
.rc{color:#EF4444;font-style:normal;font-size:12px}
.lvp{font-size:12px;color:var(--muted)}.lvp b{color:var(--text)}
.lve{display:flex;flex-direction:column;gap:3px;font-size:12.5px;margin:6px 0 2px}.lve .r{text-align:right}
.md.hr{font:700 15px "Barlow Condensed",sans-serif;color:var(--gold2);min-width:44px;text-align:center}
.sepj{padding:8px 4px 6px;font:700 13px "Barlow Condensed",sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);border-top:1px solid var(--line)}
.sepj:first-child{border-top:0}
.sepj{grid-column:1/-1}
.bil-btn{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;margin:10px 0 2px;padding:12px 14px;border-radius:14px;background:linear-gradient(160deg,#1B2643,#0F1729);border:1px solid rgba(212,175,55,.35);color:var(--text);text-align:left}
.bil-btn b{color:var(--gold2);font:700 18px "Barlow Condensed",sans-serif}
.bil-btn small{display:block;color:var(--muted);font-size:12px}
.bk{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 4px}
.bk>div{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center}
.bk b{display:block;font:700 26px "Barlow Condensed",sans-serif;color:var(--gold2)}
.bk small{display:block;color:var(--muted);font-size:11.5px;line-height:1.3}
.bt{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px}
.bt th{color:var(--muted);font-weight:600;font-size:11.5px;text-align:right;padding:6px 4px;border-bottom:1px solid var(--line)}
.bt th:first-child,.bt td:first-child{text-align:left}
.bt td{padding:7px 4px;border-bottom:1px solid var(--line);text-align:right}
.bt .ok{color:#4ADE80}.bt .ko{color:#F87171}
.hi{display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);font-size:13px}
.hi .r{font-size:16px}.hi .m{color:var(--muted);font-size:12px}
.hi>div{flex:1;min-width:0}
.hero .rang{display:inline-block;margin-right:6px}
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

/* ---------- Tablette ---------- */
@media (min-width:700px){
  .lvg{grid-template-columns:repeat(auto-fit,minmax(300px,1fr))}
  .heros,.combos{grid-template-columns:repeat(auto-fit,minmax(320px,1fr))}
  main{max-width:1180px;padding:4px 24px 40px}
  #view{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:16px;align-items:start}
  #view>*{grid-column:1/-1}
  #view>article.card,#view>.card.pari{grid-column:auto}
  .card.group:has(> .pk),.card.group:has(> .res){display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}
  .card.group:has(> .pk)>.pk{border-top:0!important;border-bottom:1px solid var(--line)}
  .ghead{grid-column:1/-1}
  .res+.res{border-top:0}.res{border-bottom:1px solid var(--line)}
  .kpis{grid-template-columns:repeat(4,1fr)}.kpi.hero{grid-column:span 2}
  .hero .sel{font-size:32px}.ring{width:110px;height:110px}.ring b{font-size:30px}
  .rkb{flex:1 1 0}
  .veil{align-items:center}
  .sheet{max-width:560px;border-radius:22px;border:1px solid rgba(212,175,55,.35);max-height:86vh;padding-bottom:22px}
}
@media (min-width:1000px){
  #view{grid-template-columns:repeat(3,minmax(0,1fr))}
  body{padding-bottom:0;padding-left:96px}
  .tabs{top:0;bottom:0;right:auto;width:96px;height:100%;padding:0;grid-template-columns:none!important;grid-auto-rows:86px;align-content:center;border-top:0;border-right:1px solid var(--line)}
  .tabs button.on::before{top:auto;left:0;width:3px;height:30px;border-radius:0 3px 3px 0}
  .fab{bottom:28px;right:28px}
  #toast{bottom:28px}
  .kpis{grid-template-columns:repeat(6,1fr)}
}
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
  const TYPE = m => /^B:/.test(m) ? 'Buteur' : /^P:/.test(m) ? 'Autre' : /^Over|Over/.test(m) ? 'Plus/Moins buts' : /deux équipes/.test(m) ? 'Les deux marquent'
    : /Double chance/.test(m) ? 'Double chance' : '1N2';
  const MARGE = 0.05, SUSPECT = 0.25;
  let niveau = 'sur', compP = 'Tous', jourP = 'auj';
  const JOURS = [{ id: 'auj', nom: "📅 Aujourd'hui", d: 0 }, { id: 'dem', nom: '⏭️ Demain', d: 1 }, { id: 'sem', nom: '🗓️ 7 jours', d: null }];
  try { niveau = localStorage.getItem('ps_niveau') || 'sur'; } catch (e) {}

  const lib = (m, x) => /^B:/.test(m) ? m.slice(2) + ' buteur' : /^P:/.test(m) ? m.slice(2) + ' décisif (but ou passe)' : (LIB[m] || m).replace('{D}', x.dom).replace('{E}', x.ext);
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
  let triSel = 'heure';
  try { triSel = localStorage.getItem('ps_tri') || 'heure'; } catch (e) {}
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

  /** Buteurs probables : taux de buts du joueur × (buts attendus de son équipe / moyenne de l'équipe). */
  function joueursMatch(x) {
    const B = D.buteurs || [], out = [];
    [[x.dom, x.lD], [x.ext, x.lE]].forEach(([eq, lam]) => {
      const cl = (D.classements || []).find(c => c.comp === x.comp && c.equipe === eq);
      const moy = cl && cl.j ? cl.bp / cl.j : null;
      if (!lam || !moy) return;
      const f = lam / moy;
      B.filter(b => b.comp === x.comp && b.equipe === eq && b.matchs >= 3).forEach(b => {
        const pd = b.pd || 0;
        out.push({ joueur: b.joueur, equipe: eq, buts: b.buts, pd: pd, matchs: b.matchs, pen: b.pen,
          p: b.buts >= 2 ? 1 - Math.exp(-Math.min(1.5, (b.buts / b.matchs) * f)) : null,
          pdec: b.buts + pd >= 3 ? 1 - Math.exp(-Math.min(2, ((b.buts + pd) / b.matchs) * f)) : null });
      });
    });
    return out;
  }
  const buteursMatch = x => joueursMatch(x).filter(j => j.p != null).sort((a, b) => b.p - a.p);
  const decisifsMatch = x => joueursMatch(x).filter(j => j.pdec != null).sort((a, b) => b.pdec - a.pdec);
  const probas = x => { const o = Object.assign({}, x.p); joueursMatch(x).forEach(b => { if (b.p != null) o['B:' + b.joueur] = b.p; if (b.pdec != null) o['P:' + b.joueur] = b.pdec; }); return o; };

  function vuePronos() {
    const jours = `<div class="rk">${JOURS.map(j => `<button class="rkb ${j.id === jourP ? 'on' : ''}" data-jour="${j.id}">${j.nom}<small>${j.d == null ? 'tous les matchs' : futurs().filter(x => ecartJour(x.date) === j.d).length + ' match(s)'}</small></button>`).join('')}</div>`;
    if (!futurs().length) return `<div class="empty">Pas encore de pronos.<br>Ils arrivent à la prochaine mise à jour (toutes les heures).</div>`;
    const tous = duJour();
    if (!tous.length) return blocLive() + resumeBilan() + jours + `<div class="empty">Aucun match ${jourP === 'auj' ? "aujourd'hui" : 'demain'} 😴<br>Regarde ${jourP === 'auj' ? 'demain' : 'les 7 prochains jours'} juste au-dessus.</div>`;
    const comps = [...new Set(tous.map(x => x.comp))];
    if (compP !== 'Tous' && !comps.includes(compP)) compP = 'Tous';
    const liste = tous.filter(x => compP === 'Tous' || x.comp === compP);
    const nv = NIVEAUX.find(n => n.id === niveau) || NIVEAUX[0];
    const sels = selections(nv, liste);
    const fiables = sels.filter(s => !faible(s.x));

    let h = blocLive() + resumeBilan() + jours + `<div class="rk" style="margin-top:8px">${NIVEAUX.map(n => `<button class="rkb ${n.id === nv.id ? 'on' : ''}" data-niv="${n.id}">${n.nom}<small>${n.sous}</small></button>`).join('')}</div>`;
    h += chips(comps, compP, 'pcomp');

    const quand = jourP === 'auj' ? 'du jour' : jourP === 'dem' ? 'de demain' : 'de la semaine';
    // 3 bankers sur 3 matchs différents (les fiables d'abord)
    const bankers = [], vusB = new Set();
    for (const s of [...fiables, ...sels.filter(x => faible(x.x))]) { if (vusB.has(s.i)) continue; vusB.add(s.i); bankers.push(s); if (bankers.length === 3) break; }
    if (bankers.length) {
      h += `<h2>${nv.id === 'sur' ? '🎯 Les bankers ' + quand : nv.id === 'equi' ? '🎯 Les coups sûrs… ou presque' : '🎯 Les coups de poker'}</h2><div class="heros">`;
      bankers.forEach((bk, k) => {
        const x = bk.x;
        h += `<div class="hero" data-pm="${bk.i}" data-pk="${esc(bk.m)}">
        <div><div class="tagline"><span class="rang">${['🥇', '🥈', '🥉'][k]}</span>${esc(x.comp)} · ${libJour(x.date)} ${heure(x.date)}</div>
          <div class="sel">${esc(lib(bk.m, x))}</div>
          <div class="mt">${esc(x.dom)} – ${esc(x.ext)}</div>
          <div class="odds"><span class="pill g">Cote juste ${cote(bk.p)}</span><span class="pill">Vise ≥ ${coteMin(bk.p)}</span>${faible(x) ? '<span class="pill">⚠ Peu de matchs</span>' : ''}</div>
        </div>${ring(bk.p)}</div>`;
      });
      h += `</div>`;
    }

    // 2 combos de 3 matchs, sans match en commun
    const combos = [], vus = new Set();
    for (let c = 0; c < 2; c++) {
      const legs = [];
      for (const s of fiables) { if (vus.has(s.i)) continue; legs.push(s); vus.add(s.i); if (legs.length === 3) break; }
      if (legs.length >= 2) combos.push(legs);
    }
    if (combos.length) {
      h += `<h2>🧩 ${combos.length > 1 ? 'Les combos' : 'Le combo'} ${quand}</h2><div class="combos">`;
      combos.forEach((legs, c) => {
        const pt = legs.reduce((a, s) => a * s.p, 1);
        h += `<div class="combo" data-cb="${c}">
        <h4>Combo ${c ? '2 · plus audacieux' : '1 · le plus sûr'} <span>${legs.length} matchs différents</span></h4>
        ${legs.map((s, k) => `<div class="cleg" data-pm="${s.i}" data-pk="${esc(s.m)}"><i>${k + 1}</i>
          <div><div class="s">${esc(lib(s.m, s.x))}</div><div class="m">${esc(s.x.dom)} – ${esc(s.x.ext)} · ${heure(s.x.date)}</div></div>
          <span class="p">${pct(s.p)} %</span></div>`).join('')}
        <div class="ctot"><div><small>Chances (théoriques)</small><b>${pct(pt)} %</b></div><div><small>Cote juste du combo</small><b>${cote(pt)}</b></div></div>
        <button class="ghost" data-combo="${c}">+ Suivre ce combo dans Mes paris</button></div>`;
      });
      h += `</div>`;
    }

    const bt = [];
    liste.forEach((x, i) => buteursMatch(x).forEach(b => bt.push(Object.assign({ x: x, i: i }, b))));
    bt.sort((a, b) => b.p - a.p);
    if (bt.length) {
      h += `<h2 class="secth">⚽ Les buteurs ${jourP === 'auj' ? 'du jour' : jourP === 'dem' ? 'de demain' : 'de la semaine'} <small>s'il est titulaire</small></h2>
      <div class="card group">${bt.slice(0, 8).map((b, k) => `
        <div class="pk" data-pm="${b.i}" data-pk="${esc('B:' + b.joueur)}" style="${k ? 'border-top:1px solid var(--line)' : ''}">
          <span class="md ${k > 2 ? 'n' : ''}">${['🥇', '🥈', '🥉'][k] || '#' + (k + 1)}</span>
          <div style="min-width:0"><div class="s">${esc(b.joueur)}</div>
            <div class="m">${esc(b.equipe)} · ${esc(b.x.dom)} – ${esc(b.x.ext)} · ${heure(b.x.date)}</div>
            <div class="m">${b.buts} buts en ${b.matchs} matchs${b.pen ? ' (dont ' + b.pen + ' pén.)' : ''} · cote juste ${cote(b.p)}</div>
            <div class="bar"><i style="width:${pct(b.p)}%"></i></div></div>
          ${ring(b.p, true)}</div>`).join('')}</div>`;
    }

    const dc = [];
    liste.forEach((x, i) => decisifsMatch(x).forEach(b => dc.push(Object.assign({ x: x, i: i }, b))));
    dc.sort((a, b) => b.pdec - a.pdec);
    if (dc.length) {
      h += `<h2 class="secth">⚡ Les joueurs décisifs ${jourP === 'auj' ? 'du jour' : jourP === 'dem' ? 'de demain' : 'de la semaine'} <small>but ou passe décisive</small></h2>
      <div class="card group">${dc.slice(0, 8).map((b, k) => `
        <div class="pk" data-pm="${b.i}" data-pk="${esc('P:' + b.joueur)}" style="${k ? 'border-top:1px solid var(--line)' : ''}">
          <span class="md ${k > 2 ? 'n' : ''}">${['🥇', '🥈', '🥉'][k] || '#' + (k + 1)}</span>
          <div style="min-width:0"><div class="s">${esc(b.joueur)}</div>
            <div class="m">${esc(b.equipe)} · ${esc(b.x.dom)} – ${esc(b.x.ext)} · ${heure(b.x.date)}</div>
            <div class="m">${b.buts} buts + ${b.pd} passes en ${b.matchs} matchs · cote juste ${cote(b.pdec)}</div>
            <div class="bar"><i style="width:${pct(b.pdec)}%"></i></div></div>
          ${ring(b.pdec, true)}</div>`).join('')}</div>`;
    }

    const parHeure = triSel === 'heure';
    const liste2 = parHeure ? sels.slice().sort((a, b) => a.x.date.localeCompare(b.x.date) || (b.p - a.p)) : sels.slice(0, 30);
    h += `<h2 class="secth">🏆 ${parHeure ? 'Les sélections' : 'Classement des sélections'} <small>${sels.length} match${sels.length > 1 ? 's' : ''}</small></h2>
      <div class="rk" style="margin:0 0 8px"><button class="rkb ${parHeure ? 'on' : ''}" data-tri="heure">🕐 Par heure</button><button class="rkb ${parHeure ? '' : 'on'}" data-tri="proba">📈 Par probabilité</button></div>`;
    if (!sels.length) h += `<div class="empty">Aucune sélection dans cette fourchette.<br>Essaie un autre niveau de risque.</div>`;
    else {
      let jourPrec = '';
      h += `<div class="card group">${liste2.map((s, k) => {
        const j = libJour(s.x.date), sep = parHeure && jourP !== 'auj' && j !== jourPrec;
        jourPrec = j;
        return `${sep ? `<div class="sepj">${esc(j)}</div>` : ''}
      <div class="pk" data-pm="${s.i}" data-pk="${esc(s.m)}" style="${k && !sep ? 'border-top:1px solid var(--line)' : ''}">
        ${parHeure ? `<span class="md n hr">${heure(s.x.date)}</span>` : `<span class="md ${k > 2 ? 'n' : ''}">${['🥇', '🥈', '🥉'][k] || '#' + (k + 1)}</span>`}
        <div style="min-width:0"><div class="s">${esc(lib(s.m, s.x))}</div>
          <div class="m">${esc(s.x.dom)} – ${esc(s.x.ext)} · ${parHeure ? esc(s.x.comp) : libJour(s.x.date) + ' ' + heure(s.x.date)}</div>
          ${faible(s.x) ? '<div class="w">⚠ Échantillon faible</div>' : ''}
          <div class="bar"><i style="width:${pct(s.p)}%"></i></div></div>
        ${ring(s.p, true)}</div>`;
      }).join('')}</div>`;
    }
    h += `<p class="disc">Probabilités estimées par le même modèle que ton tableau (loi de Poisson, non calibré).<br>Ce sont des tendances, pas des certitudes : une sélection n'a de valeur que si la cote dépasse la « cote juste ».</p>`;
    return h;
  }

  /* ---------- Bilan du modèle ---------- */
  let bilPer = 'tout', bilComp = 'Tous';
  const NOMNIV = { sur: '🛡️ Sûr', equi: '⚖️ Équilibré', audace: '🔥 Audacieux' };
  function bilanSomme(filtre) {
    const o = { n: 0, ok: 0, sp: 0 };
    (D.bilan || []).filter(filtre).forEach(b => { o.n += b.n || 0; o.ok += b.ok || 0; o.sp += b.sp || 0; });
    return o;
  }
  const tx = o => o.n ? Math.round(100 * o.ok / o.n) : null;
  const txp = o => o.n ? Math.round(100 * o.sp / o.n) : null;
  function resumeBilan() {
    const o = bilanSomme(b => b.per === 'tout' && b.type === 'niv' && b.cle === 'sur');
    if (!o.n) return '';
    return `<button class="bil-btn" data-bilan="1"><div>📊 Bilan du modèle<small>${o.n} sélections « Sûr » rejouées cette saison</small></div><b>${tx(o)} % ✓</b></button>`;
  }
  function ficheBilan() {
    const comps = [...new Set((D.bilan || []).map(b => b.comp))].sort();
    if (bilComp !== 'Tous' && comps.indexOf(bilComp) < 0) bilComp = 'Tous';
    const f = b => b.per === bilPer && (bilComp === 'Tous' || b.comp === bilComp);
    const ligne = (lbl, o) => { const r = tx(o), pr = txp(o); return `<tr><td>${lbl}</td><td>${o.n}</td><td><b class="${r >= pr - 3 ? 'ok' : 'ko'}">${r} %</b></td><td>${pr} %</td></tr>`; };
    let h = `<h3>📊 Bilan du modèle</h3>
      <div style="color:var(--muted);font-size:12.5px;margin:-8px 0 10px">Chaque match déjà joué est rejoué avec uniquement les infos connues avant le coup d'envoi. On regarde ensuite si la sélection proposée est passée.</div>
      <div class="rk" style="margin:0"><button class="rkb ${bilPer === 'tout' ? 'on' : ''}" data-bper="tout">Toute la saison</button><button class="rkb ${bilPer === '30j' ? 'on' : ''}" data-bper="30j">30 derniers jours</button></div>
      <div class="chips" style="margin-top:8px">${['Tous'].concat(comps).map(c => `<button class="chip ${c === bilComp ? 'on' : ''}" data-bcomp="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
    const niv = ['sur', 'equi', 'audace'].map(n => [n, bilanSomme(b => f(b) && b.type === 'niv' && b.cle === n)]);
    if (!niv.some(x => x[1].n)) return ouvrir(h + `<div class="empty">Pas encore assez de matchs joués pour ce choix.</div>`), lierBilan();
    h += `<label style="margin-top:14px">Réussite par niveau (prévu par le modèle entre parenthèses)</label><div class="bk">${niv.map(([n, o]) =>
      `<div><small>${NOMNIV[n]}</small><b>${o.n ? tx(o) + ' %' : '–'}</b><small>${o.n ? '(prévu ' + txp(o) + ' %)<br>' + o.ok + '/' + o.n + ' gagnées' : 'aucune'}</small></div>`).join('')}</div>`;
    const mk = {};
    (D.bilan || []).filter(b => f(b) && b.type === 'mk').forEach(b => { const o = mk[b.cle] = mk[b.cle] || { n: 0, ok: 0, sp: 0 }; o.n += b.n; o.ok += b.ok; o.sp += b.sp; });
    const gen = { dom: 'Domicile', ext: 'Extérieur' };
    h += `<label style="margin-top:16px">Par type de sélection</label><table class="bt"><tr><th>Sélection</th><th>Nb</th><th>Réussite</th><th>Prévu</th></tr>
      ${Object.keys(mk).sort((a, b) => mk[b].n - mk[a].n).map(k => ligne(esc(lib(k, gen)), mk[k])).join('')}</table>`;
    const cal = ['50', '60', '70', '80', '90'].map(c => [c, bilanSomme(b => f(b) && b.type === 'cal' && b.cle === c)]).filter(x => x[1].n);
    h += `<label style="margin-top:16px">Les pourcentages sont-ils fiables ?</label>
      <div style="color:var(--muted);font-size:12px;margin-bottom:4px">Quand le modèle annonce X %, combien de fois c'est vraiment passé (tous marchés confondus).</div>
      <table class="bt"><tr><th>Annoncé</th><th>Nb</th><th>Réel</th><th>Moyenne annoncée</th></tr>
      ${cal.map(([c, o]) => ligne(c === '90' ? '90 % et +' : c + ' – ' + (+c + 9) + ' %', o)).join('')}</table>`;
    const hi = (D.histo || []).filter(x => bilComp === 'Tous' || x.comp === bilComp).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 25);
    if (hi.length) h += `<label style="margin-top:16px">Les derniers « bankers » (meilleure sélection de chaque match, 10 derniers jours)</label>
      ${hi.map(x => `<div class="hi"><span class="r">${x.ok ? '✅' : '❌'}</span><div><div>${esc(lib(x.m, x))} · <b>${pct(x.p)} %</b></div>
        <div class="m">${esc(x.dom)} ${esc(x.score)} ${esc(x.ext)} · ${esc(x.comp)} · ${libJour(x.date)}</div></div></div>`).join('')}`;
    h += `<p class="disc" style="margin-top:14px">En vert : le modèle tient ses promesses (réussite ≥ prévu − 3 pts). En rouge : il est trop optimiste sur ce point.</p>`;
    ouvrir(h); lierBilan();
  }
  function lierBilan() {
    const sh = $('#sheet');
    sh.querySelectorAll('[data-bper]').forEach(el => el.onclick = () => { bilPer = el.dataset.bper; ficheBilan(); });
    sh.querySelectorAll('[data-bcomp]').forEach(el => el.onclick = () => { bilComp = el.dataset.bcomp; ficheBilan(); });
  }

  /* ---------- Fiche match ---------- */
  function ficheMatch(x, focus) {
    const P = probas(x), bts = buteursMatch(x), dcs = decisifsMatch(x);
    const ordre = Object.keys(x.p).sort((a, b) => x.p[b] - x.p[a]);
    focus = focus && P[focus] != null ? focus : ordre[0];
    const ligne = m => `<div class="mk ${m === focus ? 'on' : ''}" data-mk="${esc(m)}"><span class="l">${esc(lib(m, x))}</span>
        <span class="v">${pct(P[m])} % <small style="color:var(--muted);font:500 11.5px Barlow">· ${cote(P[m])}</small></span>
        <div class="bar"><i style="width:${pct(P[m])}%"></i></div></div>`;
    ouvrir(`<h3>${esc(x.dom)} – ${esc(x.ext)}</h3>
      <div style="color:var(--muted);margin:-8px 0 12px;font-size:13px">${esc(x.comp)} · ${libJour(x.date)} ${heure(x.date)} ${faible(x) ? '· ⚠ peu de matchs' : ''}</div>
      <div class="xg"><div><b>${fmt(x.lD && +x.lD.toFixed(2))}</b><small>buts attendus<br>${esc(x.dom)}</small></div>
        <div class="sc"><small>Score le + probable</small><b style="font-size:24px">${esc(x.score)}</b></div>
        <div><b>${fmt(x.lE && +x.lE.toFixed(2))}</b><small>buts attendus<br>${esc(x.ext)}</small></div></div>
      <label>Tester une cote · ${esc(lib(focus, x))} (${pct(P[focus])} %)</label>
      <div class="row2"><input id="vCote" type="number" inputmode="decimal" step="0.01" min="1.01" placeholder="Cote du bookmaker">
        <button class="primary" style="margin:0" id="vAdd">+ Mes paris</button></div>
      <div id="vRes"></div>
      ${bts.length ? `<label style="margin-top:16px">⚽ Buteurs possibles (touche pour tester)</label>
      <div>${bts.slice(0, 10).map(b => ligne('B:' + b.joueur)).join('')}</div>
      <div style="color:var(--muted);font-size:11.5px;margin-top:6px">Probabilités s'il est titulaire, d'après ses buts (et passes) de la saison et les buts attendus de son équipe.</div>` : ''}
      ${dcs.length ? `<label style="margin-top:16px">⚡ Joueurs décisifs · but ou passe (touche pour tester)</label>
      <div>${dcs.slice(0, 10).map(b => ligne('P:' + b.joueur)).join('')}</div>` : ''}
      <label style="margin-top:16px">Tous les marchés (touche pour tester)</label>
      <div>${ordre.map(ligne).join('')}</div>`);
    const sh = $('#sheet');
    const test = () => {
      const c = parseFloat(String($('#vCote').value).replace(',', '.')), p = P[focus], r = $('#vRes');
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

  /* ---------- EN DIRECT : scores ESPN (gratuit) + probabilités recalculées pendant le match ---------- */
  const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/';
  const SLUG = { 'Ligue 1': 'fra.1', 'Premier League': 'eng.1', 'Liga': 'esp.1', 'Serie A': 'ita.1', 'Bundesliga': 'ger.1',
    'Ligue des champions': 'uefa.champions', 'Eredivisie': 'ned.1', 'Liga Portugal': 'por.1', 'Championship': 'eng.2', 'Brasileirão': 'bra.1' };
  const slugDe = comp => SLUG[comp] || (window.PS_LIGUES || {})[comp];
  const LIVE = {};            // clé -> état du match en direct
  let liveOuvert = null, liveFocus = null;
  const cleL = x => x.comp + '|' + x.date + '|' + x.dom;
  const MOTS = /\b(fc|cf|ac|sc|afc|as|us|ss|ssc|club|de|the|rc|ogc|sv|vfb|vfl|fk|sk|cd|ud|sd|rcd|ca|cr|se|ec|sl|sporting|real)\b/g;
  const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(MOTS, ' ').replace(/\s+/g, ' ').trim();
  function proche(a, noms) {
    const na = norm(a); if (!na) return 0;
    let best = 0;
    noms.forEach(n => {
      const nb = norm(n); if (!nb) return;
      if (na === nb) best = Math.max(best, 3);
      else if (na.includes(nb) || nb.includes(na)) best = Math.max(best, 2);
      else if (na.split(' ').some(t => t.length > 2 && nb.split(' ').indexOf(t) >= 0)) best = Math.max(best, 1.5);
      else if (na.slice(0, 4) === nb.slice(0, 4)) best = Math.max(best, 0.5);
    });
    return best;
  }
  const nomsEq = t => [t.displayName, t.shortDisplayName, t.name, t.location, t.abbreviation];
  const candidatsLive = () => (D && D.pronos || []).filter(x => {
    const dt = Date.now() - new Date(x.date);
    return dt > -60e3 && dt < 140 * 60e3 && x.lD && x.lE && slugDe(x.comp);
  });
  const ymd = d => d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCDate()).padStart(2, '0');

  function lireEvent(e) {
    const c = e.competitions[0], h = c.competitors.find(x => x.homeAway === 'home'), a = c.competitors.find(x => x.homeAway === 'away');
    const st = e.status || {}, ty = st.type || {};
    const clk = String(st.displayClock || '0');
    const mm = clk.match(/(\d+)(?:'\s*\+\s*(\d+))?/), base = mm ? +mm[1] : 0, plus = mm && mm[2] ? +mm[2] : 0;
    const evs = [], rouges = { D: 0, E: 0 };
    (c.details || []).forEach(d => {
      const camp = d.team && d.team.id === h.team.id ? 'D' : 'E';
      if (d.redCard) rouges[camp]++;
      if (d.scoringPlay || d.redCard) evs.push({ min: d.clock && d.clock.displayValue || '', camp: camp, t: d.redCard ? '🟥' : (d.ownGoal ? '⚽ (csc)' : d.penaltyKick ? '⚽ (pén.)' : '⚽'),
        qui: (d.athletesInvolved || []).map(x => x.shortName || x.displayName).join(', ') });
    });
    return { etat: ty.state, mi: ty.name === 'STATUS_HALFTIME', fini: !!ty.completed, periode: st.period || 1, base: base, plus: plus,
      txt: ty.name === 'STATUS_HALFTIME' ? 'Mi-temps' : ty.completed ? 'Terminé' : ty.state === 'pre' ? 'Bientôt' : clk,
      h: +h.score || 0, a: +a.score || 0, rouges: rouges, evs: evs, maj: Date.now() };
  }

  async function majLive() {
    if (document.hidden || !D) return;
    const cands = candidatsLive();
    if (!cands.length) { if (Object.keys(LIVE).length) { Object.keys(LIVE).forEach(k => delete LIVE[k]); afficherLive(); } return; }
    const groupes = {};
    cands.forEach(x => { const s = slugDe(x.comp), d = new Date(x.date); [ymd(d), ymd(new Date(d - 864e5))].forEach((j, i) => {
      const k = s + '|' + j; (groupes[k] = groupes[k] || { s: s, j: j, x: [], sec: i }).x.push(x); }); });
    const evParSlug = {};
    await Promise.all(Object.values(groupes).filter(g => !g.sec).map(g =>
      fetch(ESPN + g.s + '/scoreboard?dates=' + g.j).then(r => r.ok ? r.json() : null).then(j => { (evParSlug[g.s] = evParSlug[g.s] || []).push(...((j && j.events) || [])); }).catch(() => {})));
    cands.forEach(x => {
      const evs = (evParSlug[slugDe(x.comp)] || []).filter(e => Math.abs(new Date(e.date) - new Date(x.date)) <= 20 * 60e3);
      let best = null, bs = 0;
      evs.forEach(e => {
        const c = e.competitions && e.competitions[0]; if (!c) return;
        const h = c.competitors.find(t => t.homeAway === 'home'), a = c.competitors.find(t => t.homeAway === 'away');
        const sc = proche(x.dom, nomsEq(h.team)) + proche(x.ext, nomsEq(a.team));
        if (sc > bs) { bs = sc; best = e; }
      });
      if (best && bs >= 1.5) {
        const l = lireEvent(best);
        if (l.etat === 'in' || (l.fini && Date.now() - new Date(x.date) < 140 * 60e3)) LIVE[cleL(x)] = Object.assign(l, { x: x });
        else delete LIVE[cleL(x)];
      }
    });
    afficherLive();
  }

  /** Minutes restantes (temps additionnel moyen compris), puis Poisson sur le temps restant. */
  function probasLive(L) {
    const x = L.x;
    let reste;
    if (L.fini) reste = 0;
    else if (L.mi) reste = 49;
    else if (L.periode <= 1) reste = Math.max(0, 45 - L.base) + 49;
    else reste = Math.max(0.5, 94 - L.base - L.plus);
    const f = reste / 94;
    const ajD = Math.pow(0.7, L.rouges.D) * Math.pow(1.2, L.rouges.E), ajE = Math.pow(0.7, L.rouges.E) * Math.pow(1.2, L.rouges.D);
    const lh = x.lD * f * ajD, la = x.lE * f * ajE, h = L.h, a = L.a, T = h + a;
    const po = (k, l) => { let v = Math.exp(-l); for (let i = 1; i <= k; i++) v *= l / i; return v; };
    const g = {};
    let p1 = 0, pN = 0, p2 = 0, btts = 0, tot = {};
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
      const p = po(i, lh) * po(j, la), H = h + i, A = a + j;
      if (H > A) p1 += p; else if (H === A) pN += p; else p2 += p;
      if (H > 0 && A > 0) btts += p;
      tot[i + j] = (tot[i + j] || 0) + p;
    }
    const plusDe = n => { let s = 0; Object.keys(tot).forEach(k => { if (T + +k > n) s += tot[k]; }); return s; };
    const lt = lh + la, aucun = Math.exp(-lt);
    const out = [];
    const ajout = (grp, lbl, p, type) => out.push({ grp: grp, lbl: lbl, p: Math.min(0.999, Math.max(0.001, p)), type: type });
    if (!L.fini) {
      ajout('⚡ Prochain but', 'Prochain but : ' + x.dom, lt ? lh / lt * (1 - aucun) : 0, 'Autre');
      ajout('⚡ Prochain but', 'Prochain but : ' + x.ext, lt ? la / lt * (1 - aucun) : 0, 'Autre');
      ajout('⚡ Prochain but', 'Plus aucun but', aucun, 'Plus/Moins buts');
      [T, T + 1, T + 2].forEach(n => { const p = plusDe(n + 0.5); ajout('🎯 Nombre de buts', 'Plus de ' + n + ',5 buts', p, 'Plus/Moins buts'); ajout('🎯 Nombre de buts', 'Moins de ' + n + ',5 buts', 1 - p, 'Plus/Moins buts'); });
      ajout('🎯 Nombre de buts', x.dom + ' marque encore', 1 - Math.exp(-lh), 'Plus/Moins buts');
      ajout('🎯 Nombre de buts', x.ext + ' marque encore', 1 - Math.exp(-la), 'Plus/Moins buts');
    }
    ajout('🏁 Résultat final', 'Victoire ' + x.dom, p1, '1N2'); ajout('🏁 Résultat final', 'Match nul', pN, '1N2'); ajout('🏁 Résultat final', 'Victoire ' + x.ext, p2, '1N2');
    ajout('🏁 Résultat final', x.dom + ' ou nul', p1 + pN, 'Double chance'); ajout('🏁 Résultat final', x.ext + ' ou nul', p2 + pN, 'Double chance');
    ajout('🏁 Résultat final', 'Pas de nul', p1 + p2, 'Double chance');
    if (!(h > 0 && a > 0)) { ajout('🤝 Les 2 marquent', 'Les 2 équipes marquent – Oui', btts, 'Les deux marquent'); ajout('🤝 Les 2 marquent', 'Les 2 équipes marquent – Non', 1 - btts, 'Les deux marquent'); }
    return { lignes: out, lh: lh, la: la, reste: Math.round(reste) };
  }

  function carteLive(k, L) {
    const x = L.x, pr = probasLive(L), nb = pr.lignes.find(l => l.grp === '⚡ Prochain but');
    const cl = L.fini ? 'fin' : L.mi ? 'mi' : 'on';
    return `<div class="lv" data-live="${esc(k)}">
      <div class="lvt"><span class="pt ${cl}">${L.fini ? '' : '●'} ${esc(L.txt)}</span><span>${esc(x.comp)}</span></div>
      <div class="lvs"><span class="eq">${esc(x.dom)}${L.rouges.D ? ' <i class="rc">' + '▮'.repeat(L.rouges.D) + '</i>' : ''}</span>
        <b>${L.h} – ${L.a}</b><span class="eq r">${L.rouges.E ? '<i class="rc">' + '▮'.repeat(L.rouges.E) + '</i> ' : ''}${esc(x.ext)}</span></div>
      ${L.fini ? '' : `<div class="lvp">Encore un but : <b>${pct(1 - Math.exp(-(pr.lh + pr.la)))} %</b> · touche pour jouer en live</div>`}</div>`;
  }
  function blocLive() {
    const ks = Object.keys(LIVE).sort((p, q) => LIVE[p].x.date.localeCompare(LIVE[q].x.date));
    if (!ks.length) return '<div id="liveBox"></div>';
    return `<div id="liveBox"><h2 class="secth">🔴 En direct <small>${ks.filter(k => !LIVE[k].fini).length} match(s) · mise à jour toutes les 30 s</small></h2>
      <div class="lvg">${ks.map(k => carteLive(k, LIVE[k])).join('')}</div></div>`;
  }
  function afficherLive() {
    if (tab === 'pronos') { const b = document.getElementById('liveBox'); if (b) b.outerHTML = blocLive(); }
    if (liveOuvert && !$('#veil').classList.contains('hidden') && document.getElementById('lvSheet') && (document.activeElement || {}).id !== 'vCote') ficheLive(liveOuvert, true);
  }

  function ficheLive(k, maj) {
    const L = LIVE[k]; if (!L) return;
    const x = L.x, pr = probasLive(L);
    const coteTapee = maj && $('#vCote') ? $('#vCote').value : '';
    liveOuvert = k;
    if (!liveFocus || !pr.lignes.some(l => l.lbl === liveFocus)) liveFocus = pr.lignes[0].lbl;
    const F = pr.lignes.find(l => l.lbl === liveFocus);
    const grps = [...new Set(pr.lignes.map(l => l.grp))];
    ouvrir(`<div id="lvSheet"></div><h3>🔴 ${esc(x.dom)} – ${esc(x.ext)}</h3>
      <div style="color:var(--muted);margin:-8px 0 10px;font-size:13px">${esc(x.comp)} · ${L.fini ? 'Terminé' : esc(L.txt) + ' · ~' + pr.reste + ' min restantes'}</div>
      <div class="xg"><div><b>${pr.lh.toFixed(2)}</b><small>buts encore attendus<br>${esc(x.dom)}</small></div>
        <div class="sc"><small>Score</small><b style="font-size:30px">${L.h} – ${L.a}</b></div>
        <div><b>${pr.la.toFixed(2)}</b><small>buts encore attendus<br>${esc(x.ext)}</small></div></div>
      ${L.evs.length ? `<div class="lve">${L.evs.map(e => `<span class="${e.camp === 'D' ? '' : 'r'}">${esc(e.min)} ${e.t} ${esc(e.qui)}</span>`).join('')}</div>` : ''}
      ${L.rouges.D || L.rouges.E ? `<div style="color:var(--muted);font-size:12px;margin:4px 0">🟥 Carton rouge pris en compte (équipe en infériorité : −30 % de buts attendus).</div>` : ''}
      ${L.fini ? '' : `<label>Tester une cote live · ${esc(F.lbl)} (${pct(F.p)} %)</label>
      <div class="row2"><input id="vCote" type="number" inputmode="decimal" step="0.01" min="1.01" placeholder="Cote du bookmaker" value="${esc(coteTapee)}">
        <button class="primary" style="margin:0" id="vAdd">+ Mes paris</button></div><div id="vRes"></div>`}
      ${grps.map(gp => `<label style="margin-top:14px">${gp}</label><div>${pr.lignes.filter(l => l.grp === gp).map(l => `<div class="mk ${l.lbl === liveFocus ? 'on' : ''}" data-lk="${esc(l.lbl)}">
        <span class="l">${esc(l.lbl)}</span><span class="v">${pct(l.p)} % <small style="color:var(--muted);font:500 11.5px Barlow">· ${cote(l.p)}</small></span>
        <div class="bar"><i style="width:${pct(l.p)}%"></i></div></div>`).join('')}</div>`).join('')}
      <p class="disc" style="margin-top:12px">Recalculé à chaque mise à jour à partir des buts attendus d'avant-match, du temps restant, du score et des cartons rouges. Le modèle ne voit pas la physionomie du match (domination, blessures, changements) : en live, les bookmakers en savent souvent plus.</p>`);
    const sh = $('#sheet');
    sh.querySelectorAll('[data-lk]').forEach(el => el.onclick = () => { liveFocus = el.dataset.lk; ficheLive(k, true); });
    if (L.fini) return;
    const test = () => {
      const c = parseFloat(String($('#vCote').value).replace(',', '.')), p = F.p, r = $('#vRes');
      if (!(c > 1)) { r.innerHTML = ''; return; }
      const ev = p * c - 1;
      r.innerHTML = ev > SUSPECT ? `<div class="verdict warn">⚠️ Écart très élevé (+${Math.round(ev * 100)} %) : en live, le bookmaker voit souvent quelque chose que le modèle ignore.</div>`
        : ev > MARGE ? `<div class="verdict ok">✅ Valeur positive : +${Math.round(ev * 100)} % d'espérance selon le modèle</div>`
        : `<div class="verdict no">❌ Pas de valeur : il faudrait une cote ≥ ${coteMin(p)}</div>`;
    };
    $('#vCote').oninput = test; test();
    $('#vAdd').onclick = () => {
      const c = $('#vCote').value;
      liveOuvert = null; fermer(); formPari(x.dom + ' - ' + x.ext);
      $('#pType').value = F.type;
      if (c) { $('#pCote').value = c; $('#pCote').dispatchEvent(new Event('input')); }
      const lab = document.createElement('div'); lab.className = 'gain';
      lab.innerHTML = `<span>Sélection live (${esc(L.txt)}, ${L.h}-${L.a})</span><b style="font-size:15px">${esc(F.lbl)}</b>`;
      $('#fPari').insertBefore(lab, $('#fPari').firstChild);
    };
  }
  setInterval(majLive, 30000);
  setTimeout(majLive, 2500);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) majLive(); });
  $('#veil').addEventListener('click', e => { if (e.target.id === 'veil') liveOuvert = null; });

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
    if (e.target.closest('[data-bilan]')) { ficheBilan(); return; }
    const lv = e.target.closest('[data-live]');
    if (lv) { liveFocus = null; ficheLive(lv.dataset.live); return; }
    const tr = e.target.closest('[data-tri]');
    if (tr) { triSel = tr.dataset.tri; try { localStorage.setItem('ps_tri', triSel); } catch (err) {} rendre(); return; }
    const n = e.target.closest('[data-niv]');
    if (n) { niveau = n.dataset.niv; try { localStorage.setItem('ps_niveau', niveau); } catch (er) {} rendre(); return; }
    const jr = e.target.closest('[data-jour]');
    if (jr) { jourP = jr.dataset.jour; compP = 'Tous'; rendre(); return; }
    const c = e.target.closest('[data-pcomp]');
    if (c) { compP = c.dataset.pcomp; rendre(); return; }
    if (e.target.closest('[data-combo]')) {
      const cb = e.target.closest('[data-combo]').dataset.combo;
      const legs = [...$('#view').querySelectorAll(`.combo[data-cb="${cb}"] .cleg`)].map(el => {
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
