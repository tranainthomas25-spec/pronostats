// PronoStats – penalty potentiel dans les 5 grands championnats (API-Football, clé dans les secrets GitHub).
// Garde un cache (ligues-cache.json) pour ne demander les penalties de chaque match qu'une seule fois
// et rester sous la limite de 100 requêtes par jour du compte gratuit.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const KEY = process.env.APIFOOTBALL_KEY;
if (!KEY) { console.log('Pas de clé APIFOOTBALL_KEY : championnats ignorés.'); process.exit(0); }
const BASE = 'https://v3.football.api-sports.io/';
const LIGUES = { 61: 'Ligue 1', 39: 'Premier League', 140: 'Liga', 135: 'Serie A', 78: 'Bundesliga' };
const now = new Date();
const SAISON = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1; // 2026/27 -> 2026
const SAISONS = [SAISON, SAISON - 1, 2024, 2023, 2022]; // la formule gratuite n'ouvre que 2022-2024 : historique
const AUJ = new Date().toISOString().slice(0, 10);
const RESERVE = 15;                  // requêtes laissées libres pour d'autres usages
const MAX_LOTS = 45;                 // lots de 20 matchs par passage au maximum
const JOURS = 8;
const K_ARB = 12, K_EQ = 15, POIDS_EQ = 0.45;
const CACHE = 'ligues-cache.json';
const FINI = ['FT', 'AET', 'PEN'];

const sleep = ms => new Promise(r => setTimeout(r, ms));
let C = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
C.matchs = C.matchs || {}; C.ko = C.ko || {}; C.listes = C.listes || {};
let nbReq = 0, dernier = 0;

async function api(chemin) {
  const att = 6500 - (Date.now() - dernier); if (att > 0) await sleep(att);
  dernier = Date.now(); nbReq++;
  const r = await fetch(BASE + chemin, { headers: { 'x-apisports-key': KEY } });
  const j = await r.json();
  const err = j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length);
  if (err) { const e = new Error(JSON.stringify(j.errors)); e.det = j.errors; throw e; }
  return j.response;
}

// ---------- 1. Quota restant ----------
let reste = 100;
try {
  const st = await api('status');
  const q = (st && st.requests) || {};
  console.log('Formule :', st && st.subscription && st.subscription.plan);
  reste = (q.limit_day || 100) - (q.current || 0);
  console.log(`Quota API-Football : ${q.current}/${q.limit_day} utilisées aujourd'hui`);
} catch (e) { console.log('Statut illisible :', e.message); }
let budget = reste - RESERVE;
if (budget < 3) { console.log('Quota presque épuisé : on garde les données d\'hier.'); process.exit(0); }

