const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const S = f => '/home/claude/testes/shots/' + f; let ok = 0, falhas = [];
const chk = (c, m) => { if (c) ok++; else falhas.push(m); console.log(c ? 'OK ' : 'FALHA ', m); };
(async () => { const seed = fs.readFileSync('/home/claude/elora/seed.json', 'utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(s => { if (!localStorage.getItem('elora-partner-os-v1')) localStorage.setItem('elora-partner-os-v1', s); document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '[hidden]{display:none!important}'; document.head.appendChild(st); }); }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/elora/elora-partner-os.html#casamento', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(5000);
  const info = await p.evaluate(`lista('leads').filter(l => PROB[l.etapa]).map(l => [l.nome, qualificacao(l).pronto, melhoresOpcoes(l).length, !!l.telefone])`); console.log(JSON.stringify(info));
  chk(await p.evaluate('estado.view') === 'casamento', 'Tela Melhores opções abre');
  const n = await p.evaluate(`lista('aprovacoes').filter(a => String(a.id).startsWith('AP-MT-')).length`); console.log('pedidos casamenteiro', n);
  const prontos = info.filter(x => x[1] && x[2] && x[3]).length; chk(n === prontos, `Agente preparou ${n} mensagem(ns) para ${prontos} cliente(s) qualificado(s) com opções`);
  if (n) { const a = await p.evaluate(`lista('aprovacoes').find(a => String(a.id).startsWith('AP-MT-'))`); console.log(a.conteudo); chk(a.status === 'pendente' && /\d\) /.test(a.conteudo), 'Mensagem com as opções na Central, aguardando aprovação'); }
  await p.evaluate('casarVarredura()'); await p.waitForTimeout(500); chk(await p.evaluate(`lista('aprovacoes').filter(a => String(a.id).startsWith('AP-MT-')).length`) === n, 'Rodar de novo não duplica');
  await p.screenshot({ path: S('t1-casamento.png'), fullPage: true });
  // Cliente qualificado de teste: salvar o lead dispara o casamenteiro
  const r = await p.evaluate(`(() => { const im = lista('imoveis').find(i => emOferta(i) && paraLocacao(i) && +i.pedido > 0 && !contratoAtivoDo(i.id)); if (!im) return 'sem imovel'; const l = DB.leads['L-01'], b = String(bairro(im));
    store.salvar('leads', 'L-01', { ...l, tipo: 'Locação', quer: 'apartamento ' + b, regiao: b, valorMax: Math.round(custoMes(im) * 1.2), qualif: { ...(l.qualif || {}), renda: Math.round(custoMes(im) * 5), muda: 'ja' } }); return [im.id, b, qualificacao(DB.leads['L-01']).pronto, melhoresOpcoes(DB.leads['L-01']).length]; })()`);
  console.log('teste', JSON.stringify(r)); await p.waitForTimeout(1200);
  const ap1 = await p.evaluate(`lista('aprovacoes').find(a => String(a.id).startsWith('AP-MT-') && a.ref.id === 'L-01')`);
  chk(!!ap1 && ap1.status === 'pendente', 'Lead qualificado: o agente prepara as melhores opções e manda para a Central');
  if (ap1) console.log(ap1.conteudo);
  await p.evaluate(`ir('casamento')`); await p.waitForTimeout(400); chk(await p.locator('#mt-lista .item').count() >= 1 && await p.locator('#mt-lista .mt-ops > div').count() >= 1, 'Tela mostra o cliente com as opções e a nota');
  await p.screenshot({ path: S('t1-casamento.png'), fullPage: true });
  // Score dos achados
  await p.evaluate(`(() => { const now = new Date().toISOString(); store.salvar('prospects', 'PR-S1', { descricao: 'Apartamento 2 dorm.', negocio: 'locacao', bairro: 'Jardim Aquarius, São José dos Campos', fonte: 'portal', link: 'https://www.olx.com.br/x1', portal: 'OLX', preco: 2000, diasAnunciado: 65, anunciante: 'particular', precoCaiu: true, achado: true, achadoEm: now, etapa: 'mapeado', criadoEm: now, tentativas: [] });
    store.salvar('prospects', 'PR-S2', { descricao: 'Sala comercial', negocio: 'locacao', bairro: 'Bairro Sem Procura', fonte: 'portal', link: 'https://www.olx.com.br/x2', portal: 'OLX', preco: 9000, anunciante: 'imobiliaria', achado: true, achadoEm: now, etapa: 'mapeado', criadoEm: now, tentativas: [] }); })()`);
  const s1 = await p.evaluate(`achadoScore(DB.prospects['PR-S1'])`), s2 = await p.evaluate(`achadoScore(DB.prospects['PR-S2'])`); console.log('S1', JSON.stringify(s1), 'S2', JSON.stringify(s2));
  chk(s1.s > s2.s && s1.s >= 55, 'Particular, antigo, com preço caído pontua mais');
  await p.evaluate(`ir('prospeccao')`); await p.waitForTimeout(400);
  chk(await p.locator('#ach-lista [data-id="PR-S2"]').count() === 0, 'Filtro padrão (nota 35+) esconde o frio');
  await p.locator('[data-act="ach-f"][data-f="todos"]').click(); await p.waitForTimeout(300); chk(await p.locator('#ach-lista form[data-id="PR-S2"]').count() === 1, 'Filtro Todos mostra o frio');
  await p.screenshot({ path: S('t2-achados.png'), clip: await p.locator('#ach').boundingBox() });
  await p.evaluate(`ir('mapa')`); await p.waitForTimeout(500); chk(await p.locator('[data-id="b:match"]').count() > 0, 'Casamenteiro aparece no Mapa');
  chk(!errs.length, 'Sem erros: ' + errs.join(' / '));
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`); await b.close(); })();
