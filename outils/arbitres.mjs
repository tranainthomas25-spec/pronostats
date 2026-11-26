// PronoStats – analyse « penalty potentiel » selon l'arbitre (Coupes d'Europe).
// Lancé chaque jour par GitHub (voir .github/workflows/arbitres.yml) : lit l'API publique de l'UEFA,
// calcule le taux de penalties de chaque arbitre, de chaque équipe VAR et de chaque équipe,
// puis écrit arbitres.json que l'onglet « Pénos » de l'appli affiche.
import { writeFileSync } from 'node:fs';

const API = 'https://match.uefa.com/v5/matches';
const COMPS = { 1: 'Ligue des champions', 14: 'Ligue Europa', 2019: 'Ligue Conférence' };
const now = new Date();
const SAISON = now.getUTCMonth() >= 6 ? now.getUTCFullYear() + 1 : now.getUTCFullYear(); // 2026/27 -> 2027
const SAISONS_ARB = [SAISON - 2, SAISON - 1, SAISON];   // arbitres : 3 saisons
const SAISONS_EQ = [SAISON - 1, SAISON];                 // équipes : 2 saisons (effectifs récents)
const JOURS = 8;                                         // matchs à venir affichés
const K_ARB = 12, K_VAR = 20, K_EQ = 10;                 // « prudence » : nb de matchs fictifs à la moyenne
const POIDS_VAR = 0.3, POIDS_EQ = 0.6;

const pick = o => (o && (o.FR || o.EN || Object.values(o)[0])) || '';
const nomEq = t => (t && (pick(t.translations?.displayName) || t.internationalName || pick(t.translations?.displayOfficialName))) || '?';
const nomPers = p => p ? (pick(p.translations?.name) || [pick(p.translations?.firstName), pick(p.translations?.lastName)].join(' ').trim() || '?') : '?';
const paysPers = p => p ? (p.countryCode || '') : '';
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function get(url, essais = 4) {
  for (let i = 0; i < essais; i++) {
    try {
      const r = await fetch(url, { headers: { 'accept': 'application/json', 'user-agent': 'Mozilla/5.0 PronoStats' } });
      if (r.ok) return await r.json();
      console.log('HTTP', r.status, url);
    } catch (e) { console.log('Erreur', e.message, url); }
    await sleep(1500 * (i + 1));
  }
  throw new Error('Échec ' + url);
}

async function matchsSaison(comp, saison) {
  const out = [], LIM = 100;
  for (let off = 0; off < 3000; off += LIM) {
    let lot;
    try { lot = await get(`${API}?competitionId=${comp}&seasonYear=${saison}&limit=${LIM}&offset=${off}&order=ASC`); }
    catch (e) { console.log(e.message); break; }
    if (!Array.isArray(lot) || !lot.length) break;
    out.push(...lot);
    if (lot.length < LIM) break;
    await sleep(250);
  }
  console.log(COMPS[comp], saison, out.length, 'matchs');
  return out;
}

// penalties sifflés pendant le match (hors séance de tirs au but) : marqués + ratés
function penalties(m) {
  const pe = m.playerEvents || {}, vus = new Set(), res = [];
  const add = (e, rate) => {
    if (!e || e.phase === 'PENALTY') return;
    const cle = e.id || `${e.teamId}-${e.time?.minute}-${e.time?.second}`;
    const cle2 = `${e.teamId}-${e.time?.minute}`;
    if (vus.has(cle) || vus.has(cle2)) return;
    vus.add(cle); vus.add(cle2);
    res.push({ team: String(e.teamId), rate, min: e.time?.minute });
  };
  (pe.scorers || []).forEach(s => { if (s.goalType === 'PENALTY') add(s, false); });
  (pe.penaltyScorers || []).forEach(s => add(s, s.penaltyType === 'MISSED'));
  (pe.penaltiesMissed || []).forEach(s => add(s, true));
  return res;
}
const role = (m, r) => (m.referees || []).find(x => x.role === r)?.person;
const dateM = m => m.kickOffTime?.dateTime || m.kickOffTime?.date || '';

const tous = [];
const vusId = new Set();
for (const comp of Object.keys(COMPS)) for (const s of SAISONS_ARB) {
  for (const m of await matchsSaison(comp, s)) {
    if (vusId.has(m.id)) continue; vusId.add(m.id);
    m._comp = COMPS[comp]; m._saison = s; tous.push(m);
  }
}
if (tous.length < 100) throw new Error('Trop peu de matchs récupérés (' + tous.length + '), arrêt sans écraser le fichier.');

const finis = tous.filter(m => m.status === 'FINISHED');
const avenir = tous.filter(m => m.status !== 'FINISHED');

