'use strict';
/* FOOTBALL CAREER — JavaScript puro + localStorage. Sem backend. */

/* ================= 1. DADOS (edite aqui) ================= */
// Seleções: nome|bandeira|confederação|nível (1 = potência, 3 = menor)
const NATIONS = `Brasil|🇧🇷|CONMEBOL|1;Argentina|🇦🇷|CONMEBOL|1;Portugal|🇵🇹|UEFA|1;Espanha|🇪🇸|UEFA|1;França|🇫🇷|UEFA|1;Inglaterra|🇬🇧|UEFA|1;Alemanha|🇩🇪|UEFA|1;Itália|🇮🇹|UEFA|1;Holanda|🇳🇱|UEFA|1;Uruguai|🇺🇾|CONMEBOL|2;Colômbia|🇨🇴|CONMEBOL|2;Chile|🇨🇱|CONMEBOL|3;Equador|🇪🇨|CONMEBOL|3;Paraguai|🇵🇾|CONMEBOL|3;México|🇲🇽|CONCACAF|2;Estados Unidos|🇺🇸|CONCACAF|2;Canadá|🇨🇦|CONCACAF|3;Japão|🇯🇵|AFC|2;Coreia do Sul|🇰🇷|AFC|2;Austrália|🇦🇺|AFC|3;Arábia Saudita|🇸🇦|AFC|3;Bélgica|🇧🇪|UEFA|2;Croácia|🇭🇷|UEFA|2;Dinamarca|🇩🇰|UEFA|2;Suíça|🇨🇭|UEFA|2;Polônia|🇵🇱|UEFA|3;Suécia|🇸🇪|UEFA|3;Noruega|🇳🇴|UEFA|3;Turquia|🇹🇷|UEFA|3;Marrocos|🇲🇦|CAF|2;Senegal|🇸🇳|CAF|2;Nigéria|🇳🇬|CAF|3;Egito|🇪🇬|CAF|3;Costa do Marfim|🇨🇮|CAF|3;Gana|🇬🇭|CAF|3;Camarões|🇨🇲|CAF|3`
  .split(';').map(s => { const [n, f, conf, t] = s.split('|'); return { n, f, conf, tier: +t }; });

// Clubes: [país, liga, [[nome, força 0-100], ...]]
const LEAGUES = [
  ['Brasil', 'Brasileirão', [['Palmeiras', 82], ['Flamengo', 83], ['Botafogo', 75], ['Corinthians', 76], ['São Paulo', 75], ['Internacional', 74], ['Atlético-MG', 74], ['Fluminense', 72], ['Grêmio', 73], ['Cruzeiro', 71], ['Santos', 70], ['RB Bragantino', 69], ['Vasco', 67]]],
  ['Inglaterra', 'Premier League', [['Manchester City', 93], ['Liverpool', 90], ['Arsenal', 90], ['Chelsea', 85], ['Manchester United', 84], ['Tottenham', 82], ['Newcastle', 79], ['Aston Villa', 78]]],
  ['Espanha', 'La Liga', [['Real Madrid', 94], ['Barcelona', 91], ['Atlético de Madrid', 86], ['Real Sociedad', 76], ['Sevilla', 75], ['Valencia', 72]]],
  ['Alemanha', 'Bundesliga', [['Bayern de Munique', 91], ['Bayer Leverkusen', 85], ['Borussia Dortmund', 84], ['RB Leipzig', 82], ['Eintracht Frankfurt', 74]]],
  ['Itália', 'Serie A', [['Inter de Milão', 87], ['Milan', 83], ['Juventus', 83], ['Napoli', 82], ['Roma', 78], ['Lazio', 75]]],
  ['França', 'Ligue 1', [['Paris Saint-Germain', 89], ['Monaco', 77], ['Marseille', 76], ['Lyon', 75], ['Lille', 73]]],
  ['Portugal', 'Primeira Liga', [['Sporting', 80], ['Benfica', 80], ['Porto', 79], ['Braga', 70]]],
  ['Holanda', 'Eredivisie', [['PSV', 78], ['Ajax', 76], ['Feyenoord', 76]]],
  ['Argentina', 'Liga Argentina', [['River Plate', 76], ['Boca Juniors', 75], ['Racing', 68], ['Independiente', 66]]],
  ['Turquia', 'Süper Lig', [['Galatasaray', 72], ['Fenerbahçe', 72]]],
  ['Arábia Saudita', 'Saudi Pro League', [['Al-Hilal', 76], ['Al-Nassr', 75]]],
  ['Estados Unidos', 'MLS', [['Inter Miami', 63], ['LA Galaxy', 58]]],
  ['México', 'Liga MX', [['Club América', 66], ['Monterrey', 63]]]
];
const CLUBS = LEAGUES.flatMap(([country, league, list]) => list.map(([name, strength]) => ({ name, country, league, strength })));
const tierOf = s => s >= 88 ? 1 : s >= 82 ? 2 : s >= 72 ? 3 : 4;      // nível do clube pela força
const TIER_COLOR = ['', '#f5b73b', '#9bd0ff', '#22c277', '#8aa0b8'];
const LG_GAMES = { Bundesliga: 34, 'Ligue 1': 34, Eredivisie: 34, 'Primeira Liga': 34, MLS: 34, 'Saudi Pro League': 34, 'Liga MX': 34 };
const CUPS = { Brasil: 'Copa do Brasil', Inglaterra: 'FA Cup', Espanha: 'Copa del Rey', Alemanha: 'DFB-Pokal', Itália: 'Coppa Italia', França: 'Coupe de France', Portugal: 'Taça de Portugal', Holanda: 'KNVB Beker', Argentina: 'Copa Argentina' };
const CONF_CUP = { UEFA: 'Eurocopa', CONMEBOL: 'Copa América', CAF: 'Copa Africana de Nações', AFC: 'Copa da Ásia', CONCACAF: 'Copa Ouro' };
const EUROPE = ['Inglaterra', 'Espanha', 'Alemanha', 'Itália', 'França', 'Portugal', 'Holanda', 'Turquia'];

// Competição continental do clube (para adicionar competições, mexa aqui)
function continental(c) {
  if (['Brasil', 'Argentina'].includes(c.country)) return c.strength >= 68 ? { name: 'Libertadores', games: 9, top: true } : null;
  if (EUROPE.includes(c.country)) {
    if (c.strength >= 82) return { name: 'Champions League', games: 11, top: true };
    if (c.strength >= 72) return { name: 'Europa League', games: 9, top: false };
  }
  return null;
}

