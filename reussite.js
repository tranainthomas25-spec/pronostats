/* PronoStats – réussite réelle des BUTEURS et des SCORES EXACTS.
   Chaque match déjà joué est rejoué avec uniquement ce qui était connu avant le coup d'envoi :
   on calcule les buteurs et les 4 scores les plus probables, puis on regarde ce qui s'est vraiment passé.
   Données : ESPN (gratuit, scores + buteurs de chaque match), gardées en mémoire du téléphone. */
(function () {
  const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/';
  // championnats principaux (ceux de la feuille Google) : on va chercher leurs buteurs match par match chez ESPN
  const PRINC = { 'fra.1': ['Ligue 1', 'aout'], 'eng.1': ['Premier League', 'aout'], 'esp.1': ['Liga', 'aout'], 'ita.1': ['Serie A', 'aout'],
    'ger.1': ['Bundesliga', 'aout'], 'uefa.champions': ['Ligue des champions', 'aout'], 'ned.1': ['Eredivisie', 'aout'],
    'por.1': ['Liga Portugal', 'aout'], 'eng.2': ['Championship', 'aout'], 'bra.1': ['Brasileirão', 'janv'] };
  const CLE = 'ps_reussite_v1', DELAI = 60 * 60 * 1000;
  const SEUIL_B = 0.32;                  // mêmes buteurs que ceux mis en avant dans l'onglet Buteurs
  const TRANCHES = [[0.20, '20'], [0.30, '30'], [0.40, '40'], [0.50, '50']];
  const NB_SCORES = 4;

  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } };
  const ecrire = o => { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} };
  const ym = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');
  function moisSaison(debut) {
    const n = new Date(), y = n.getFullYear(), m = n.getMonth() + 1;
    let [a, b] = debut === 'janv' ? [y, 1] : (m >= 7 ? [y, 7] : [y - 1, 7]);
    const fin = ym(n), out = [];
    while ((a + String(b).padStart(2, '0')) <= fin) { out.push(a + String(b).padStart(2, '0')); if (++b > 12) { b = 1; a++; } }
    return out;
  }

  /* ---------- Scores exacts (loi de Poisson sur les buts attendus) ---------- */
  const po = (k, l) => { let v = Math.exp(-l); for (let i = 1; i <= k; i++) v *= l / i; return v; };
  function scores(lD, lE, n) {
    if (!(lD > 0 && lE > 0)) return [];
    const t = [];
    for (let i = 0; i <= 8; i++) for (let j = 0; j <= 8; j++) t.push({ s: i + '-' + j, h: i, a: j, p: po(i, lD) * po(j, lE) });
    return t.sort((x, y) => y.p - x.p).slice(0, n || NB_SCORES);
  }

  /* ---------- Téléchargement des matchs terminés des championnats principaux ---------- */
  let occupe = false;
  async function telecharger() {
    const st = lire();
    if (st.t && Date.now() - st.t < DELAI) return st;
    const courant = ym(new Date()), taches = [];
    Object.keys(PRINC).forEach(code => {
      const lg = st[code] = st[code] || { e: {}, m: [] };
      const mois = moisSaison(PRINC[code][1]);
      Object.keys(lg.e).forEach(id => { if (lg.e[id][0].slice(0, 7).replace('-', '') < mois[0]) delete lg.e[id]; });
      lg.m = lg.m.filter(x => mois.indexOf(x) >= 0);
      mois.filter(mo => lg.m.indexOf(mo) < 0).forEach(mo => taches.push(() =>
        fetch(ESPN + code + '/scoreboard?limit=300&dates=' + mo).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => {
          (j.events || []).forEach(ev => {
            const c = ev.competitions && ev.competitions[0], t = ev.status && ev.status.type;
            if (!c || !t || !t.completed) return;
            const h = c.competitors.find(x => x.homeAway === 'home'), a = c.competitors.find(x => x.homeAway === 'away');
            if (!h || !a || h.score === '' || a.score === '') return;
            lg.e[ev.id] = [ev.date, 'F', h.team.shortDisplayName || h.team.displayName, a.team.shortDisplayName || a.team.displayName, +h.score, +a.score,
              (c.details || []).filter(d => d.scoringPlay && !d.ownGoal && d.athletesInvolved && d.athletesInvolved[0] && d.team)
                .map(d => [d.athletesInvolved[0].displayName, String(d.team.id) === String(h.team.id) ? 'h' : 'a', d.penaltyKick ? 1 : 0])];
          });
          if (mo < courant && new Date().getDate() >= 3) lg.m.push(mo);   // mois terminé : plus besoin de le recharger
        }).catch(() => {})));
    });
    for (let i = 0; i < taches.length; i += 4) await Promise.all(taches.slice(i, i + 4).map(f => f()));   // 4 à la fois
    st.t = Date.now();
    ecrire(st);
    return st;
  }

  /* ---------- Rejeu de la saison ---------- */
  function rejouer(comp, ms, M, R) {
    const now = Date.now(), il30 = now - 30 * 864e5, il10 = now - 10 * 864e5, P = M.P;
    const ajout = (per, type, cle, ok, p) => {
      const k = comp + '|' + per + '|' + type + '|' + cle;
      const o = R.agg[k] = R.agg[k] || { comp: comp, per: per, type: type, cle: cle, n: 0, ok: 0, sp: 0 };
      o.n++; if (ok) o.ok++; o.sp += p;
    };
    ms.forEach((m, i) => {
      const avant = ms.slice(0, i).filter(x => x.date < m.date);
      if (avant.length < P.MIN_LIGUE) return;
      const pr = M.profils(avant), L = avant.reduce((s, x) => s + x.h + x.a, 0) / (2 * avant.length);
      const r = M.prono(pr[m.dom], pr[m.ext], L);
      if (!r) return;
      const t = +new Date(m.date), pers = t >= il30 ? ['tout', '30j'] : ['tout'], reel = m.h + '-' + m.a;
      // Scores exacts
      const sc = scores(r.lD, r.lE);
      let cumul = 0, trouve = 0;
      sc.forEach((s, k) => { cumul += s.p; if (s.s === reel) trouve = k + 1; pers.forEach(per => ajout(per, 'sc', 'r' + (k + 1), s.s === reel, s.p)); });
      pers.forEach(per => { ajout(per, 'sc', 'top1', trouve === 1, sc[0].p); ajout(per, 'sc', 'top4', trouve > 0, cumul); });
      if (t >= il10) R.histoSc.push({ date: m.date, comp: comp, dom: m.dom, ext: m.ext, score: reel, sc: sc.map(s => [s.s, s.p]), k: trouve });
      // Buteurs (championnats où l'on connaît les buteurs de chaque match)
      if (!m.bt) return;
      [['h', m.dom, r.lD], ['a', m.ext, r.lE]].forEach(([camp, eq, lam]) => {
        const pe = pr[eq]; if (!pe || !pe.n) return;
        const moy = pe.gf / pe.n; if (!moy) return;
        const f = lam / moy, buts = {};
        avant.forEach(x => (x.bt || []).forEach(([nom, c]) => { if ((c === 'h' ? x.dom : x.ext) === eq) buts[nom] = (buts[nom] || 0) + 1; }));
        const marqueurs = new Set((m.bt || []).filter(b => b[1] === camp).map(b => b[0]));
        Object.keys(buts).forEach(nom => {
          const b = buts[nom];
          if (b < 2 || pe.n < 3) return;
          const p = 1 - Math.exp(-Math.min(1.1, (b / (pe.n + 3)) * f));   // même formule que l'onglet Buteurs
          const ok = marqueurs.has(nom);
          const tr = TRANCHES.filter(x => p >= x[0]).pop();
          if (tr) pers.forEach(per => ajout(per, 'but', tr[1], ok, p));
          if (p >= SEUIL_B) {
            pers.forEach(per => ajout(per, 'but', 'prop', ok, p));
            if (t >= il10) R.histoBt.push({ date: m.date, comp: comp, dom: m.dom, ext: m.ext, score: m.h + '-' + m.a, joueur: nom, equipe: eq, p: p, ok: ok });
          }
        });
      });
    });
  }

  let resultat = null, empreinte = '', pret = false;
  const notifier = () => { try { if (window.PS_REUSSITE_MAJ) window.PS_REUSSITE_MAJ(); } catch (e) {} };
  function calculer() {
    const M = window.PS_MODELE; if (!M) return null;
    const st = lire();
    let st2 = {}; try { st2 = JSON.parse(localStorage.getItem(M.CLE)) || {}; } catch (e) {}
    const emp = (st.t || 0) + '|' + (st2.t_espn || 0) + '|' + (st2.t_tsdb || 0);
    if (resultat && emp === empreinte) return resultat;
    const R = { agg: {}, histoBt: [], histoSc: [] };
    const conv = e => Object.values(e || {}).map(x => ({ date: x[0], s: x[1], dom: x[2], ext: x[3], h: x[4], a: x[5], bt: x[6] }))
      .filter(m => m.s === 'F' && m.h != null && m.a != null).sort((x, y) => x.date.localeCompare(y.date));
    Object.keys(PRINC).forEach(code => { if (st[code]) try { rejouer(PRINC[code][0], conv(st[code].e), M, R); } catch (e) {} });
    Object.keys(M.LIGUES).forEach(code => {   // championnats en plus (déjà téléchargés par ligues.js)
      if (!st2[code]) return;
      const ms = conv(st2[code].e);
      if (!M.LIGUES[code].buteurs) ms.forEach(m => delete m.bt);
      try { rejouer(M.LIGUES[code].nom, ms, M, R); } catch (e) {}
    });
    R.agg = Object.values(R.agg);
    R.histoBt.sort((a, b) => b.date.localeCompare(a.date) || b.p - a.p);
    R.histoSc.sort((a, b) => b.date.localeCompare(a.date));
    resultat = R; empreinte = emp;
    return R;
  }

  function somme(filtre) {
    const o = { n: 0, ok: 0, sp: 0 };
    if (!resultat) return o;
    resultat.agg.filter(filtre).forEach(b => { o.n += b.n; o.ok += b.ok; o.sp += b.sp; });
    return o;
  }

  async function lancer() {
    if (occupe) return;
    occupe = true;
    try { await telecharger(); } catch (e) {}
    occupe = false;
    setTimeout(() => { calculer(); pret = true; notifier(); }, 50);
  }

  window.PS_REUSSITE = {
    scores: scores, somme: somme, SEUIL_B: SEUIL_B,
    get pret() { return pret; },
    get data() { return resultat; },
    recalculer: () => { calculer(); },
  };
  // calcul tout de suite avec ce qu'on a déjà, puis mise à jour en arrière-plan
  setTimeout(() => { if (lire().t) { calculer(); pret = true; notifier(); } lancer(); }, 1500);
  // quand ligues.js a de nouvelles données, on refait le calcul (au plus toutes les 2 min)
  setInterval(() => { if (pret) { const avant = resultat; calculer(); if (resultat !== avant) notifier(); } }, 120000);
  setInterval(lancer, DELAI);
})();
