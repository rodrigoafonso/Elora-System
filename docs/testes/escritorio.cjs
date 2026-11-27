const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const S = f => '/home/claude/testes/shots/' + f; let ok = 0, falhas = [];
const chk = (c, m) => { if (c) ok++; else falhas.push(m); console.log(c ? 'OK ' : 'FALHA ', m); };
(async () => { const seed = fs.readFileSync('/home/claude/elora/seed.json', 'utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  await ctx.addInitScript(s => { if (!localStorage.getItem('elora-partner-os-v1')) localStorage.setItem('elora-partner-os-v1', s);
    // Presença simulada: só a capacidade "room"; as outras ficam indisponíveis (modo local).
    let H = null, peers = [], minha = {}; const fr = o => Object.freeze(o);
    const fake = { onPeers: h => { H = h; setTimeout(() => h({ peers, joined: peers, left: [], updated: [] }), 10); return () => {}; },
      presence: p => { minha = { ...minha, ...p }; window.__minha = minha; return Promise.resolve(); }, peers: () => peers, connected: () => true };
    window.__setPeers = arr => { peers = arr.map((x, i) => fr({ peer: 'p' + i, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: fr(x), updatedAt: Date.now() })); H && H({ peers, joined: [], left: [], updated: peers }); };
    window.claude = { use: n => Promise.resolve(n === 'room' ? fake : null) }; }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/elora/elora-partner-os.html#mapa', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
  chk(await p.evaluate('estado.view') === 'mapa', 'Mapa abre');
  console.log('minha presença', JSON.stringify(await p.evaluate('window.__minha')));
  chk(await p.evaluate('(window.__minha||{}).view') === 'mapa', 'Minha presença diz a tela');
  await p.evaluate(`__setPeers([{ nome: 'Pedro', view: 'financeiro', depto: 'operacoes' }, { nome: 'Fabiana', view: 'comercial', depto: 'comercial' }])`); await p.waitForTimeout(1800);
  const pos = async nome => p.evaluate(n => { const a = [...document.querySelectorAll('.of-a.vivo.mp-hum')].find(x => x.title.startsWith(n)); if (!a) return null; const r = a.getBoundingClientRect(); const s = [...document.querySelectorAll('.of-sala')].find(el => { const q = el.getBoundingClientRect(); return r.left + 20 >= q.left && r.left + 20 <= q.right && r.top + 20 >= q.top && r.top + 20 <= q.bottom; }); return s ? s.dataset.sala : 'fora'; }, nome);
  const s1 = await pos('Pedro'); console.log('Pedro em', s1); chk(s1 === 'operacoes', 'Pedro na sala Locação e financeiro');
  chk(await pos('Fabiana') === 'comercial', 'Fabiana na sala Comercial');
  chk(await p.locator('.of-a.mp-bot').count() >= 8 && await p.locator('.of-a.fora').count() >= 3, 'Robôs nas salas e quem está fora aparece apagado');
  await p.screenshot({ path: S('e1-escritorio.png'), clip: { x: 240, y: 380, width: 1200, height: 620 } });
  // Pedro troca de tela -> anda até Marketing
  await p.evaluate(`__setPeers([{ nome: 'Pedro', view: 'marketing', depto: 'marketing' }, { nome: 'Fabiana', view: 'comercial', depto: 'comercial' }])`); await p.waitForTimeout(500);
  const meio = await p.evaluate(() => getComputedStyle([...document.querySelectorAll('.of-a.vivo.mp-hum')].find(x => x.title.startsWith('Pedro'))).transform);
  await p.waitForTimeout(1600); const s2 = await pos('Pedro'); console.log('Pedro depois', s2, 'meio do caminho', meio.slice(0, 40)); chk(s2 === 'marketing', 'Pedro andou até Marketing');
  // Atividade nova -> pacote voando
  await p.evaluate(`registrar('Financeiro', 'Teste: repasse conferido.')`); await p.evaluate('render()'); await p.waitForTimeout(300);
  chk(await p.locator('.of-pk').count() >= 1, 'Atividade nova voa como pacote');
  await p.screenshot({ path: S('e2-pacote.png'), clip: { x: 240, y: 380, width: 1200, height: 620 } });
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1800); const w = await p.evaluate('document.documentElement.scrollWidth'); chk(w <= 390, 'Celular sem rolagem lateral (' + w + ')');
  await p.screenshot({ path: S('e3-mobile.png'), fullPage: false });
  chk(!errs.length, 'Sem erros: ' + errs.join(' / '));
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`); await b.close(); })();