// Pesos do Overall por posição (soma = 1)
const POS = {
  GK: { n: 'Goleiro', w: { reflexes: .3, handling: .25, positioning: .25, kicking: .1, diving: .1 } },
  CB: { n: 'Zagueiro', w: { defending: .45, physical: .25, pace: .15, passing: .15 } },
  RB: { n: 'Lateral Direito', w: { pace: .25, defending: .25, passing: .2, dribbling: .15, physical: .15 } },
  LB: { n: 'Lateral Esquerdo', w: { pace: .25, defending: .25, passing: .2, dribbling: .15, physical: .15 } },
  CDM: { n: 'Volante', w: { defending: .35, passing: .25, physical: .25, dribbling: .15 } },
  CM: { n: 'Meia', w: { passing: .35, dribbling: .2, physical: .15, defending: .15, shooting: .15 } },
  CAM: { n: 'Meia Ofensivo', w: { passing: .3, dribbling: .25, shooting: .2, pace: .1, physical: .15 } },
  RW: { n: 'Ponta Direita', w: { pace: .25, dribbling: .3, shooting: .2, passing: .15, physical: .1 } },
  LW: { n: 'Ponta Esquerda', w: { pace: .25, dribbling: .3, shooting: .2, passing: .15, physical: .1 } },
  ST: { n: 'Atacante', w: { shooting: .35, pace: .2, dribbling: .2, passing: .1, physical: .15 } }
};
const ATTR = { pace: 'Ritmo', shooting: 'Finalização', passing: 'Passe', dribbling: 'Drible', defending: 'Defesa', physical: 'Físico', reflexes: 'Reflexos', handling: 'Defesa', diving: 'Saída do gol', positioning: 'Posicionamento', kicking: 'Jogo com os pés' };
const attrKeys = pos => pos === 'GK' ? ['reflexes', 'handling', 'diving', 'positioning', 'kicking'] : ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];
// g = gols por jogo, a = assistências por jogo (para um jogador "médio")
const RATE = { ST: { g: .5, a: .17 }, RW: { g: .32, a: .3 }, LW: { g: .32, a: .3 }, CAM: { g: .26, a: .35 }, CM: { g: .12, a: .2 }, CDM: { g: .05, a: .1 }, RB: { g: .04, a: .15 }, LB: { g: .04, a: .15 }, CB: { g: .05, a: .04 }, GK: { g: 0, a: .01 } };
const NUMBERS = { GK: [1, 12, 13, 22], CB: [2, 3, 4, 5, 15], RB: [2, 12, 16, 22], LB: [3, 6, 13, 17], CDM: [5, 6, 8, 14], CM: [8, 6, 14, 16, 20], CAM: [10, 8, 17, 21], RW: [7, 11, 17, 19], LW: [11, 10, 17, 18], ST: [9, 10, 11, 19, 20] };
// Personalidade (efeitos pequenos). Multiplicadores: goal, ast, inj, xp. Somas: q, growth, title, offer.
const TRAITS = { Profissional: { growth: .5 }, Talentoso: { q: 2, growth: .3 }, Líder: { title: .03, xp: 1.2 }, Artilheiro: { goal: 1.12 }, Criativo: { ast: 1.15 }, Resistente: { inj: .5 }, Ambicioso: { offer: 1, growth: .2 } };
const INJ = ['Lesão muscular', 'Tornozelo', 'Joelho', 'Coxa', 'Costas'];
const FORM = [null, { e: '🔴', t: 'Péssima' }, { e: '🟠', t: 'Ruim' }, { e: '🟡', t: 'Normal' }, { e: '🟢', t: 'Boa' }, { e: '🔥', t: 'Excelente' }];
// Eventos aleatórios: q = qualidade, play = minutos, inj = risco de lesão, offer = interesse, title = chance de título
const EVENTS = [
  { t: 'Seu treinador decidiu colocá-lo como titular.', play: .15, q: 1 },
  { t: 'Você perdeu espaço no elenco.', play: -.18, q: -1 },
  { t: 'Seu desempenho chamou a atenção de grandes clubes.', offer: 6 },
  { t: 'Torcedores começaram a pedir sua contratação.', offer: 4 },
  { t: 'Você sofreu uma pequena lesão durante o treinamento.', inj: 1.8 },
  { t: 'Você foi eleito jogador do mês.', q: 1.5, xp: 30 },
  { t: 'Você foi decisivo nos jogos de mata-mata.', title: .05, xp: 40 },
  { t: 'Pré-temporada excelente.', q: 2 },
  { t: 'Problemas pessoais abalaram sua concentração.', q: -2 }
];
// Decisões do jogador (aparecem em ~35% das temporadas)
const DECISIONS = [
  { ok: p => ['ST', 'RW', 'LW', 'CAM'].includes(p.pos), t: 'TREINADOR', q: 'Você prefere jogar como ponta ou atacante?', o: [
    ['PONTA', () => ({ attrs: { pace: 1, dribbling: 1 }, note: 'Você atuou como ponta: +1 Ritmo, +1 Drible.' })],
    ['ATACANTE', () => ({ attrs: { shooting: 2 }, note: 'Você atuou como centroavante: +2 Finalização.' })]] },
  { ok: () => true, t: 'PREPARADOR FÍSICO', q: 'O clube oferece um plano de treino extra. Qual foco?', o: [
    ['FOCO TÉCNICO', p => ({ attrs: p.pos === 'GK' ? { kicking: 1, diving: 1 } : { passing: 1, dribbling: 1, shooting: 1 }, note: 'O treino técnico extra rendeu +1 em alguns fundamentos.' })],
    ['FOCO FÍSICO', p => ({ attrs: p.pos === 'GK' ? { reflexes: 1, handling: 1 } : { pace: 1, physical: 1, defending: 1 }, note: 'O treino físico extra rendeu +1 em alguns atributos.' })],
    ['DESCANSAR', () => ({ form: 1, note: 'Você descansou e começou a temporada mais leve.' })]] },
  { ok: p => p.age >= 21, t: 'ELENCO', q: 'O treinador oferece a braçadeira de capitão.', o: [
    ['ACEITAR', () => ({ xp: 60, q: 1, note: 'Você assumiu a braçadeira de capitão.' })],
    ['RECUSAR', () => ({ form: 1, note: 'Você preferiu focar apenas no seu jogo.' })]] }
];

