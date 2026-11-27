/* PronoStats – onglet « Pénos » : penalty potentiel selon l'arbitre, l'équipe VAR et les deux équipes.
   Les calculs sont faits chaque jour par GitHub (outils/arbitres.mjs) à partir de l'API publique de l'UEFA
   et rangés dans arbitres.json. Ici on se contente de les lire et de les afficher. */
(function () {
  const RAW = 'https://raw.githubusercontent.com/tranainthomas25-spec/pronostats/main/';
  const SOURCES = [RAW + 'arbitres.json', 'arbitres.json'], SOURCES_L = [RAW + 'ligues.json', 'ligues.json'];
  const CLE = 'ps_penos_v1', DELAI = 20 * 60 * 1000, MARGE = 0.05;
  let A = null, L = null, TOUS = [], enCours = false, jourK = 'tous', compK = 'Tous';
  try { A = JSON.parse(localStorage.getItem(CLE)); } catch (e) {}
  try { L = JSON.parse(localStorage.getItem(CLE + '_l')); } catch (e) {}

  const CSS = `
.pn-card{cursor:pointer;display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center}
.pn-card .t{font:700 18px/1.15 "Barlow Condensed",sans-serif}
.pn-card .m{color:var(--muted);font-size:12.5px;margin-top:2px}
.pn-card .ar{margin-top:6px;font-size:13px}
.pn-card .ar b{color:var(--gold2)}
.pn-f{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.pn-f .pill.up{background:rgba(110,200,255,.16);color:#7FD0FF}
.pn-f .pill.dn{background:rgba(226,98,94,.12);color:var(--loss)}
.fb{font-size:11px;font-weight:700;padding:2px 7px;border-radius:999px;margin-left:4px;vertical-align:1px}
.fb.solide{background:rgba(63,191,127,.15);color:var(--win)}
.fb.moyen{background:var(--gold-dim);color:var(--gold2)}
.fb.faible,.fb.inconnu{background:rgba(226,98,94,.12);color:var(--loss)}
.pn-intro{font-size:13.5px;color:var(--muted);line-height:1.45}
.pn-intro b{color:var(--text)}
.pn-row{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:8px 0;border-top:1px solid var(--line);font-size:14px}
.pn-row:first-child{border-top:0}
.pn-row small{color:var(--muted);font-size:12px;grid-column:1/-1}
.pn-row .v{font:700 16px "Barlow Condensed",sans-serif;text-align:right}
.pn-row .v.oui{color:var(--win)}.pn-row .v.non{color:var(--muted)}
.pn-big{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:6px 0 12px}
.pn-big>div{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:8px;text-align:center}
.pn-big b{display:block;font:700 22px "Barlow Condensed",sans-serif;color:var(--gold2)}
.pn-big small{color:var(--muted);font-size:11.5px}
.sheet h4{font:600 13px "Barlow Condensed",sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:var(--gold);margin:16px 0 4px}
`;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  const pct = p => Math.round(p * 100);
  const dec = (x, n) => (x == null ? '–' : Number(x).toFixed(n == null ? 2 : n).replace('.', ','));
  const cote = p => (p > 0 ? (1 / p).toFixed(2).replace('.', ',') : '–');
  const jourDe = iso => { const d = new Date(iso); d.setHours(0, 0, 0, 0); const a = new Date(); a.setHours(0, 0, 0, 0); return Math.round((d - a) / 864e5); };
  const nomJour = n => n === 0 ? "Aujourd'hui" : n === 1 ? 'Demain' : new Date(Date.now() + n * 864e5).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric' });
  const heure = iso => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const facteur = f => { const v = Math.round((f - 1) * 100); return v === 0 ? '=' : (v > 0 ? '+' : '') + v + ' %'; };
  const cls = f => Math.round((f - 1) * 100) > 0 ? 'up' : Math.round((f - 1) * 100) < 0 ? 'dn' : '';

  async function chargerPenos(force) {
    if (enCours) return;
    if (!force && A && A._t && Date.now() - A._t < DELAI) return;
    enCours = true;
    for (const u of SOURCES) {
      try {
        const r = await fetch(u + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
        if (!r.ok) continue;
        const j = await r.json();
        if (!j || !j.prochains) continue;
        j._t = Date.now(); A = j;
        try { localStorage.setItem(CLE, JSON.stringify(j)); } catch (e) {}
        break;
      } catch (e) {}
    }
    for (const u of SOURCES_L) {
      try {
        const r = await fetch(u + '?t=' + Math.floor(Date.now() / 60000), { cache: 'no-store' });
        if (!r.ok) continue;
        const j = await r.json();
        if (!j || !j.prochains) continue;
        L = j;
        try { localStorage.setItem(CLE + '_l', JSON.stringify(j)); } catch (e) {}
        break;
      } catch (e) {}
    }
    enCours = false;
    if (tab === 'penos') rendre();
  }

  function carte(x, i) {
    const a = x.arbitre;
    const f = x.facteurs || {};
    return `<article class="card pn-card" data-pen="${i}">
      <div class="ring sm" style="--v:${pct(x.proba)}"><b>${pct(x.proba)}<small>%</small></b></div>
      <div>
        <div class="t">${esc(x.dom)} – ${esc(x.ext)}</div>
        <div class="m">${esc(x.comp)} · ${nomJour(jourDe(x.date))} ${heure(x.date)}</div>
        <div class="ar">${a ? `👤 ${esc(a.nom)} <span style="color:var(--muted)">(${esc(a.pays)})</span> · <b>${a.n ? dec(a.taux) : '–'}</b> péno/match<span class="fb ${x.fiab}">${a.n} m.</span>` : '👤 Arbitre pas encore désigné'}</div>
        <div class="pn-f">
          <span class="pill ${cls(f.arbitre)}">Arbitre ${facteur(f.arbitre)}</span>
          ${x.ligue ? '' : `<span class="pill ${cls(f.var)}">VAR ${facteur(f.var)}</span>`}
          <span class="pill ${cls(f.equipes)}">Équipes ${facteur(f.equipes)}</span>
          <span class="pill g">Cote juste ${cote(x.proba)}</span>
        </div>
      </div></article>`;
  }

  function vuePenos() {
    if (!A) {
      chargerPenos(true);
      return `<div class="empty">Chargement des arbitres…<br><small>Si ça dure, la première mise à jour automatique n'a pas encore tourné sur GitHub.</small></div>`;
    }
    const b = A.base || {};
    let h = `<div class="card pn-intro">En Coupe d'Europe, <b>${pct(b.avecPenalty || 0)} %</b> des matchs ont au moins un penalty (<b>${dec(b.parMatch)}</b> par match, sur ${b.matchs || 0} matchs). Le % de chaque match part de cette moyenne, corrigée selon <b>l'arbitre</b>, <b>la VAR</b> et ce que <b>les deux équipes</b> obtiennent / concèdent.${L && L.bases && Object.keys(L.bases).length ? '<br>En championnat : ' + Object.entries(L.bases).map(([k, v]) => `${esc(k)} <b>${dec(v.parMatch)}</b>`).join(' · ') + ' penalty/match.' : ''}</div>`;

    TOUS = (A.prochains || []).concat(L ? L.prochains || [] : []);
    const futurs = TOUS.map((x, i) => Object.assign({ _i: i }, x));
    const jours = [...new Set(futurs.map(x => jourDe(x.date)))].sort((a, c) => a - c);
    if (jourK !== 'tous' && !jours.includes(+jourK)) jourK = 'tous';
    h += `<div class="rk"><button class="rkb ${jourK === 'tous' ? 'on' : ''}" data-pjour="tous">Tous<small>${futurs.length} match(s)</small></button>` +
      jours.map(j => `<button class="rkb ${String(j) === String(jourK) ? 'on' : ''}" data-pjour="${j}">${nomJour(j)}<small>${futurs.filter(x => jourDe(x.date) === j).length} match(s)</small></button>`).join('') + `</div>`;
    let liste = jourK === 'tous' ? futurs : futurs.filter(x => jourDe(x.date) === +jourK);
    const comps = [...new Set(liste.map(x => x.comp))];
    if (comps.length > 1) {
      if (compK !== 'Tous' && !comps.includes(compK)) compK = 'Tous';
      h += `<div class="chips">${['Tous', ...comps].map(c => `<button class="chip ${c === compK ? 'on' : ''}" data-pcomp2="${esc(c)}">${esc(c)}</button>`).join('')}</div>`;
      if (compK !== 'Tous') liste = liste.filter(x => x.comp === compK);
    }
    if (!liste.length) h += `<div class="empty">Aucun match de Coupe d'Europe avec arbitre désigné pour l'instant.<br><small>Les arbitres sont annoncés 1 à 3 jours avant.</small></div>`;
    else {
      const groupes = new Map();
      liste.slice().sort((a, c) => Date.parse(a.date) - Date.parse(c.date) || c.proba - a.proba).forEach(x => {
        const k = (jourK === 'tous' ? nomJour(jourDe(x.date)) + ' · ' : '') + heure(x.date);
        if (!groupes.has(k)) groupes.set(k, []); groupes.get(k).push(x);
      });
      groupes.forEach((g, k) => { h += `<h2 class="secth">⏱ ${esc(k)}<small>${g.length} match(s) · du plus probable au moins probable</small></h2>` + g.map(x => carte(x, x._i)).join(''); });
    }

    const cl = A.classement || [];
    if (cl.length) {
      h += `<h2 class="secth">Arbitres qui sifflent le plus<small>10 matchs minimum</small></h2><div class="card">` +
        cl.slice(0, 10).map((a, k) => `<div class="pn-row"><span>${k + 1}. ${esc(a.nom)} <span style="color:var(--muted)">(${esc(a.pays)})</span></span><span class="v">${dec(a.taux)}</span><small>${a.pens} penalties en ${a.n} matchs</small></div>`).join('') + `</div>`;
    }
    const clL = L ? L.classement || [] : [];
    if (clL.length) {
      h += `<h2 class="secth">Arbitres de championnat qui sifflent le plus<small>8 matchs minimum</small></h2><div class="card">` +
        clL.slice(0, 10).map((a, k) => `<div class="pn-row"><span>${k + 1}. ${esc(a.nom)} <span style="color:var(--muted)">(${esc(a.ligue)})</span></span><span class="v">${dec(a.taux)}</span><small>${a.pens} penalties en ${a.n} matchs</small></div>`).join('') + `</div>`;
    }

    const rec = (A.recents || []).concat(L ? L.recents || [] : []);
    if (rec.length) {
      const moyP = rec.reduce((s, x) => s + x.proba, 0) / rec.length, reel = rec.filter(x => x.reel > 0).length / rec.length;
      const top = rec.slice().sort((a, c) => c.proba - a.proba).slice(0, Math.max(3, Math.round(rec.length / 4)));
      const topR = top.filter(x => x.reel > 0).length;
      h += `<h2 class="secth">Contrôle : 10 derniers jours<small>${rec.length} matchs joués</small></h2><div class="card">
        <div class="pn-big"><div><b>${pct(moyP)} %</b><small>prévu en moyenne</small></div><div><b>${pct(reel)} %</b><small>avec penalty en vrai</small></div><div><b>${topR}/${top.length}</b><small>le quart « chaud » avec péno</small></div></div>` +
        rec.slice().sort((a, c) => (c.date > a.date ? 1 : -1)).slice(0, 12).map(x => `<div class="pn-row"><span>${esc(x.dom)} – ${esc(x.ext)}</span><span class="v ${x.reel ? 'oui' : 'non'}">${x.reel ? '✅ ' + x.reel + ' péno' : '–'}</span><small>prévu ${pct(x.proba)} % · ${x.arbitre ? esc(x.arbitre.nom) : '?'}</small></div>`).join('') + `</div>`;
    }
    h += `<div class="maj" style="padding:4px 2px 0">Stats d'arbitres mises à jour le ${new Date(A.maj).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${esc(A.source || '')}${L ? ' + ' + esc(L.source) + (L.enAttente ? ` (${L.enAttente} matchs encore à analyser)` : '') : ''}</div>`;
    return h;
  }

  function fichePeno(i) {
    const x = TOUS[i]; if (!x) return;
    const ou = x.ligue ? 'matchs de championnat' : 'matchs européens';
    const a = x.arbitre, v = x.var, e = x.equipes || {};
    const eqL = (nom, s) => s ? `<div class="pn-row"><span>${esc(nom)}</span><span class="v">${dec(s.obt / s.n)} / ${dec(s.conc / s.n)}</span><small>${s.obt} penalties obtenus et ${s.conc} concédés en ${s.n} ${ou}</small></div>`
      : `<div class="pn-row"><span>${esc(nom)}</span><span class="v">–</span><small>Pas assez de ${ou} récents : moyenne utilisée</small></div>`;
    ouvrir(`<h3>${esc(x.dom)} – ${esc(x.ext)}</h3>
      <div style="color:var(--muted);margin-top:-8px">${esc(x.comp)} · ${nomJour(jourDe(x.date))} ${heure(x.date)}</div>
      <div class="pn-big" style="margin-top:12px"><div><b>${pct(x.proba)} %</b><small>au moins 1 penalty</small></div><div><b>${pct(x.penDom)} %</b><small>pour ${esc(x.dom)}</small></div><div><b>${pct(x.penExt)} %</b><small>pour ${esc(x.ext)}</small></div></div>
      <h4>Arbitre</h4>
      ${a ? `<div class="pn-row"><span>${esc(a.nom)} (${esc(a.pays)})<span class="fb ${x.fiab}">${x.fiab}</span></span><span class="v">${a.n ? dec(a.taux) : '–'}</span><small>${a.pens} penalties en ${a.n} ${ou} (${x.ligue ? 'saisons 2022 à 2024' : '3 saisons'}) · taux retenu après prudence : ${dec(a.lisse)}</small></div>
        ${(a.hist || []).map(m => `<div class="pn-row"><span style="font-size:13px">${esc(m.m)}</span><span class="v ${m.p ? 'oui' : 'non'}">${m.p ? m.p + ' péno' : '0'}</span><small>${esc(m.c)} · ${new Date(m.d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}</small></div>`).join('')}`
        : `<div class="pn-row"><span>Pas encore désigné</span></div>`}
      <h4>VAR</h4>
      ${v ? `<div class="pn-row"><span>${esc(v.nom)} (${esc(v.pays)})</span><span class="v">${v.n ? dec(v.pens / v.n) : '–'}</span><small>${v.pens} penalties dans ${v.n} matchs où il était à la vidéo</small></div>` : `<div class="pn-row"><span>${x.ligue ? 'Pas de données VAR pour les championnats' : 'Pas encore désignée'}</span></div>`}
      <h4>Équipes (obtenus / concédés par match)</h4>
      ${eqL(x.dom, e.dom)}${eqL(x.ext, e.ext)}
      <h4>Ta cote « Penalty dans le match : Oui »</h4>
      <input id="pnCote" type="number" inputmode="decimal" step="0.01" min="1" placeholder="Ex : 2,90">
      <div id="pnRes"></div>
      <button class="primary" id="pnAdd">Ajouter à mes paris</button>
      <div style="color:var(--muted);font-size:12px;margin-top:10px;line-height:1.4">Cote juste selon le modèle : <b style="color:var(--gold2)">${cote(x.proba)}</b>. Le modèle ne voit pas les blessures, l'enjeu ni le style de jeu du soir : à prendre comme une aide au tri, pas comme une certitude.</div>`);
    const test = () => {
      const c = parseFloat(String($('#pnCote').value).replace(',', '.')), r = $('#pnRes');
      if (!(c > 1)) { r.innerHTML = ''; return; }
      const ev = x.proba * c - 1;
      r.innerHTML = ev > 0.3 ? `<div class="verdict warn">⚠️ Écart très élevé (+${Math.round(ev * 100)} %) : vérifie la cote, ou le bookmaker sait quelque chose que le modèle ignore.</div>`
        : ev > MARGE ? `<div class="verdict ok">✅ Valeur positive : +${Math.round(ev * 100)} % d'espérance selon le modèle</div>`
        : `<div class="verdict no">❌ Pas de valeur : il faudrait une cote ≥ ${((1 + MARGE) / x.proba).toFixed(2).replace('.', ',')}</div>`;
    };
    $('#pnCote').oninput = test;
    $('#pnAdd').onclick = () => {
      const c = $('#pnCote').value;
      fermer(); formPari(x.dom + ' - ' + x.ext + ' : penalty Oui');
      $('#pType').value = 'Autre';
      if (c) { $('#pCote').value = c; $('#pCote').dispatchEvent(new Event('input')); }
    };
  }

  /* ---------- Intégration à l'appli ---------- */
  const nav = $('#tabs');
  const nb = nav.querySelectorAll('button').length + 1;
  nav.style.gridTemplateColumns = `repeat(${nb},1fr)`;
  if (nb >= 7) { const s2 = document.createElement('style'); s2.textContent = '@media (max-width:999px){.tabs button{font-size:10.5px;letter-spacing:0}}@media (max-width:440px){.tabs button{font-size:9.5px}.tabs svg{width:20px;height:20px}}'; document.head.appendChild(s2); }
  const bt = document.createElement('button');
  bt.dataset.tab = 'penos';
  bt.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 6h18v12H3z"/><path d="M7 6v5h10V6"/><circle cx="12" cy="15" r="1.3"/></svg><span>Pénos</span>`;
  const apres = nav.querySelector('[data-tab="buteurs"]');
  nav.insertBefore(bt, apres ? apres.nextSibling : nav.children[2] || null);

  const rendreAvant = rendre;
  rendre = function () {
    if (tab !== 'penos') return rendreAvant();
    if (!D) return;
    $('#maj').textContent = D.maj || '';
    $('#fab').hidden = true;
    $('#view').innerHTML = vuePenos();
    chargerPenos(false);
  };

  $('#view').addEventListener('click', ev => {
    if (tab !== 'penos') return;
    const j = ev.target.closest('[data-pjour]');
    if (j) { jourK = j.dataset.pjour; compK = 'Tous'; rendre(); return; }
    const c = ev.target.closest('[data-pcomp2]');
    if (c) { compK = c.dataset.pcomp2; rendre(); return; }
    const p = ev.target.closest('[data-pen]');
    if (p) fichePeno(+p.dataset.pen);
  });
  $('#btnRefresh').addEventListener('click', () => { if (tab === 'penos') chargerPenos(true); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && tab === 'penos') chargerPenos(false); });
  chargerPenos(false);
})();
