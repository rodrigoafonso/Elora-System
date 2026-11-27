const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const S = f => '/home/claude/testes/shots/' + f; let ok = 0, falhas = [];
const chk = (c, m) => { if (c) ok++; else falhas.push(m); console.log(c ? 'OK ' : 'FALHA ', m); };
(async () => { const seed = fs.readFileSync('/home/claude/elora/seed.json', 'utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
  await ctx.addInitScript(s => { if (location.protocol === 'file:' && location.pathname.endsWith('elora-partner-os.html') && !localStorage.getItem('elora-partner-os-v1')) localStorage.setItem('elora-partner-os-v1', s); }, seed);
  // 1) Botão no navegador, num anúncio
  const a = await ctx.newPage(); await a.goto('file:///home/claude/testes/fake/anuncio.html'); a.on('dialog', d => d.accept());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('popup', pp => pp.close());
  await p.goto('file:///home/claude/elora/elora-partner-os.html#prospeccao', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  const bm = await p.evaluate('BOOKMARKLET'); await a.evaluate(bm.replace(/^javascript:/, '')); await a.waitForTimeout(300);
  const copiado = await a.evaluate(() => navigator.clipboard.readText()); console.log('copiado', copiado.slice(0, 160)); chk(copiado.includes('"elora":1') && copiado.includes('R$ 2.300'), 'Botão copia o anúncio');
  // 2) Colar anúncio
  chk(await p.locator('#ach').count() === 1, 'Painel Achados dos portais na Captação');
  await p.locator('[data-act="ach-colar"]').click(); await p.fill('#ach-txt', copiado); await p.locator('[data-act="ach-ler"]').click(); await p.waitForTimeout(500);
  const pr = await p.evaluate(`lista('prospects').find(x => x.achado)`); console.log(JSON.stringify(pr).slice(0, 300));
  chk(pr && pr.preco === 2300 && pr.negocio === 'locacao' && pr.anunciante === 'particular' && pr.portal && pr.link.includes('anuncio.html') === false, 'Cartão criado com preço, negócio e particular');
  // link file:// não é https, então fica vazio (só https é aceito)
  chk(await p.locator('#ach-lista .item').count() === 1, 'Achado aparece na lista');
  chk(await p.evaluate(`!prDaFila(lista('prospects').find(x => x.achado))`), 'Sem contato, não entra na fila de ligação');
  // achado de um agente (com https)
  await p.evaluate(`store.salvar('prospects', 'PR-AG1', { descricao: 'Casa 3 dorm. com quintal', negocio: 'venda', bairro: 'Urbanova', fonte: 'portal', link: 'https://www.vivareal.com.br/imovel/exemplo', portal: 'Viva Real', preco: 690000, diasAnunciado: 75, anunciante: 'particular', precoCaiu: true, achado: true, achadoEm: new Date().toISOString(), etapa: 'mapeado', criadoEm: new Date().toISOString(), tentativas: [] })`);
  await p.evaluate(`salvarConfig({ captacaoAgente: { em: new Date().toISOString(), n: 1, bairros: 'Urbanova, Jardim Aquarius' } })`); await p.waitForTimeout(500);
  chk((await p.locator('#ach-lista .item').first().innerText()).includes('Urbanova'), 'Mais quente primeiro (particular, 75 dias, preço caiu)');
  await p.screenshot({ path: S('c1-achados.png'), fullPage: false, clip: await p.locator('#ach').boundingBox() });
  // 3) Salvar contato
  const f = p.locator('#ach-lista form').first(); await f.locator('input[name=tel]').fill('(12) 99876-5432'); await f.locator('input[name=nome]').fill('Sr. Antônio'); await f.locator('button[type=submit]').click(); await p.waitForTimeout(500);
  const ag = await p.evaluate(`DB.prospects['PR-AG1']`); chk(ag.telefone === '(12) 99876-5432' && ag.proprietario === 'Sr. Antônio', 'Contato salvo no cartão');
  chk(await p.evaluate(`prDaFila(DB.prospects['PR-AG1'])`), 'Com contato, entra na fila de hoje');
  // 4) Chat do portal
  const id2 = await p.evaluate(`lista('prospects').find(x => x.achado && x.id !== 'PR-AG1').id`); await p.locator(`[data-act="ach-chat"][data-id="${id2}"]`).click(); await p.waitForTimeout(400);
  chk(await p.evaluate(`DB.prospects['${id2}'].tentativas[0].canal`) === 'portal', 'Chat do portal registrado como tentativa');
  await p.locator('[data-act="ach-botao"]').click(); await p.waitForTimeout(200); chk((await p.inputValue('#bm-cod')).startsWith('javascript:'), 'Tela do botão do navegador com o código');
  chk(!errs.length, 'Sem erros: ' + errs.join(' / '));
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`); await b.close(); })();