/* ================= 2. UTILITÁRIOS ================= */
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a), rint = (a, b) => Math.floor(rnd(a, b + 1));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), pick = a => a[Math.floor(Math.random() * a.length)], chance = p => Math.random() < p;
const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = m => m >= 1 ? '€' + (m >= 100 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, '')) + 'M' : '€' + Math.round(m * 1000) + 'K';
const wage = w => '€' + (w >= 1000 ? Math.round(w / 1000) + 'K' : w) + '/sem';
const seasonLabel = y => `${y}/${String(y + 1).slice(2)}`;
const clubOf = p => CLUBS.find(c => c.name === p.club);
const nationOf = p => NATIONS.find(n => n.n === p.nat);
const tAdd = (p, k) => p.traits.reduce((s, t) => s + (TRAITS[t][k] || 0), 0);
const tMul = (p, k) => p.traits.reduce((s, t) => s * (TRAITS[t][k] || 1), 1);
const lvlOf = xp => 1 + Math.floor(Math.sqrt(xp / 80));

/* ================= 3. REGRAS DO JOGO ================= */
// Overall = soma ponderada dos atributos da posição
function calculateOverall(pos, attrs) {
  return Math.round(Object.entries(POS[pos].w).reduce((s, [k, w]) => s + attrs[k] * w, 0));
}

// Valor de mercado (€ milhões): curva por overall × idade × potencial × clube × desempenho × títulos
const VT = [[45, .1], [50, .3], [55, .8], [60, 2], [65, 5], [70, 10], [75, 25], [80, 55], [85, 100], [90, 150], [95, 200], [99, 260]];
function marketValue(p, last) {
  let v = VT[VT.length - 1][1];
  if (p.ovr <= VT[0][0]) v = VT[0][1];
  else for (let i = 1; i < VT.length; i++) if (p.ovr <= VT[i][0]) { const [x0, y0] = VT[i - 1], [x1, y1] = VT[i]; v = y0 + (y1 - y0) * (p.ovr - x0) / (x1 - x0); break; }
  if (p.age <= 23) v *= 1 + Math.max(0, p.pot - p.ovr) / 60;
  const AF = { 16: 1.1, 17: 1.15, 18: 1.15, 19: 1.15, 20: 1.15, 21: 1.15, 22: 1.1, 23: 1.05, 24: 1, 25: 1, 26: 1, 27: .95, 28: .85, 29: .7, 30: .55, 31: .42, 32: .3, 33: .22 };
  v *= AF[p.age] || (p.age < 16 ? 1 : .12);
  v *= [0, 1.1, 1.03, 1, .92][tierOf(clubOf(p).strength)];
  if (last && last.games >= 8) v *= clamp(1 + (last.rating - 6.8) * .25, .8, 1.4);
  v *= 1 + Math.min(p.titles.length, 20) * .01;
  return Math.max(.05, +v.toFixed(2));
}
const salaryFor = (p, club) => Math.round(Math.max(1500, p.value * 1e6 * .0035 * [0, 1.2, 1, .8, .6][tierOf(club.strength)] * (club.league === 'Saudi Pro League' ? 1.8 : 1)) / 100) * 100;

// Cria o jogador com atributos coerentes com a posição
function createPlayer({ name, age, pos, nat, club }) {
  const c = CLUBS.find(x => x.name === club);
  const target = clamp(Math.round(50 + (age - 16) * 1.7 + rnd(0, 10) + (tierOf(c.strength) <= 2 ? 2 : 0)), 50, 76);
  const keys = attrKeys(pos), w = POS[pos].w, attrs = {};
  keys.forEach(k => attrs[k] = w[k] ? target + rnd(-4, 6) * (1 + w[k]) : target - rnd(6, 18));
  for (let i = 0; i < 4; i++) { const d = target - calculateOverall(pos, attrs); keys.forEach(k => attrs[k] = clamp(Math.round(attrs[k] + d), 25, 95)); }
  const ovr = calculateOverall(pos, attrs);
  let pot = clamp(ovr + Math.round(rnd(6, 26) - (age - 16) * 1.8), ovr + 2, 94);
  if (chance(.08)) pot = Math.min(95, pot + 6);
  const traits = []; while (traits.length < 2) { const t = pick(Object.keys(TRAITS)); if (!traits.includes(t)) traits.push(t); }
  const p = { id: Date.now().toString(36) + rint(100, 999), name, age, pos, nat, club, attrs, ovr, pot, form: 3, traits, number: pick(NUMBERS[pos]), season: 2026, xp: 0, level: 1, contract: rint(2, 4),
    history: [], titles: [], awards: [], transfers: [], intl: [], pendingOffers: [], lastChanges: [], retired: false, maxOvr: ovr,
    tot: { games: 0, goals: 0, assists: 0, yc: 0, rc: 0, cs: 0, ig: 0, igoals: 0, iast: 0 },
    rec: { goals: { v: 0 }, assists: { v: 0 }, rating: { v: 0 }, titles: { v: 0 } } };
  p.value = marketValue(p); p.maxValue = p.value; p.salary = salaryFor(p, c);
  return p;
}

// Evento aleatório da temporada: devolve modificadores para a simulação
function generateRandomEvent() {
  const ctx = { q: 0, play: 0, inj: 1, offer: 0, title: 0, xp: 0, notes: [] }, pool = [...EVENTS];
  for (let i = chance(.4) ? 2 : 1; i > 0; i--) {
    const e = pool.splice(rint(0, pool.length - 1), 1)[0];
    ctx.q += e.q || 0; ctx.play += e.play || 0; ctx.inj *= e.inj || 1; ctx.offer += e.offer || 0; ctx.title += e.title || 0; ctx.xp += e.xp || 0; ctx.notes.push(e.t);
  }
  return ctx;
}

// Jogos, gols, assistências, nota, cartões e lesão — fórmula com pesos + aleatoriedade
function calculateStats(p, club, ctx) {
  const cont = continental(club), total = (LG_GAMES[club.league] || 38) + 6 + (cont ? cont.games : 0);
  const diff = p.ovr - club.strength;
  const share = clamp((diff >= 3 ? .9 : diff >= -3 ? .78 : diff >= -9 ? .5 : .25) + ctx.play + rnd(-.08, .08), .05, .97);
  const q = p.ovr + (p.form - 3) * 2 + tAdd(p, 'q') + (club.strength - 75) * .08 + ctx.q + (p.age <= 21 ? (p.pot - p.ovr) * .05 : 0) + gauss() * 3;
  let games = Math.round(total * share), injury = null;
  if (chance(.2 * tMul(p, 'inj') * ctx.inj)) {
    const weeks = 2 + Math.floor(Math.random() ** 2 * 18), missed = Math.max(1, Math.round(weeks * total / 46 * share));
    games = Math.max(0, games - missed); injury = { type: pick(INJ), weeks, missed };
  }
  const R = RATE[p.pos], mult = clamp(.35 + (q - 50) / 40, .2, 1.6), tf = clamp(.85 + (club.strength - 60) / 100, .85, 1.2);
  const mg = games * R.g * mult * tf * tMul(p, 'goal'), ma = games * R.a * mult * tf * tMul(p, 'ast');
  const goals = R.g ? clamp(Math.round(mg + gauss() * Math.sqrt(mg + .5) * .8), 0, games) : 0;
  const assists = Math.max(0, Math.round(ma + gauss() * Math.sqrt(ma + .5) * .8));
  const rating = games ? +clamp(6 + (q - 60) * .055 + gauss() * .2, 5.4, 9.2).toFixed(1) : 0;
  const yc = Math.max(0, Math.round(games * (['CB', 'CDM', 'RB', 'LB'].includes(p.pos) ? .13 : .07) + gauss() * 1.2));
  const rc = chance(.04 * games / 30) ? 1 : 0;
  const cs = p.pos === 'GK' ? Math.round(games * clamp(.25 + (club.strength - 60) / 150 + (q - 70) / 200, .1, .6)) : 0;
  return { games, goals, assists, rating, yc, rc, cs, injury, total, q };
}

