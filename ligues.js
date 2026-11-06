/* PronoStats – championnats en plus, chargés directement depuis le téléphone (données publiques ESPN).
   Source non officielle : peut cesser de fonctionner sans prévenir. Pour en ajouter un, complète LIGUES. */
(function () {
  const LIGUES = {
    'fra.2': { nom: 'Ligue 2', debut: 'aout' },
    'tsdb:4422': { nom: 'Ekstraklasa', debut: 'aout', src: 'tsdb' },   // Pologne, via TheSportsDB (gratuit)
  };
  const TSDB = 'https://www.thesportsdb.com/api/v1/json/123/';
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const etatTsdb = s => /^(FT|AET|PEN|AP|Match Finished)$/i.test(s) ? 'F' : /^(NS|TBD|Not Started)$/i.test(s) || !s ? 'P'
    : /^(PST|CANC|ABD|AWD|WO|SUSP|INT|Postponed|Cancelled)$/i.test(s) ? 'X' : 'L';
  const saisonTsdb = () => { const n = new Date(), y = n.getFullYear(); return n.getMonth() >= 6 ? y + '-' + (y + 1) : (y - 1) + '-' + y; };

  /* TheSportsDB : on charge la saison journée par journée ; les journées terminées restent en mémoire du téléphone. */
  async function telechargerTsdb(code, lg) {
    const id = code.split(':')[1], saison = saisonTsdb(), limite = Date.now() + 9 * 864e5;
    if (lg.s !== saison) { lg.s = saison; lg.e = {}; lg.done = []; }
    lg.done = lg.done || [];
    for (let r = 1; r <= 50; r++) {
      if (lg.done.indexOf(r) >= 0) continue;
      let j = null;
      for (let essai = 0; essai < 3 && !j; essai++) {   // source gratuite limitée (~30 requêtes/min) : on patiente et on réessaie
        try { j = await fetch(TSDB + 'eventsround.php?id=' + id + '&r=' + r + '&s=' + saison).then(x => x.ok ? x.json() : Promise.reject(x.status)); }
        catch (e) { await pause(15000); }
      }
      if (!j) return false;
      const evs = (j && j.events) || [];
      if (!evs.length) break;
      let premier = Infinity, fini = true;
      evs.forEach(ev => {
        const ts = ev.strTimestamp ? (/[Z+]/.test(ev.strTimestamp.slice(10)) ? ev.strTimestamp : ev.strTimestamp + 'Z')
          : ev.dateEvent + 'T' + (ev.strTime || '00:00:00') + 'Z';
        const d = new Date(ts), e = etatTsdb(ev.strStatus);
        const h = ev.intHomeScore == null || ev.intHomeScore === '' ? null : +ev.intHomeScore, a = ev.intAwayScore == null || ev.intAwayScore === '' ? null : +ev.intAwayScore;
        lg.e[ev.idEvent] = [d.toISOString(), e === 'P' && h != null && d < new Date() ? 'F' : e, ev.strHomeTeam, ev.strAwayTeam, h, a];
        premier = Math.min(premier, +d);
        if (lg.e[ev.idEvent][1] !== 'F' && lg.e[ev.idEvent][1] !== 'X') fini = false;
      });
      if (fini) lg.done.push(r);
      if (premier > limite) break;
      await pause(700);
      if (fini) fusionnerPartiel();
    }
    return true;
  }
  let fusionnerPartiel = () => {};
  const URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/';
  const CLE = 'ps_ligues_v2', DELAI = 30 * 60 * 1000;   // actualisation au plus toutes les 30 min
  const MARCHES = ['Over 1,5 match', 'Over 2,5 match', 'Over 3,5 match', 'Domicile Over 0,5', 'Domicile Over 1,5', 'Domicile Over 2,5',
    'Extérieur Over 0,5', 'Extérieur Over 1,5', 'Extérieur Over 2,5', 'Les deux équipes marquent – Oui', 'Les deux équipes marquent – Non',
    'Victoire domicile (1)', 'Match nul (N)', 'Victoire extérieur (2)', 'Double chance 1N', 'Double chance N2', 'Double chance 12'];

  /* ---------- Modèle (identique au tableau over/under et à la feuille Google) ---------- */
  const P = { ALPHA_MAX: 0.30, K: 1.2, PRIOR: 4, L_DEFAUT: 1.35, MIN_LIGUE: 6, MJ_MIN: 2, MJ_FAIBLE: 10, HOME: 1.0, LMIN: 0.2, LMAX: 4.5, BETA: 0.10, REF: 0.45 };
  const poisson = (k, l) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return Math.exp(-l) * Math.pow(l, k) / f; };
  const cdf = (k, l) => { let s = 0; for (let i = 0; i <= k; i++) s += poisson(i, l); return s; };
  const over = (l, k) => 1 - cdf(k, l);

  function profils(termines) {
    const par = {};
    termines.forEach(m => { (par[m.dom] = par[m.dom] || []).push([m.h, m.a, 'D']); (par[m.ext] = par[m.ext] || []).push([m.a, m.h, 'E']); });
    const out = {};
    Object.keys(par).forEach(eq => {
      const l = par[eq], d5 = l.slice(-5), s = (arr, i) => arr.reduce((t, x) => t + x[i], 0);
      const dom = l.filter(x => x[2] === 'D'), ext = l.filter(x => x[2] === 'E');
      const moy = (arr, i) => arr.length ? Math.round(100 * s(arr, i) / arr.length) / 100 : null;
      const pct = f => Math.round(100 * l.filter(f).length / l.length);
      out[eq] = { n: l.length, gf: s(l, 0), ga: s(l, 1), f5: s(d5, 0) / d5.length, a5: s(d5, 1) / d5.length,
        pts5: d5.length === 5 ? (3 * d5.filter(x => x[0] > x[1]).length + d5.filter(x => x[0] === x[1]).length) / 15 : null,
        forme: d5.map(x => x[0] > x[1] ? 'V' : x[0] === x[1] ? 'N' : 'D').join(''),
        domPour: moy(dom, 0), domContre: moy(dom, 1), extPour: moy(ext, 0), extContre: moy(ext, 1),
        over25: pct(x => x[0] + x[1] > 2), btts: pct(x => x[0] > 0 && x[1] > 0) };
    });
    return out;
  }

  function prono(a, b, L) {
    if (!a || !b || a.n < P.MJ_MIN || b.n < P.MJ_MIN) return null;
    const alA = Math.min(P.ALPHA_MAX, P.K * 5 / a.n), alB = Math.min(P.ALPHA_MAX, P.K * 5 / b.n);
    const lisse = (n, saison, recent, al) => (n * ((1 - al) * saison + al * recent) + P.PRIOR * L) / (n + P.PRIOR);
    const attA = lisse(a.n, a.gf / a.n, a.f5, alA), defA = lisse(a.n, a.ga / a.n, a.a5, alA);
    const attB = lisse(b.n, b.gf / b.n, b.f5, alB), defB = lisse(b.n, b.ga / b.n, b.a5, alB);
    const fA = a.pts5 == null ? 1 : 1 + P.BETA * (a.pts5 - P.REF), fB = b.pts5 == null ? 1 : 1 + P.BETA * (b.pts5 - P.REF);
    const borne = x => Math.max(P.LMIN, Math.min(P.LMAX, x));
    const lD = borne(L * (attA / L) * (defB / L) * P.HOME * fA * (2 - fB));
    const lE = borne(L * (attB / L) * (defA / L) * (2 - P.HOME) * fB * (2 - fA));
    const G = lD + lE;
    let p1 = 0, pN = 0, p2 = 0, best = [0, 0, 0];
    for (let i = 0; i <= 15; i++) {
      const pi = poisson(i, lD);
      pN += pi * poisson(i, lE);
      if (i >= 1) { p1 += pi * cdf(i - 1, lE); p2 += poisson(i, lE) * cdf(i - 1, lD); }
      for (let j = 0; j <= 10; j++) { const ps = pi * poisson(j, lE); if (ps > best[2]) best = [i, j, ps]; }
    }
    const btts = over(lD, 0) * over(lE, 0);
    const v = [over(G, 1), over(G, 2), over(G, 3), over(lD, 0), over(lD, 1), over(lD, 2), over(lE, 0), over(lE, 1), over(lE, 2),
      btts, 1 - btts, p1, pN, p2, p1 + pN, pN + p2, p1 + p2];
    const p = {}; MARCHES.forEach((m, k) => p[m] = v[k]);
    return { lD: lD, lE: lE, score: best[0] + '-' + best[1], fiab: Math.min(a.n, b.n) < P.MJ_FAIBLE ? '⚠ Échantillon faible' : '✔ OK', p: p };
  }

  /* ---------- Téléchargement (mois passés gardés en mémoire du téléphone) ---------- */
  const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch (e) { return {}; } };
  const ecrire = o => { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) {} };
  const ym = d => d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0');

  function moisSaison(debut) {
    const n = new Date(), y = n.getFullYear(), m = n.getMonth() + 1;
    let [a, b] = debut === 'janv' ? [y, 1] : (m >= 7 ? [y, 7] : [y - 1, 7]);
    const fin = ym(new Date(y, m, 1)), out = [];   // jusqu'au mois prochain
    while ((a + String(b).padStart(2, '0')) <= fin) { out.push(a + String(b).padStart(2, '0')); if (++b > 12) { b = 1; a++; } }
    return out;
  }

  async function telecharger(force, src) {
    const st = lire(), courant = ym(new Date()), cleT = 't_' + src;
    if (!force && st[cleT] && Date.now() - st[cleT] < DELAI) return st;
    const taches = []; let incomplet = false;
    fusionnerPartiel = () => ecrire(st);   // garde en mémoire les journées déjà chargées
    Object.keys(LIGUES).filter(code => (LIGUES[code].src || 'espn') === src).forEach(code => {
      const lg = st[code] = st[code] || { e: {}, m: [] };
      if (LIGUES[code].src === 'tsdb') { taches.push(telechargerTsdb(code, lg).then(ok => { if (!ok) incomplet = true; }).catch(() => { incomplet = true; })); return; }
      const mois = moisSaison(LIGUES[code].debut);
      Object.keys(lg.e).forEach(id => { if (lg.e[id][0].slice(0, 7).replace('-', '') < mois[0]) delete lg.e[id]; });
      lg.m = lg.m.filter(x => mois.indexOf(x) >= 0);
      mois.filter(mo => lg.m.indexOf(mo) < 0).forEach(mo => taches.push(
        fetch(URL + code + '/scoreboard?dates=' + mo).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(j => {
          (j.events || []).forEach(ev => {
            const c = ev.competitions && ev.competitions[0]; if (!c) return;
            const h = c.competitors.find(x => x.homeAway === 'home'), a = c.competitors.find(x => x.homeAway === 'away');
            if (!h || !a) return;
            const t = ev.status.type;
            lg.e[ev.id] = [ev.date, t.completed ? 'F' : t.state === 'in' ? 'L' : t.state === 'pre' ? 'P' : 'X',
              h.team.shortDisplayName || h.team.displayName, a.team.shortDisplayName || a.team.displayName,
              h.score === '' || h.score == null ? null : +h.score, a.score === '' || a.score == null ? null : +a.score];
          });
          if (mo < courant && new Date().getDate() >= 3) lg.m.push(mo);
        }).catch(() => {})));
    });
    await Promise.all(taches);
    st[cleT] = incomplet ? Date.now() - DELAI + 2 * 60 * 1000 : Date.now();   // si incomplet, on recommence dans 2 min
    ecrire(st);
    return st;
  }

  /* ---------- Fusion dans les données de l'appli ---------- */
  let base = null;   // copie des données principales avant ajout, pour pouvoir refaire la fusion
  function fusionner(st) {
    if (!D) return;
    if (!D._ligues) base = JSON.stringify(D);
    else if (base) D = JSON.parse(base);
    else return;
    const now = new Date(), debut = new Date(now - 30 * 864e5), fin = new Date(+now + 7 * 864e5);
    Object.keys(LIGUES).forEach(code => {
      const lg = st[code]; if (!lg) return;
      const comp = LIGUES[code].nom;
      const ms = Object.values(lg.e).map(x => ({ date: x[0], s: x[1], dom: x[2], ext: x[3], h: x[4], a: x[5] }))
        .sort((x, y) => x.date.localeCompare(y.date));
      const term = ms.filter(m => m.s === 'F' && m.h != null && m.a != null);
      if (!term.length) return;
      const pr = profils(term);
      const L = term.length >= P.MIN_LIGUE ? term.reduce((s, m) => s + m.h + m.a, 0) / (2 * term.length) : P.L_DEFAUT;
      const tab = Object.keys(pr).map(eq => {
        const l = term.filter(m => m.dom === eq || m.ext === eq);
        const g = l.filter(m => (m.dom === eq ? m.h > m.a : m.a > m.h)).length, n = l.filter(m => m.h === m.a).length;
        const bp = pr[eq].gf, bc = pr[eq].ga;
        return { comp: comp, equipe: eq, j: l.length, g: g, n: n, p: l.length - g - n, bp: bp, bc: bc, diff: bp - bc, pts: 3 * g + n, forme: pr[eq].forme };
      }).sort((x, y) => y.pts - x.pts || y.diff - x.diff || y.bp - x.bp);
      const pos = {};
      tab.forEach((t, i) => { t.pos = i + 1; pos[t.equipe] = i + 1; D.classements.push(t); });
      ms.forEach(m => {
        const d = new Date(m.date);
        if ((m.s === 'F' && d >= debut) || m.s === 'L') {
          D.resultats.push({ date: m.date, comp: comp, journee: '', dom: m.dom, score: (m.h || 0) + ' - ' + (m.a || 0), ext: m.ext, mt: '', statut: m.s === 'L' ? 'EN COURS' : 'Terminé' });
        } else if (m.s === 'P' && d >= now && d <= fin) {
          const a = pr[m.dom] || {}, b = pr[m.ext] || {};
          D.prochains.push({ date: m.date, comp: comp, dom: m.dom, ext: m.ext, posDom: pos[m.dom] || '', posExt: pos[m.ext] || '',
            formeDom: a.forme || '', formeExt: b.forme || '', domPour: a.domPour, domContre: a.domContre, extPour: b.extPour, extContre: b.extContre,
            over25Dom: a.over25, over25Ext: b.over25, bttsDom: a.btts, bttsExt: b.btts });
          const p = prono(pr[m.dom], pr[m.ext], L);
          if (p) D.pronos.push(Object.assign({ date: m.date, comp: comp, dom: m.dom, ext: m.ext }, p));
        }
      });
    });
    ['prochains', 'pronos'].forEach(k => D[k].sort((x, y) => x.date.localeCompare(y.date)));
    D.resultats.sort((x, y) => y.date.localeCompare(x.date));
    D._ligues = true;
    rendre();
  }

  let occupe = false, dernier = lire();   // dernières données connues : affichées tout de suite
  async function ajouter(force) {
    if (occupe) return;
    occupe = true;
    try {
      // 1) championnats rapides (ESPN) + ce qui est déjà en mémoire : affichage immédiat
      const st1 = await telecharger(force, 'espn');
      dernier = st1; fusionner(st1);
      // 2) championnats lents (TheSportsDB) en arrière-plan, puis on réaffiche
      const empreinte = st => JSON.stringify(Object.keys(LIGUES).filter(c => LIGUES[c].src === 'tsdb').map(c => st[c] && st[c].e));
      const avant = empreinte(st1);
      const st2 = await telecharger(force, 'tsdb');
      dernier = st2;
      if (empreinte(st2) !== avant) fusionner(st2);
    } catch (e) {} finally { occupe = false; }
  }

  // Après chaque chargement des données principales, on ajoute les championnats en plus.
  const chargerBase = charger;
  charger = async function (silencieux) {
    await chargerBase(silencieux);
    if (D && !D._ligues && dernier) fusionner(dernier);   // affichage immédiat avec ce qu'on a déjà
    ajouter(!silencieux);                                 // puis mise à jour en arrière-plan
  };
  // Filet de sécurité : dès que de nouvelles données arrivent sans les championnats en plus, on les ajoute.
  setInterval(() => { if (D && !D._ligues) { if (dernier) fusionner(dernier); if (!occupe) ajouter(false); } }, 1000);
})();