// ---------- Statistiques ----------
const arb = new Map(), vr = new Map(), eq = new Map();
const plus = (map, id, nom, pays, n, p, extra) => {
  const o = map.get(id) || { nom, pays, n: 0, p: 0, hist: [] };
  o.n += n; o.p += p; if (extra) o.hist.push(extra); map.set(id, o);
};
let totM = 0, totP = 0;
for (const m of finis) {
  const pens = penalties(m), np = pens.length;
  const dom = String(m.homeTeam?.id), ext = String(m.awayTeam?.id);
  totM++; totP += np;
  const r = role(m, 'REFEREE');
  if (r) plus(arb, r.id, nomPers(r), paysPers(r), 1, np,
    { d: dateM(m).slice(0, 10), m: `${nomEq(m.homeTeam)} – ${nomEq(m.awayTeam)}`, c: m._comp, p: np });
  const v = role(m, 'VIDEO_ASSISTANT_REFEREE');
  if (v) plus(vr, v.id, nomPers(v), paysPers(v), 1, np);
  if (SAISONS_EQ.includes(m._saison)) {
    for (const [id, t] of [[dom, m.homeTeam], [ext, m.awayTeam]]) {
      const o = eq.get(id) || { nom: nomEq(t), n: 0, obt: 0, conc: 0 };
      o.n++; eq.set(id, o);
    }
    pens.forEach(p => {
      const adv = p.team === dom ? ext : dom;
      if (eq.has(p.team)) eq.get(p.team).obt++;
      if (eq.has(adv)) eq.get(adv).conc++;
    });
  }
}
const p0 = totP / totM;          // penalties par match (moyenne générale)
const demi = p0 / 2;             // par équipe
const lisse = (x, n, moy, k) => (x + k * moy) / (n + k);

function analyse(m) {
  const r = role(m, 'REFEREE'), v = role(m, 'VIDEO_ASSISTANT_REFEREE');
  const A = r && arb.get(r.id), V = v && vr.get(v.id);
  const dom = String(m.homeTeam?.id), ext = String(m.awayTeam?.id);
  const ED = eq.get(dom), EE = eq.get(ext);
  const tArb = A ? lisse(A.p, A.n, p0, K_ARB) : p0;
  const tVar = V ? lisse(V.p, V.n, p0, K_VAR) : p0;
  const oD = ED ? lisse(ED.obt, ED.n, demi, K_EQ) : demi, cD = ED ? lisse(ED.conc, ED.n, demi, K_EQ) : demi;
  const oE = EE ? lisse(EE.obt, EE.n, demi, K_EQ) : demi, cE = EE ? lisse(EE.conc, EE.n, demi, K_EQ) : demi;
  const attD = oD * cE / demi, attE = oE * cD / demi;       // penalties attendus pour chaque équipe
  const fArb = tArb / p0, fVar = Math.pow(tVar / p0, POIDS_VAR), fEq = Math.pow((attD + attE) / p0, POIDS_EQ);
  const lambda = Math.min(p0 * fArb * fVar * fEq, 1.6);
  const proba = 1 - Math.exp(-lambda);
  const partD = attD / (attD + attE);
  const n = A ? A.n : 0;
  return {
    id: m.id, comp: m._comp, date: dateM(m),
    phase: pick(m.round?.translations?.name) || '',
    dom: nomEq(m.homeTeam), ext: nomEq(m.awayTeam),
    arbitre: r ? { nom: nomPers(r), pays: paysPers(r), n, pens: A ? A.p : 0, taux: A ? A.p / A.n : null, lisse: tArb,
      hist: A ? A.hist.slice(-10).reverse() : [] } : null,
    var: v ? { nom: nomPers(v), pays: paysPers(v), n: V ? V.n : 0, pens: V ? V.p : 0, lisse: tVar } : null,
    equipes: {
      dom: ED ? { n: ED.n, obt: ED.obt, conc: ED.conc } : null,
      ext: EE ? { n: EE.n, obt: EE.obt, conc: EE.conc } : null,
    },
    facteurs: { arbitre: +fArb.toFixed(3), var: +fVar.toFixed(3), equipes: +fEq.toFixed(3) },
    lambda: +lambda.toFixed(3), proba: +proba.toFixed(4),
    penDom: +(proba * partD).toFixed(4), penExt: +(proba * (1 - partD)).toFixed(4),
    fiab: !r ? 'inconnu' : n >= 25 ? 'solide' : n >= 12 ? 'moyen' : 'faible',
  };
}

const lim = Date.now() + JOURS * 864e5, debut = Date.now() - 3 * 3600e3;
const prochains = avenir
  .filter(m => { const t = Date.parse(dateM(m)); return t >= debut && t <= lim; })
  .sort((a, b) => Date.parse(dateM(a)) - Date.parse(dateM(b)))
  .map(analyse);

// derniers matchs joués (pour contrôler le modèle après coup)
const recents = finis
  .filter(m => Date.parse(dateM(m)) > Date.now() - 10 * 864e5)
  .map(m => ({ ...analyse(m), reel: penalties(m).length }));

const classement = [...arb.values()].filter(a => a.n >= 10)
  .map(a => ({ nom: a.nom, pays: a.pays, n: a.n, pens: a.p, taux: +(a.p / a.n).toFixed(3) }))
  .sort((a, b) => b.taux - a.taux);

const sortie = {
  maj: new Date().toISOString(),
  source: 'API publique UEFA – C1, C3, C4, saisons ' + SAISONS_ARB.map(s => `${s - 1}/${String(s).slice(2)}`).join(', '),
  base: { matchs: totM, penalties: totP, parMatch: +p0.toFixed(3), avecPenalty: +(finis.filter(m => penalties(m).length).length / totM).toFixed(3) },
  prochains, recents, classement,
};
writeFileSync('arbitres.json', JSON.stringify(sortie));
console.log(`OK : ${totM} matchs, ${totP} penalties (${p0.toFixed(3)}/match), ${prochains.length} matchs à venir, ${classement.length} arbitres classés`);