// Títulos coletivos (só conta se o jogador atuou em pelo menos 8 jogos)
function checkTitles(p, club, st, ctx) {
  const out = [], cont = continental(club); if (st.games < 8) return out;
  const power = club.strength + (p.ovr - club.strength) * .1 + rnd(-8, 8);
  if (chance(clamp((power - 72) / 40, .01, .6) + tAdd(p, 'title'))) out.push(club.league);
  if (chance(clamp((power - 60) / 80, .02, .3) + ctx.title)) out.push(CUPS[club.country] || 'Copa Nacional');
  if (cont) {
    const pk = cont.name === 'Champions League' ? clamp((power - 80) / 55, .01, .3) : cont.name === 'Europa League' ? clamp((power - 66) / 60, .02, .22) : clamp((power - 62) / 60, .02, .22);
    if (chance(pk)) { out.push(cont.name); if (cont.top && chance(.4)) out.push('Mundial de Clubes'); }
  }
  return out;
}

// Prêmios individuais conforme gols, assistências, nota e títulos
function checkAwards(p, st, titles) {
  const a = [], { games, goals, assists, rating } = st, att = ['ST', 'RW', 'LW', 'CAM'].includes(p.pos);
  if (games < 15) return a;
  const cw = titles.some(t => ['Champions League', 'Libertadores'].includes(t));
  if (p.ovr >= 85 && rating >= 7.5 && (att ? goals + assists >= 22 : rating >= 7.9) && chance(clamp((p.ovr - 85) * .04 + (rating - 7.5) * .5 + (cw ? .25 : 0), .05, .85))) a.push('Bola de Ouro');
  if (goals >= 15 && chance(clamp((goals - 14) / 16, 0, .9))) a.push('Artilheiro');
  if (goals >= 28 && chance(.5)) a.push('Chuteira de Ouro');
  if (rating >= 7.4 && games >= 25 && chance(clamp((rating - 7.3) * 1.1, 0, .8))) a.push('Melhor Jogador da Liga');
  if (p.age <= 21 && rating >= 6.9 && chance(.6)) a.push('Melhor Jovem');
  if (rating >= 7.1 && chance(clamp((rating - 7) * 1.3, 0, .7))) a.push('Melhor Jogador da Temporada');
  return a;
}

// Seleção: convocação depende de overall, idade, forma e nível do país
function nationalTeam(p, st, endYear) {
  const nt = nationOf(p), thr = [0, 76, 70, 66][nt.tier];
  if (p.age < 18 || st.games < 10) return null;
  if (!chance(Math.min(.98, clamp((p.ovr - thr) / 10 + .5, 0, .95) * (.8 + (p.form - 1) * .1)))) return null;
  let tour = endYear % 4 === 2 ? 'Copa do Mundo' : endYear % 4 === 0 ? CONF_CUP[nt.conf] : null;
  if (tour && !chance([0, .95, .7, .45][nt.tier])) tour = null;
  const games = rint(4, 9) + (tour ? rint(4, 7) : 0), R = RATE[p.pos], mult = clamp(.35 + (p.ovr - 50) / 40, .2, 1.6) * .8;
  const goals = R.g ? Math.max(0, Math.round(games * R.g * mult * tMul(p, 'goal') + gauss() * .8)) : 0;
  const assists = Math.max(0, Math.round(games * R.a * mult + gauss() * .8));
  let won = null;
  if (tour && chance(([0, tour === 'Copa do Mundo' ? .16 : .22, tour === 'Copa do Mundo' ? .05 : .09, tour === 'Copa do Mundo' ? .01 : .03][nt.tier]) * (1 + (p.ovr - 80) / 100))) won = tour;
  return { games, goals, assists, tour, won };
}

// Evolução anual: cresce até o potencial, estabiliza e regride com a idade
function updatePlayerAttributes(p, st) {
  const old = { ...p.attrs }, oldOvr = p.ovr, ageEff = p.pos === 'GK' ? p.age - 3 : p.age;
  const perf = st.games ? st.rating - 6.5 : 0, g = tAdd(p, 'growth') + (p.level - 1) * .03;
  let pts;
  if (ageEff <= 24) pts = clamp((p.pot - p.ovr) * .22 + rnd(-.5, 2) + perf * .8 + g, -1, 8);
  else if (ageEff <= 29) pts = rnd(-.7, 1.6) + perf * .3 + g * .5;
  else if (ageEff <= 33) pts = rnd(-2, .6) + perf * .2;
  else pts = rnd(-4, -1) + Math.max(0, perf) * .3;
  if (p.ovr >= p.pot + 1 && pts > 0) pts *= .3;
  const keys = attrKeys(p.pos), w = POS[p.pos].w;
  keys.forEach(k => {
    let d = pts * (.6 + Math.random() * .8) * (w[k] ? 1.1 : .8);
    if (ageEff >= 28 && ['pace', 'physical', 'reflexes'].includes(k)) d -= (ageEff - 27) * .25;
    if (ageEff >= 28 && ['passing', 'positioning', 'defending'].includes(k)) d += .2;
    if (ageEff <= 23 && ['pace', 'physical'].includes(k)) d += .4;
    p.attrs[k] = clamp(p.attrs[k] + Math.round(d + (Math.random() - .5) * .8), 20, 99);
  });
  for (let i = 0; i < 12 && calculateOverall(p.pos, p.attrs) > Math.max(p.pot + 2, oldOvr); i++) {
    const k = keys.reduce((a, b) => p.attrs[a] >= p.attrs[b] ? a : b); p.attrs[k]--;
  }
  p.ovr = calculateOverall(p.pos, p.attrs); p.maxOvr = Math.max(p.maxOvr, p.ovr);
  if (perf >= 1 && p.age <= 22 && chance(.4)) p.pot = Math.min(95, p.pot + 1);
  if (p.age >= 26) p.pot = p.ovr;
  p.pot = Math.max(p.pot, p.ovr);
  return keys.map(k => ({ k, d: p.attrs[k] - old[k] })).filter(c => c.d);
}

