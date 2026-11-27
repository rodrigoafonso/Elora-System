const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const S = f => '/home/claude/testes/shots/' + f; let ok = 0, falhas = [];
const chk = (c, m) => { if (c) ok++; else falhas.push(m); console.log(c ? 'OK ' : 'FALHA ', m); };
(async () => { const seed = fs.readFileSync('/home/claude/elora/seed.json', 'utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(s => { if (location.protocol === 'file:' && !localStorage.getItem('elora-partner-os-v1')) localStorage.setItem('elora-partner-os-v1', s); }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file:///home/claude/elora/elora-partner-os.html#fontes', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(3000);
  // 1) Formulário do Meta
  await p.locator('[data-act="meta-modelo"]').click(); await p.waitForTimeout(200); chk(await p.locator('dialog[open] table tr').count() === 11, 'Modelo do formulário com 10 perguntas');
  await p.locator('[data-act="meta-fonte"]').click(); await p.waitForTimeout(400); chk(await p.evaluate(`!!DB.fontes['FO-META']`), 'Fonte Meta Lead Ads criada');
  const im = await p.evaluate(`(() => { const i = lista('imoveis').find(i => emOferta(i) && paraLocacao(i) && +i.pedido > 0 && /apart/i.test(i.descricao)); return { b: String(bairro(i)).split(',')[0], c: custoMes(i), q: i.quartos || 2 }; })()`);
  const csv = `id,created_time,ad_name,você_quer_alugar_ou_comprar?,em_qual_bairro_você_procura?,qual_tipo_de_imóvel?,quantos_quartos_você_precisa?,qual_é_o_seu_orçamento?,qual_é_a_renda_mensal_da_família?,para_quando_você_precisa_do_imóvel?,full_name,phone_number,email
l:1,2026-11-27T10:00:00-0300,Aluguel ${im.b},Alugar,${im.b},Apartamento,${im.q},${Math.round(im.c * 1.2)},R$ 12.000 a 20.000,Em até 30 dias,Renata Lima,p:+5512981234567,renata@exemplo.com
l:2,2026-11-27T10:05:00-0300,Aluguel ${im.b},Comprar,Urbanova,Casa,3,650000,Acima de R$ 20.000,Mais de 3 meses,Otávio Reis,p:+5512987654321,`;
  await p.evaluate(`ACOES['fonte-colar']({ id: 'FO-META' })`); await p.waitForTimeout(200); await p.fill('#fo-colar', csv); await p.locator('[data-act="fonte-ler"]').click(); await p.waitForTimeout(300);
  console.log('lidos', JSON.stringify(await p.evaluate('estado.fonteColar.itens')));
  await p.locator('[data-act="fonte-importar"]').click(); await p.waitForTimeout(1500);
  const l1 = await p.evaluate(`lista('leads').find(l => l.nome === 'Renata Lima')`), l2 = await p.evaluate(`lista('leads').find(l => l.nome === 'Otávio Reis')`);
  console.log('L1', JSON.stringify({ tipo: l1.tipo, quer: l1.quer, regiao: l1.regiao, valorMax: l1.valorMax, q: l1.qualif, quartosMin: l1.quartosMin, tel: l1.telefone }));
  chk(l1 && l1.tipo === 'Locação' && l1.qualif.renda === 16000 && l1.qualif.muda === 'ja' && l1.quartosMin == im.q && l1.valorMax > 0, 'Lead do Meta entra com renda, prazo, quartos e orçamento');
  chk(l2 && l2.tipo === 'Compra' && l2.qualif.muda === 'mais', 'Segundo lead lido como compra');
  chk(await p.evaluate(`qualificacao(lista('leads').find(l => l.nome === 'Renata Lima')).pronto`), 'Lead do Meta já chega qualificado (pronto para o corretor)');
  await p.waitForTimeout(500); chk(await p.evaluate(`lista('aprovacoes').some(a => a.ref && a.ref.id === '${l1.id}' && String(a.id).startsWith('AP-MT-'))`), 'Casamenteiro já preparou as melhores opções para ela');
  // 2) Páginas de bairro
  await p.evaluate(`salvarConfig({ siteUrl: 'https://elora.test', whatsapp: '12999990000' })`); await p.evaluate(`ir('paginas')`); await p.waitForTimeout(300);
  chk(await p.locator('#pg-tab tbody tr').count() > 0, 'Tabela de bairros com oferta e procura');
  await p.screenshot({ path: S('d1-paginas.png'), fullPage: true });
  const html = await p.evaluate(`paginaBairro('${im.b}', 'ambos', 'abc123xyz')`); fs.writeFileSync('/home/claude/testes/fake/pagina.html', html);
  const q = await ctx.newPage(); const qerr = []; q.on('pageerror', e => qerr.push(e.message)); let recebido = null;
  await q.route('https://elora.test/api/v1/captacao/receber/abc123xyz', async r => { recebido = JSON.parse(r.request().postData()); await r.fulfill({ status: 202, headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"recebido":true}' }); });
  await q.goto('file:///home/claude/testes/fake/pagina.html'); await q.setViewportSize({ width: 390, height: 844 });
  await q.fill('#sr', '9000'); await q.waitForTimeout(100); const sim = await q.locator('#sres').innerText(); console.log('simulador:', sim); chk(/R\$\s?3\.000/.test(sim), 'Simulador: renda 9.000 → aluguel até R$ 3.000');
  await q.screenshot({ path: S('d2-pagina.png'), fullPage: true });
  await q.locator('button[type=submit]').click(); await q.waitForTimeout(200); chk((await q.locator('#fm').innerText()).includes('Preencha'), 'Formulário valida nome, WhatsApp e autorização');
  await q.fill('input[name=nome]', 'Caio Teste'); await q.fill('input[name=telefone]', '(12) 98888-7777'); await q.check('input[name=ok]'); await q.locator('button[type=submit]').click(); await q.waitForTimeout(600);
  console.log('enviado:', JSON.stringify(recebido)); chk(recebido && recebido.nome === 'Caio Teste' && /renda informada: R\$ 9000/.test(recebido.mensagem) && recebido.bairro === im.b, 'Formulário envia para a plataforma com a qualificação');
  chk((await q.locator('#fm').innerText()).includes('Recebemos'), 'Cliente vê a confirmação');
  chk(!qerr.length, 'Página sem erros: ' + qerr.join(' / '));
  chk(!/<script(?![^>]*src)[^>]*>[^<]*abc123xyz/.test('') && html.includes('abc123xyz') && !html.includes('undefined'), 'Página gerada sem campos vazios');
  // 3) Relocação
  await p.evaluate(`ir('relocacao')`); await p.waitForTimeout(300); await p.locator('[data-act="em-nova"]').click(); await p.fill('#rl-nome', 'Empresa Aeroespacial Exemplo'); await p.fill('#rl-cid', 'São José dos Campos'); await p.selectOption('#rl-ev', 'contratacao'); await p.fill('#rl-fonte', 'https://exemplo.com/noticia'); await p.locator('#frm-em button[type=submit]').click(); await p.waitForTimeout(400);
  const eid = await p.evaluate(`lista('empresas')[0].id`); chk(!!eid, 'Empresa cadastrada');
  await p.locator(`[data-act="em-msg"][data-id="${eid}"]`).click(); await p.waitForTimeout(200); chk((await p.inputValue('#ach-m')).includes('programa de relocação'), 'Proposta de parceria pronta'); await p.keyboard.press('Escape');
  await p.locator(`[data-act="em-st"][data-id="${eid}"][data-s="parceira"]`).click(); await p.waitForTimeout(600);
  const e = await p.evaluate(`DB.empresas['${eid}']`); chk(e.status === 'parceira' && e.fonteId && await p.evaluate(`!!DB.fontes['${e.fonteId}']`), 'Parceira vira fonte de captação');
  await p.locator('[data-act="em-f"][data-f="parceira"]').click(); await p.waitForTimeout(200); await p.screenshot({ path: S('d3-relocacao.png'), fullPage: true });
  await p.evaluate(`ir('mapa')`); await p.waitForTimeout(400); chk(await p.locator('[data-id="b:reloc"]').count() > 0, 'Agente de relocação no Mapa');
  chk(!errs.length, 'Sem erros: ' + errs.join(' / '));
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`); await b.close(); })();