// ---------- 2. Listes de matchs (arbitre inclus) ----------
const sansAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
function refInfo(raw) {
  if (!raw) return null;
  const [nom, pays] = raw.split(',').map(x => (x || '').trim());
  const parts = sansAcc(nom).toLowerCase().replace(/[^a-z .'-]/g, '').split(/[\s.]+/).filter(Boolean);
  if (!parts.length) return null;
  return { key: parts[parts.length - 1] + ' ' + parts[0][0], nom, pays: pays || '' };
}
for (const lg of Object.keys(LIGUES)) for (const s of SAISONS) {
  const cle = lg + '-' + s;
  if (C.ko[cle] && Date.now() - Date.parse(C.ko[cle].jour || 0) < 7 * 864e5) continue; // refusé : on réessaie chaque semaine (au cas où la formule change)
  if (s !== SAISON && C.listes[cle]) continue;          // saison passée déjà complète
  if (budget < 1) break;
  try {
    const liste = await api(`fixtures?league=${lg}&season=${s}`); budget--;
    let finis = 0;
    for (const f of liste) {
      const id = String(f.fixture.id), old = C.matchs[id] || {};
      C.matchs[id] = { lg: +lg, s, d: f.fixture.date, st: f.fixture.status?.short, ref: f.fixture.referee || old.ref || null,
        h: f.teams.home.name, a: f.teams.away.name, hid: f.teams.home.id, aid: f.teams.away.id, p: old.p };
      if (FINI.includes(f.fixture.status?.short)) finis++;
    }
    if (s !== SAISON && finis >= liste.length - 2) C.listes[cle] = true;
    delete C.ko[cle];
    console.log(`${LIGUES[lg]} ${s}/${s + 1} : ${liste.length} matchs`);
  } catch (e) {
    console.log(`${LIGUES[lg]} ${s} refusé :`, e.message);
    if (e.det && (e.det.plan || e.det.season)) C.ko[cle] = { jour: AUJ, msg: e.message };
  }
}

// ---------- 2b. Matchs des prochains jours (avec arbitre), même sans accès à la saison ----------
for (let j = 0; j < 4 && budget > 0; j++) {
  const jour = new Date(Date.now() + j * 864e5).toISOString().slice(0, 10);
  try {
    const liste = await api(`fixtures?date=${jour}&timezone=Europe/Paris`); budget--;
    let n = 0;
    for (const f of liste) {
      if (!LIGUES[f.league?.id]) continue;
      const id = String(f.fixture.id), old = C.matchs[id] || {};
      C.matchs[id] = { lg: f.league.id, s: f.league.season, d: f.fixture.date, st: f.fixture.status?.short, ref: f.fixture.referee || old.ref || null,
        h: f.teams.home.name, a: f.teams.away.name, hid: f.teams.home.id, aid: f.teams.away.id, p: old.p, futur: true };
      n++;
    }
    console.log(`Matchs du ${jour} : ${n} dans les 5 championnats (${liste.filter(f => LIGUES[f.league?.id] && f.fixture.referee).length} avec arbitre)`);
  } catch (e) { console.log(`Matchs du ${jour} refusés :`, e.message); }
}

// ---------- 3. Penalties des matchs terminés (20 matchs par requête) ----------
const aFaire = Object.entries(C.matchs).filter(([, m]) => FINI.includes(m.st) && !Array.isArray(m.p) && !m.futur)
  .sort((x, y) => Date.parse(y[1].d) - Date.parse(x[1].d)).map(([id]) => id);
let lots = 0;
while (aFaire.length && budget > 0 && lots < MAX_LOTS) {
  const ids = aFaire.splice(0, 20);
  try {
    const rep = await api('fixtures?ids=' + ids.join('-')); budget--; lots++;
    for (const f of rep) {
      const m = C.matchs[String(f.fixture.id)]; if (!m) continue;
      if (f.fixture.referee) m.ref = f.fixture.referee;
      m.p = (f.events || []).filter(e => e.type === 'Goal' && /penalty/i.test(e.detail || '') && !/shootout/i.test(e.comments || ''))
        .map(e => e.team?.id);
    }
  } catch (e) { console.log('Lot refusé :', e.message); break; }
}
console.log(`Penalties récupérés pour ${lots * 20} matchs max, ${aFaire.length} encore en attente. Requêtes : ${nbReq}`);
writeFileSync(CACHE, JSON.stringify(C));

// ---------- 4. Statistiques ----------
const tous = Object.entries(C.matchs).map(([id, m]) => ({ id, ...m }));
const connus = tous.filter(m => FINI.includes(m.st) && Array.isArray(m.p));
const bases = {}, arb = new Map(), eq = new Map();
for (const m of connus) {
  const b = bases[m.lg] = bases[m.lg] || { matchs: 0, penalties: 0, avec: 0 };
  b.matchs++; b.penalties += m.p.length; if (m.p.length) b.avec++;
  const r = refInfo(m.ref);
  if (r) {
    const o = arb.get(r.key) || { nom: r.nom, pays: r.pays, n: 0, p: 0, hist: [], lgs: {} };
    if (r.nom.length > o.nom.length) o.nom = r.nom;
    o.n++; o.p += m.p.length; o.lgs[m.lg] = (o.lgs[m.lg] || 0) + 1;
    o.hist.push({ d: m.d.slice(0, 10), m: `${m.h} – ${m.a}`, c: LIGUES[m.lg], p: m.p.length });
    arb.set(r.key, o);
  }
  for (const [tid, nom] of [[m.hid, m.h], [m.aid, m.a]]) {
    const o = eq.get(tid) || { nom, n: 0, obt: 0, conc: 0 }; o.n++; eq.set(tid, o);
  }
  m.p.forEach(t => { const adv = t === m.hid ? m.aid : m.hid; if (eq.has(t)) eq.get(t).obt++; if (eq.has(adv)) eq.get(adv).conc++; });
}
for (const b of Object.values(bases)) { b.parMatch = +(b.penalties / b.matchs).toFixed(3); b.avecPenalty = +(b.avec / b.matchs).toFixed(3); }
const lisse = (x, n, moy, k) => (x + k * moy) / (n + k);
arb.forEach(o => o.hist.sort((x, y) => (y.d > x.d ? 1 : -1)));

function analyse(m) {
  const b = bases[m.lg]; if (!b || b.matchs < 20) return null;
  const p0 = b.penalties / b.matchs, demi = p0 / 2;
  const r = refInfo(m.ref), A = r && arb.get(r.key);
  const ED = eq.get(m.hid), EE = eq.get(m.aid);
  const tArb = A ? lisse(A.p, A.n, p0, K_ARB) : p0;
  const oD = ED ? lisse(ED.obt, ED.n, demi, K_EQ) : demi, cD = ED ? lisse(ED.conc, ED.n, demi, K_EQ) : demi;
  const oE = EE ? lisse(EE.obt, EE.n, demi, K_EQ) : demi, cE = EE ? lisse(EE.conc, EE.n, demi, K_EQ) : demi;
  const attD = oD * cE / demi, attE = oE * cD / demi;
  const fArb = tArb / p0, fEq = Math.pow((attD + attE) / p0, POIDS_EQ);
  const lambda = Math.min(p0 * fArb * fEq, 1.8), proba = 1 - Math.exp(-lambda), partD = attD / (attD + attE);
  const n = A ? A.n : 0;
  return {
    id: 'L' + m.id, comp: LIGUES[m.lg], date: m.d, dom: m.h, ext: m.a, ligue: true,
    arbitre: r ? { nom: A ? A.nom : r.nom, pays: r.pays, n, pens: A ? A.p : 0, taux: A ? A.p / A.n : null, lisse: tArb, hist: A ? A.hist.slice(0, 10) : [] } : null,
    var: null,
    equipes: { dom: ED ? { n: ED.n, obt: ED.obt, conc: ED.conc } : null, ext: EE ? { n: EE.n, obt: EE.obt, conc: EE.conc } : null },
    facteurs: { arbitre: +fArb.toFixed(3), var: 1, equipes: +fEq.toFixed(3) },
    lambda: +lambda.toFixed(3), proba: +proba.toFixed(4),
    penDom: +(proba * partD).toFixed(4), penExt: +(proba * (1 - partD)).toFixed(4),
    fiab: !r ? 'inconnu' : n >= 25 ? 'solide' : n >= 12 ? 'moyen' : 'faible',
  };
}

const t0 = Date.now(), lim = t0 + JOURS * 864e5;
const prochains = tous.filter(m => {
  const t = Date.parse(m.d);
  return !FINI.includes(m.st) && t >= t0 - 3 * 3600e3 && t <= lim && (m.ref || t <= t0 + 2 * 864e5);
}).sort((x, y) => Date.parse(x.d) - Date.parse(y.d)).map(analyse).filter(Boolean);
const recents = connus.filter(m => Date.parse(m.d) > t0 - 10 * 864e5).map(m => { const a = analyse(m); return a && { ...a, reel: m.p.length }; }).filter(Boolean);
const classement = [...arb.values()].filter(a => a.n >= 8)
  .map(a => ({ nom: a.nom, pays: a.pays, n: a.n, pens: a.p, taux: +(a.p / a.n).toFixed(3),
    ligue: LIGUES[Object.entries(a.lgs).sort((x, y) => y[1] - x[1])[0][0]] }))
  .sort((x, y) => y.taux - x.taux);

const nomsBases = {}; for (const [lg, b] of Object.entries(bases)) nomsBases[LIGUES[lg]] = b;
writeFileSync('ligues.json', JSON.stringify({
  maj: new Date().toISOString(),
  source: 'API-Football – 5 grands championnats (historique ' + Object.keys(C.listes).map(k => k.split('-')[1]).filter((v, i, a) => a.indexOf(v) === i).sort().join(', ') + ')',
  bases: nomsBases, enAttente: aFaire.length, refus: C.ko,
  prochains, recents, classement,
}));
console.log(`OK championnats : ${connus.length} matchs avec penalties connus, ${prochains.length} à venir, ${classement.length} arbitres classés.`);