// Propostas: melhor jogador (e mais jovem/promissor) = clubes maiores
function generateTransferOffers(p, st, ctx) {
  const cur = clubOf(p); if (p.age < 17) return [];
  const rep = p.ovr + (p.age <= 22 ? (p.pot - p.ovr) * .3 : 0) + (st.rating ? (st.rating - 7) * 4 : 0) + ctx.offer + tAdd(p, 'offer') * 2;
  const pool = CLUBS.filter(c => c.name !== cur.name && (c.strength >= cur.strength - 3 || p.age >= 31) && c.strength <= rep + 6);
  if (!pool.length || !chance(clamp(.4 + (st.rating >= 7.3 ? .2 : 0) + (rep - cur.strength > 8 ? .3 : 0), 0, .95))) return [];
  pool.sort((a, b) => (b.strength + rnd(-12, 12)) - (a.strength + rnd(-12, 12)));
  return pool.slice(0, rint(1, 3)).map(c => ({ club: c.name, league: c.league, fee: +(p.value * rnd(.8, 1.3)).toFixed(1), salary: Math.round(salaryFor(p, c) * rnd(.95, 1.35) / 100) * 100, years: rint(2, 5) }));
}

const shouldRetire = p => p.age >= 40 ? 'forced' : (p.age >= 34 && p.ovr < 55) || chance({ 35: .15, 36: .25, 37: .4, 38: .55, 39: .75 }[p.age] || 0) ? 'ask' : false;

// Simula uma temporada completa e devolve um relatório (r)
function simulateSeason(p, dec) {
  const club = clubOf(p), ctx = generateRandomEvent();
  if (dec) { ctx.q += dec.q || 0; ctx.xp += dec.xp || 0; ctx.notes.unshift(dec.note); }
  const r = { label: seasonLabel(p.season), club: club.name, age: p.age, ovr0: p.ovr, val0: p.value, lvl0: p.level, events: ctx.notes };
  const st = r.stats = calculateStats(p, club, ctx);
  r.titles = checkTitles(p, club, st, ctx);
  r.awards = checkAwards(p, st, r.titles);
  r.intl = nationalTeam(p, st, p.season + 1);
  r.verdict = st.games < 8 ? 'Temporada marcada pela falta de minutos.' : st.rating >= 8 ? 'Temporada histórica!' : st.rating >= 7.3 ? 'Grande temporada!' : st.rating >= 6.4 ? 'Temporada razoável.' : 'Temporada abaixo das expectativas.';
  // totais, títulos e prêmios
  const T = p.tot; T.games += st.games; T.goals += st.goals; T.assists += st.assists; T.yc += st.yc; T.rc += st.rc; T.cs += st.cs;
  r.titles.forEach(n => p.titles.push({ name: n, season: r.label }));
  r.awards.forEach(n => p.awards.push({ name: n, season: r.label }));
  if (r.intl) {
    T.ig += r.intl.games; T.igoals += r.intl.goals; T.iast += r.intl.assists; p.intl.push({ season: r.label, ...r.intl });
    if (r.intl.won) p.titles.push({ name: r.intl.won, season: r.label, nat: true });
  }
  // experiência e nível
  r.xpGain = Math.round((st.games + st.goals * 2 + st.assists + r.titles.length * 30 + r.awards.length * 40 + Math.max(0, st.rating - 6) * 50 + (r.intl ? r.intl.games * 2 : 0) + ctx.xp) * tMul(p, 'xp'));
  p.xp += r.xpGain; p.level = lvlOf(p.xp);
  // recordes pessoais
  const up = (k, v) => { if (v > p.rec[k].v) p.rec[k] = { v, s: r.label }; };
  up('goals', st.goals); up('assists', st.assists); up('rating', st.rating); up('titles', r.titles.length + (r.intl && r.intl.won ? 1 : 0));
  // evolução, envelhecimento, valor, forma e contrato
  r.changes = p.lastChanges = updatePlayerAttributes(p, st);
  p.age++; p.season++;
  p.value = marketValue(p, st); p.maxValue = Math.max(p.maxValue, p.value);
  p.form = st.games ? clamp(Math.round(3 + (st.rating - 6.7) * 1.2 + gauss() * .7), 1, 5) : 3;
  r.contractNote = null;
  if (--p.contract <= 0) { p.contract = rint(2, 4); p.salary = Math.round(salaryFor(p, club) * rnd(1, 1.15) / 100) * 100; r.contractNote = 'Contrato renovado.'; }
  p.history.push({ label: r.label, club: club.name, age: r.age, games: st.games, goals: st.goals, assists: st.assists, rating: st.rating, yc: st.yc, rc: st.rc, titles: r.titles, awards: r.awards, intl: r.intl, injury: st.injury, ovr: p.ovr, value: p.value });
  p.pendingOffers = generateTransferOffers(p, st, ctx);
  p.retireCheck = shouldRetire(p);
  Object.assign(r, { ovr1: p.ovr, val1: p.value, lvl1: p.level, form: p.form });
  return r;
}

// Encerra a carreira e calcula o legado
function calcLegacy(p) {
  const t = p.tot, bo = p.awards.filter(a => a.name === 'Bola de Ouro').length;
  const score = t.goals / 10 + t.assists / 20 + p.titles.length * 3 + (p.awards.length - bo) * 2 + bo * 12 + Math.max(0, p.maxOvr - 70) * 2 + p.titles.filter(x => x.nat).length * 5;
  const label = score >= 250 ? 'Lenda do futebol' : score >= 150 ? 'Craque mundial' : score >= 90 ? 'Ídolo' : score >= 50 ? 'Grande jogador' : score >= 25 ? 'Carreira sólida' : 'Jogador de elenco';
  const cnt = {}; p.history.forEach(h => cnt[h.club] = (cnt[h.club] || 0) + 1);
  const [fc, fn] = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0] || ['', 0];
  return { score: Math.round(score), label, legend: fn >= 8 && score >= 40 ? `Lenda do ${fc}` : null };
}
function retirePlayer() {
  const p = S.p; p.retired = true; p.pendingOffers = []; p.legacy = calcLegacy(p);
  saveCareer(); closeModal(); render();
}

