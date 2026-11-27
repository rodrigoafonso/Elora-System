const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const S = f => '/home/claude/testes/shots/' + f; let ok = 0, falhas = [];
const chk = (c, m) => { if (c) ok++; else falhas.push(m); console.log(c ? 'OK ' : 'FALHA ', m); };
(async () => { const seed = fs.readFileSync('/home/claude/elora/seed.json', 'utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(s => { if (!localStorage.getItem('elora-partner-os-v1')) localStorage.setItem('elora-partner-os-v1', s); }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); const pops = []; p.on('popup', pp => { pops.push(pp.url()); pp.close(); });
  await p.goto('file:///home/claude/elora/elora-partner-os.html#meudia', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  chk(await p.evaluate('estado.view') === 'meudia', 'Meu dia abre');
  console.log('kpis', (await p.locator('#md-kpis').innerText()).replace(/\n/g, ' | '));
  await p.screenshot({ path: S('a1-meudia.png'), fullPage: true });
  // 1. Lead de demonstração -> automação com mensagem -> pedido de aprovação (sem mensagem liberada)
  await p.evaluate(`ir('automacoes')`); await p.waitForTimeout(300);
  await p.locator('button[data-act="au-receita"][data-i="1"]').click(); await p.waitForTimeout(200); await p.locator('#frm-auto button[type=submit]').click(); await p.waitForTimeout(300);
  const r2 = await p.evaluate(`lista('automacoes').find(r => r.quando === 'visita').id`); await p.locator(`button[data-act="au-ligar"][data-id="${r2}"]`).click(); await p.waitForTimeout(200);
  await p.evaluate(`(() => { const l = DB.leads['L-02']; store.salvar('leads', l.id, histLead(l, 'visita', 'Visita feita', l.imovelId)); })()`); await p.waitForTimeout(1000);
  chk(await p.evaluate(`lista('aprovacoes').filter(a => a.status === 'pendente').length`) === 1, 'Mensagem da automação vira pedido pendente');
  chk(await p.evaluate(`Object.keys(DB.leads['L-02'].autoMsg || {}).length`) === 0, 'Sem aprovação, nenhuma mensagem liberada para envio');
  await p.evaluate(`ir('flows')`); await p.waitForTimeout(300); chk(await p.locator('#am-fila .item').count() === 0, 'Sequências não mostra mensagem não aprovada');
  // 2. Central: recusar exige motivo; aprovar com texto editado
  await p.evaluate(`ir('aprovacoes')`); await p.waitForTimeout(300); chk(await p.locator('#aq-fila .item').count() === 1, 'Central lista o pedido');
  await p.screenshot({ path: S('a2-central.png'), fullPage: true });
  await p.locator('#aq-fila button[data-act="aq-abrir"]').click(); await p.waitForTimeout(200);
  await p.locator('#dlg button[data-act="aq-recusar"]').click(); await p.waitForTimeout(200);
  chk(await p.evaluate(`lista('aprovacoes')[0].status`) === 'pendente', 'Recusa sem motivo é bloqueada');
  await p.fill('#aq-quem', ''); await p.locator('#dlg button[data-act="aq-aprovar"]').click(); await p.waitForTimeout(200);
  chk(await p.evaluate(`lista('aprovacoes')[0].status`) === 'pendente', 'Aprovação sem nome é bloqueada');
  await p.fill('#aq-quem', 'Pedro'); const t0 = await p.inputValue('#aq-txt'); await p.fill('#aq-txt', t0 + ' Posso te ligar amanhã?');
  await p.screenshot({ path: S('a3-decidir.png') });
  await p.locator('#dlg button[data-act="aq-aprovar"]').click(); await p.waitForTimeout(600);
  const a = await p.evaluate(`lista('aprovacoes')[0]`);
  chk(a.status === 'aprovado' && a.decisao.nome === 'Pedro' && a.decisao.editado && a.decisao.texto.endsWith('Posso te ligar amanhã?') && a.decisao.em, 'Aprovação registra quem, quando e texto exato');
  const am = await p.evaluate(`Object.values(DB.leads['L-02'].autoMsg || {})[0]`); chk(am && am.x === a.decisao.texto && am.apId === a.id, 'Mensagem liberada com o texto aprovado');
  // 3. Envio pela pessoa -> resultado registrado
  await p.evaluate(`ir('flows')`); await p.waitForTimeout(300); chk(await p.locator('#am-fila .item').count() === 1, 'Mensagem aprovada aparece para envio');
  await p.locator('#am-fila [data-act="zap-reg"]').first().click(); await p.waitForTimeout(800);
  const a2 = await p.evaluate(`lista('aprovacoes')[0]`); chk(a2.status === 'enviado' && a2.envio && a2.envio.em, 'Envio registrado na aprovação');
  chk(await p.evaluate(`DB.leads['L-02'].hist[0].t`) === 'mensagem', 'Histórico do lead registra o contato');
  console.log('popup', pops[0] && pops[0].slice(0, 60));
  await p.evaluate(`estado.aqTab='historico'; ir('aprovacoes')`); await p.waitForTimeout(300); chk(await p.locator('#aq-hist .item').count() === 1, 'Registro mostra a decisão e o envio');
  console.log('registro:', (await p.locator('#aq-hist .item').first().innerText()).replace(/\n/g, ' | ').slice(0, 300));
  await p.screenshot({ path: S('a4-registro.png'), fullPage: true });
  // 4. Publicação: sem aprovação não marca publicado
  const pid = await p.evaluate(`(() => { const id = 'PO-T1'; store.salvar('posts', id, { id, data: REF, status: 'agendado', canal: 'Instagram', formato: 'Post', tema: 'Casa no Urbanova', texto: 'Texto do post', criadoEm: REF }); return id; })()`);
  await p.evaluate(`ACOES['mk-pub']({ id: '${pid}' })`); await p.waitForTimeout(500);
  chk(await p.evaluate(`DB.posts['${pid}'].status`) !== 'publicado', 'Publicação sem aprovação não é marcada');
  const ap = await p.evaluate(`lista('aprovacoes').find(a => a.tipo === 'post')`); chk(ap && ap.status === 'pendente', 'Publicação vai para a Central');
  await p.evaluate(`ACOES['mk-pub']({ id: '${pid}' })`); await p.waitForTimeout(300); chk(await p.evaluate(`lista('aprovacoes').filter(a => a.tipo === 'post').length`) === 1, 'Pedir de novo não duplica');
  await p.evaluate(`estado.aqTab='pendentes'; ir('aprovacoes')`); await p.waitForTimeout(300); await p.locator(`#aq-fila button[data-id="${ap.id}"]`).click(); await p.waitForTimeout(200);
  await p.fill('#aq-quem', 'Equipe'); await p.locator('#dlg button[data-act="aq-aprovar"]').click(); await p.waitForTimeout(300);
  chk(await p.evaluate(`lista('aprovacoes').find(a => a.tipo === 'post').status`) === 'pendente', 'Quem pediu não aprova o próprio pedido');
  await p.fill('#aq-quem', 'Rodrigo'); await p.locator('#dlg button[data-act="aq-aprovar"]').click(); await p.waitForTimeout(500);
  await p.evaluate(`ACOES['mk-pub']({ id: '${pid}' })`); await p.waitForTimeout(600);
  chk(await p.evaluate(`DB.posts['${pid}'].status`) === 'publicado' && await p.evaluate(`lista('aprovacoes').find(a => a.tipo === 'post').status`) === 'enviado', 'Aprovada, a publicação é marcada e registrada');
  // 5. Revisão semanal e Integrações
  await p.evaluate(`ir('reunioes')`); await p.waitForTimeout(300); chk(await p.locator('#rv-sem').count() === 1, 'Revisão semanal aparece em Reuniões');
  console.log('revisao:', (await p.locator('#rv-sem').innerText()).replace(/\n/g, ' | ').slice(0, 500));
  await p.screenshot({ path: S('a5-revisao.png'), fullPage: true });
  await p.evaluate(`ir('integracoes')`); await p.waitForTimeout(300); const ig = await p.locator('#ig-lista').innerText();
  chk(/Não conectada/.test(ig) && /Manual/.test(ig), 'Integrações mostra o que não está conectado'); await p.screenshot({ path: S('a6-integracoes.png'), fullPage: true });
  // 6. Persistência: recarregar
  await p.reload({ waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2000);
  chk(await p.evaluate(`lista('aprovacoes').length`) === 2 && await p.evaluate(`lista('aprovacoes').every(a => a.status === 'enviado')`), 'Aprovações reaparecem depois de recarregar');
  // 7. Celular
  await p.setViewportSize({ width: 390, height: 844 }); for (const v of ['meudia', 'aprovacoes', 'integracoes', 'reunioes']) { await p.evaluate(`ir('${v}')`); await p.waitForTimeout(250); const w = await p.evaluate('document.documentElement.scrollWidth'); chk(w <= 390, `Sem rolagem lateral no celular: ${v} (${w})`); }
  await p.evaluate(`ir('meudia')`); await p.screenshot({ path: S('a7-meudia-mobile.png'), fullPage: true });
  chk(!errs.length, 'Sem erros de página: ' + errs.join(' / '));
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`); await b.close(); })();