/* ================= 4. SALVAMENTO ================= */
const S = { careers: [], p: null, tab: 'dash', busy: false };
const KEY = 'footballCareer.v1';
function saveCareer() { try { localStorage.setItem(KEY, JSON.stringify(S.careers)); } catch (e) { console.warn('Não foi possível salvar', e); } }
function loadCareer() { try { S.careers = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { S.careers = []; } }
function openCareer(id) { S.p = S.careers.find(c => c.id === id); S.tab = 'dash'; render(); }
function deleteCareer(id) { if (confirm('Excluir esta carreira?')) { S.careers = S.careers.filter(c => c.id !== id); saveCareer(); render(); } }
function goHome() { S.p = null; render(); }
function newCareer() {
  const name = $('f-name').value.trim();
  if (!name) { $('f-err').textContent = 'Digite o nome do jogador.'; $('f-name').focus(); return; }
  const p = createPlayer({ name, age: +$('f-age').value, pos: $('f-pos').value, nat: $('f-nat').value, club: $('f-club').value });
  S.careers.unshift(p); S.p = p; S.tab = 'dash'; saveCareer(); render();
}

/* ================= 5. FLUXO DA TEMPORADA ================= */
function modal(html, cls = '') { $('modal').innerHTML = `<div class="ov"><div class="box ${cls}">${html}</div></div>`; }
function closeModal() { $('modal').innerHTML = ''; }

function askDecision(d) {
  return new Promise(res => {
    S.decide = i => { closeModal(); res(applyDecision(S.p, d.o[i][1](S.p))); };
    modal(`<h3>${d.t}</h3><p class="q">${d.q}</p>` + d.o.map((o, i) => `<button class="btn big" onclick="S.decide(${i})">${o[0]}</button>`).join(''));
  });
}
function applyDecision(p, fx) {
  Object.entries(fx.attrs || {}).forEach(([k, v]) => { if (k in p.attrs) p.attrs[k] = clamp(p.attrs[k] + v, 1, 99); });
  p.ovr = calculateOverall(p.pos, p.attrs); p.maxOvr = Math.max(p.maxOvr, p.ovr);
  if (fx.form) p.form = clamp(p.form + fx.form, 1, 5);
  return { q: fx.q || 0, xp: fx.xp || 0, note: fx.note };
}

async function startSeason() {
  if (S.busy) return; S.busy = true;
  const p = S.p; let dec = null;
  if (chance(.35)) dec = await askDecision(pick(DECISIONS.filter(d => d.ok(p))));
  for (const m of ['Preparando temporada…', 'Simulando partidas…', 'Calculando desempenho…', 'Finalizando temporada…']) {
    modal(`<div class="ball">⚽</div><p class="q">${m}</p>`, 'tiny'); await sleep(550);
  }
  const r = simulateSeason(p, dec); saveCareer(); showResult(r); S.busy = false;
}

function showResult(r) {
  const s = r.stats, p = S.p, d = r.ovr1 - r.ovr0, nt = nationOf(p);
  const num = (v, l) => `<div class="num"><b>${v}</b><small>${l}</small></div>`;
  const chips = (arr, cls, ic) => arr.map(t => `<span class="chip ${cls}">${ic} ${esc(t)}</span>`).join('');
  modal(`<h3>TEMPORADA ${r.label}</h3><p class="verdict">${r.verdict}</p>
    <div class="grid4">${num(s.games, 'Jogos')}${num(s.goals, 'Gols')}${num(s.assists, 'Assist.')}${num(s.rating ? s.rating.toFixed(1) : '—', 'Nota')}</div>
    <p class="mut">${esc(r.club)} · 🟨 ${s.yc} · 🟥 ${s.rc}${p.pos === 'GK' ? ` · 🧤 ${s.cs} jogos sem sofrer gol` : ''}</p>
    ${s.injury ? `<div class="alert">⚠️ <b>LESÃO</b> — ${s.injury.type}<br>Tempo estimado: ${s.injury.weeks} semanas · Jogos perdidos: ${s.injury.missed}</div>` : ''}
    <div>${chips(r.titles, 'gold', '🏆')}${chips(r.awards, 'gold', '🥇')}</div>
    ${r.intl ? `<div class="card"><b>${nt.f} SELEÇÃO ${p.nat.toUpperCase()}</b><br>Jogos: ${r.intl.games} · Gols: ${r.intl.goals} · Assistências: ${r.intl.assists}${r.intl.tour ? `<br>${r.intl.tour}: ${r.intl.won ? '🏆 Campeão!' : 'eliminado'}` : ''}</div>` : ''}
    ${r.events.map(e => `<p class="mut">• ${e}</p>`).join('')}
    <div class="card"><b>EVOLUÇÃO</b> — OVR ${r.ovr0} → ${r.ovr1} <span class="${d >= 0 ? 'up' : 'dn'}">(${d >= 0 ? '+' : ''}${d})</span><br>
    ${r.changes.length ? r.changes.map(c => `<span class="chip ${c.d > 0 ? 'g' : 'r'}">${c.d > 0 ? '+' : ''}${c.d} ${ATTR[c.k]}</span>`).join('') : '<span class="mut">Atributos estáveis.</span>'}
    <p class="mut">Valor: ${money(r.val0)} → ${money(r.val1)} · +${r.xpGain} XP${r.lvl1 > r.lvl0 ? ` · ⬆ Nível ${r.lvl1}!` : ''}<br>Forma para a próxima: ${FORM[r.form].e} ${FORM[r.form].t}${r.contractNote ? ' · ' + r.contractNote : ''}</p></div>
    <button class="btn big" onclick="afterResult()">CONTINUAR</button>`);
}

function afterResult() { closeModal(); S.p.pendingOffers.length ? showOffers() : afterSeason(); }
function showOffers() {
  const p = S.p;
  modal(`<h3>PROPOSTAS DE TRANSFERÊNCIA</h3><p class="mut">Seu desempenho chamou atenção. Escolha uma proposta ou recuse todas.</p>` + p.pendingOffers.map((o, i) => `
    <div class="card offer"><h4>${esc(o.club)}</h4><small>${o.league} · Nível ${tierOf(CLUBS.find(c => c.name === o.club).strength)}</small>
    <div class="grid3"><div class="num"><b>${money(o.fee)}</b><small>Transferência</small></div><div class="num"><b>${wage(o.salary)}</b><small>Salário</small></div><div class="num"><b>${o.years} anos</b><small>Duração</small></div></div>
    <div class="row"><button class="btn" onclick="acceptOffer(${i})">ACEITAR</button><button class="btn ghost" onclick="declineOffer(${i})">RECUSAR</button></div></div>`).join('') +
    `<button class="btn ghost big" onclick="declineOffer(-1)">Recusar todas</button>`);
}
function acceptOffer(i) {
  const p = S.p, o = p.pendingOffers[i], last = p.history[p.history.length - 1];
  p.transfers.push({ season: last.label, from: p.club, to: o.club, fee: o.fee });
  last.moved = { to: o.club, fee: o.fee };
  p.club = o.club; p.salary = o.salary; p.contract = o.years; p.pendingOffers = [];
  p.value = marketValue(p, last); p.maxValue = Math.max(p.maxValue, p.value);
  afterSeason();
}
function declineOffer(i) {
  const p = S.p; i < 0 ? p.pendingOffers = [] : p.pendingOffers.splice(i, 1);
  p.pendingOffers.length ? showOffers() : afterSeason();
}
function afterSeason() {
  const p = S.p, rc = p.retireCheck; p.retireCheck = null; saveCareer(); closeModal();
  if (rc === 'forced') return retirePlayer();
  if (rc === 'ask') return modal(`<h3>FIM DE CARREIRA?</h3><p class="q">Aos ${p.age} anos, você pensa em pendurar as chuteiras. O que decide?</p><button class="btn big" onclick="retirePlayer()">APOSENTAR-SE</button><button class="btn ghost big" onclick="closeModal();render()">MAIS UMA TEMPORADA</button>`);
  render();
}
function confirmRetire() { if (confirm('Encerrar a carreira agora?')) retirePlayer(); }

/* ================= 6. TELAS ================= */
function render() { !S.p ? renderHome() : S.p.retired ? renderRetirement() : renderCareer(); window.scrollTo(0, 0); animateBars(); }
function animateBars() { requestAnimationFrame(() => document.querySelectorAll('[data-w]').forEach(e => e.style.width = e.dataset.w + '%')); }

function renderHome() {
  const saved = S.careers.map(p => `<div class="card save"><div><b>${esc(p.name)}</b><br><small>${p.retired ? 'Carreira encerrada · ' + p.legacy.label : `${p.age} anos · ${esc(p.club)} · ${seasonLabel(p.season)}`}</small></div><div class="ovr sm">${p.ovr}</div>
    <div class="row"><button class="btn" onclick="openCareer('${p.id}')">${p.retired ? 'VER LEGADO' : 'CONTINUAR CARREIRA'}</button><button class="btn ghost" onclick="deleteCareer('${p.id}')">Excluir</button></div></div>`).join('');
  $('app').innerHTML = `<section class="hero"><h1><span class="o">FOOTBALL</span><span>CAREER</span></h1><p>Crie seu jogador e viva uma carreira completa no futebol.</p></section>
    ${saved ? `<h3>CONTINUAR CARREIRA</h3>${saved}` : ''}
    <div class="card"><h3>NOVA CARREIRA</h3><div class="form">
      <div class="full"><label>Nome do jogador</label><input id="f-name" maxlength="30" placeholder="Ex: João Silva"></div>
      <div><label>Idade inicial</label><select id="f-age">${[16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map(a => `<option>${a}</option>`).join('')}</select></div>
      <div><label>Posição</label><select id="f-pos">${Object.entries(POS).map(([k, v]) => `<option value="${k}" ${k === 'ST' ? 'selected' : ''}>${v.n} (${k})</option>`).join('')}</select></div>
      <div><label>Nacionalidade</label><select id="f-nat">${NATIONS.map(n => `<option ${n.n === 'Brasil' ? 'selected' : ''}>${n.n}</option>`).join('')}</select></div>
      <div><label>Clube inicial</label><select id="f-club">${LEAGUES.map(([c, l, list]) => `<optgroup label="${c} — ${l}">${list.map(([n]) => `<option ${n === 'Corinthians' ? 'selected' : ''}>${n}</option>`).join('')}</optgroup>`).join('')}</select></div>
      <p class="err full" id="f-err"></p>
      <button class="btn big full" onclick="newCareer()">COMEÇAR CARREIRA</button></div></div>`;
}

const TABS = { dash: ['Painel', tabDash], hist: ['Histórico', tabHist], stats: ['Estatísticas', tabStats], troph: ['Troféus', tabTroph], rec: ['Recordes', tabRec] };
function renderCareer() {
  const p = S.p, c = clubOf(p), nt = nationOf(p);
  $('app').innerHTML = `<header class="bar"><button class="btn ghost sm" onclick="goHome()">☰ Menu</button><span class="logo">FOOTBALL <i>CAREER</i></span><small>${seasonLabel(p.season)}</small></header>
    <section class="card player"><div class="avatar" style="--c:${TIER_COLOR[tierOf(c.strength)]}">${esc(p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}<em>${p.number}</em></div>
    <div class="pinfo"><h2>${esc(p.name)}</h2><small>${nt.f} ${p.nat} · ${POS[p.pos].n} · ${esc(c.name)}</small><div>${p.traits.map(t => `<span class="chip">${t}</span>`).join('')}</div></div>
    <div class="ovr">${p.ovr}<small>OVR</small></div></section>
    <nav class="tabs">${Object.entries(TABS).map(([k, [l]]) => `<button class="tab ${S.tab === k ? 'on' : ''}" onclick="S.tab='${k}';render()">${l}</button>`).join('')}</nav>
    <main>${TABS[S.tab][1](p)}</main>`;
}

function tabDash(p) {
  const c = clubOf(p), nt = nationOf(p), f = FORM[p.form];
  const cards = [['IDADE', p.age], ['PAÍS', nt.f + ' ' + p.nat], ['POSIÇÃO', POS[p.pos].n], ['CLUBE', c.name], ['VALOR', money(p.value)], ['SALÁRIO', wage(p.salary)], ['POTENCIAL', Math.floor(p.pot / 5) * 5 + '+'], ['FORMA', f.e + ' ' + f.t]];
  const need = 80 * p.level ** 2, base = 80 * (p.level - 1) ** 2;
  return `<div class="grid" style="margin-top:12px">${cards.map(([l, v]) => `<div class="card stat"><small>${l}</small><b>${esc(v)}</b></div>`).join('')}</div>
    <div class="dash"><div class="card"><h3>TEMPORADA ${seasonLabel(p.season)}</h3><p class="mut">Contrato: ${p.contract} ano(s) · Nível ${p.level}</p>
      <div class="track"><i data-w="${clamp(Math.round((p.xp - base) / (need - base) * 100), 0, 100)}"></i></div><small>${p.xp - base} / ${need - base} XP</small>
      <button class="btn big" onclick="startSeason()">▶ SIMULAR TEMPORADA</button>${p.age >= 33 ? `<button class="btn ghost big" onclick="confirmRetire()">Aposentar-se</button>` : ''}</div>
    <div class="card"><h3>ATRIBUTOS</h3>${attrKeys(p.pos).map(k => { const ch = (p.lastChanges.find(x => x.k === k) || {}).d || 0; return `<div class="attr"><span>${ATTR[k]}</span><div class="track"><i data-w="${p.attrs[k]}"></i></div><b>${p.attrs[k]}${ch ? ` <small class="${ch > 0 ? 'up' : 'dn'}">${ch > 0 ? '▲' : '▼'}${Math.abs(ch)}</small>` : ''}</b></div>`; }).join('')}</div></div>`;
}

function tabHist(p) {
  if (!p.history.length) return `<p class="card mut">Simule sua primeira temporada para começar o histórico.</p>`;
  const nt = nationOf(p);
  return [...p.history].reverse().map(h => `<div class="tl"><div class="card"><h4>${h.label} · ${esc(h.club)}</h4>
    <p>${h.games} jogos · ${h.goals} gols · ${h.assists} assistências · nota ${h.rating ? h.rating.toFixed(1) : '—'} · OVR ${h.ovr}</p>
    ${h.titles.map(t => `<span class="chip gold">🏆 ${esc(t)}</span>`).join('')}${h.awards.map(t => `<span class="chip gold">🥇 ${esc(t)}</span>`).join('')}
    ${h.injury ? `<span class="chip r">⚠️ ${h.injury.type} (${h.injury.missed} jogos)</span>` : ''}${h.intl ? `<span class="chip g">${nt.f} ${h.intl.games}j ${h.intl.goals}g</span>` : ''}
    ${h.moved ? `<p class="up">→ Transferido para ${esc(h.moved.to)} por ${money(h.moved.fee)}</p>` : ''}</div></div>`).join('');
}

function tabStats(p) {
  const t = p.tot, n = (v, l) => `<div class="card num"><b>${v}</b><small>${l}</small></div>`;
  return `<div class="grid" style="margin-top:12px">${n(t.games, 'Jogos')}${n(t.goals, 'Gols')}${n(t.assists, 'Assistências')}${n(p.titles.length, 'Títulos')}${n(p.awards.length, 'Prêmios')}${n(money(p.maxValue), 'Valor máximo')}${n(p.maxOvr, 'Overall máximo')}${n(t.ig + ' j / ' + t.igoals + ' g', 'Seleção')}</div>` +
    (p.history.length ? `<div class="card scroll"><table><tr><th>Temp.</th><th>Clube</th><th>Idade</th><th>J</th><th>G</th><th>A</th><th>Nota</th><th>OVR</th><th>Títulos</th></tr>${p.history.map(h => `<tr><td>${h.label}</td><td>${esc(h.club)}</td><td>${h.age}</td><td>${h.games}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.rating ? h.rating.toFixed(1) : '—'}</td><td>${h.ovr}</td><td>${h.titles.length}</td></tr>`).join('')}</table></div>` : '');
}

function tabTroph(p) {
  const nt = nationOf(p), t = p.tot, li = (i, x) => `<li>${i} ${esc(x.name)} — ${x.season}</li>`, none = '<li class="mut">Nada por aqui ainda.</li>';
  return `<div class="card"><h3>TÍTULOS COLETIVOS</h3><ul>${p.titles.filter(x => !x.nat).map(x => li('🏆', x)).join('') || none}</ul></div>
    <div class="card"><h3>PRÊMIOS INDIVIDUAIS</h3><ul>${p.awards.map(x => li('🥇', x)).join('') || none}</ul></div>
    <div class="card"><h3>${nt.f} SELEÇÃO ${p.nat.toUpperCase()}</h3><div class="grid3"><div class="num"><b>${t.ig}</b><small>Jogos</small></div><div class="num"><b>${t.igoals}</b><small>Gols</small></div><div class="num"><b>${t.iast}</b><small>Assistências</small></div></div>
    <ul>${p.intl.filter(i => i.tour).map(i => `<li>${i.won ? '🏆' : '⚽'} ${i.tour} — ${i.season}${i.won ? ' (campeão)' : ''}</li>`).join('') || '<li class="mut">Nenhuma competição disputada.</li>'}</ul></div>`;
}

function tabRec(p) {
  const R = p.rec, row = (l, v, s) => `<li><b>${v}</b> ${l}${s ? ` <small>(${s})</small>` : ''}</li>`;
  return `<div class="card"><h3>RECORDES PESSOAIS</h3><ul>${row('gols em uma temporada', R.goals.v, R.goals.s)}${row('assistências em uma temporada', R.assists.v, R.assists.s)}${row('maior nota média', R.rating.v ? R.rating.v.toFixed(1) : '—', R.rating.s)}${row('títulos em uma temporada', R.titles.v, R.titles.s)}${row('maior valor de mercado', money(p.maxValue))}${row('gols pela seleção', p.tot.igoals)}</ul></div>`;
}

function renderRetirement() {
  const p = S.p, L = p.legacy, t = p.tot, clubs = [...new Set(p.history.map(h => h.club))], nt = nationOf(p);
  const sc = h => h.goals * 2 + h.assists + (h.rating || 0) * 10 + h.titles.length * 8 + h.awards.length * 10;
  const best = [...p.history].sort((a, b) => sc(b) - sc(a))[0];
  const n = (v, l) => `<div class="card num"><b>${v}</b><small>${l}</small></div>`;
  $('app').innerHTML = `<header class="bar"><button class="btn ghost sm" onclick="goHome()">☰ Menu</button><span class="logo">FIM DE <i>CARREIRA</i></span><span></span></header>
    <section class="card"><h2>${esc(p.name)}</h2><p class="q">Depois de ${p.history.length} temporadas, sua carreira chegou ao fim.</p>
    <p class="verdict">LEGADO: ${L.label}</p>${L.legend ? `<p class="verdict">${esc(L.legend)}</p>` : ''}<small>Pontuação de legado: ${L.score}</small></section>
    <div class="grid" style="margin-top:12px">${n(t.games, 'Jogos')}${n(t.goals, 'Gols')}${n(t.assists, 'Assistências')}${n(p.titles.length, 'Títulos')}${n(p.awards.length, 'Prêmios')}${n(p.maxOvr, 'Maior overall')}${n(money(p.maxValue), 'Maior valor')}${n(t.ig + ' j / ' + t.igoals + ' g', nt.f + ' Seleção')}</div>
    <div class="card"><b>Clubes:</b> ${clubs.map(esc).join(' → ')}${best ? `<br><b>Temporada de maior destaque:</b> ${best.label} no ${esc(best.club)} (${best.goals} gols, ${best.assists} assistências, nota ${best.rating.toFixed(1)})` : ''}</div>
    <button class="btn big" onclick="goHome()">NOVA CARREIRA</button>`;
}

/* ================= 7. INICIAR ================= */
loadCareer(); render();