const { chromium } = require('/opt/node-tools/node_modules/playwright'); const fs = require('fs');
const S = f => '/home/claude/testes/shots/' + f; let ok = 0, falhas = [];
const chk = (c, m) => { if (c) ok++; else falhas.push(m); console.log(c ? 'OK ' : 'FALHA ', m); };
(async () => { const seed = fs.readFileSync('/home/claude/elora/seed.json', 'utf8');
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addInitScript(s => { if (!localStorage.getItem('elora-partner-os-v1')) localStorage.setItem('elora-partner-os-v1', s); document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = '[hidden]{display:none!important}'; document.head.appendChild(st); }); }, seed);
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('popup', pp => pp.close());
  await p.goto('file:///home/claude/elora/elora-partner-os.html', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500);
  chk(await p.evaluate('estado.view') === 'meudia', 'Abre em Hoje (Meu dia)');
  const menu = await p.evaluate(() => [...document.querySelectorAll('#nav > button, #nav .nav-area > button')].map(b => b.textContent.trim()));
  console.log('menu', menu.join(' | ')); chk(menu.length <= 9, `Menu enxuto (${menu.length} entradas)`);
  chk((await p.locator('.subnav button').allInnerTexts()).join(',') === 'Meu dia,Aprovações,Agenda', 'Hoje com abas Meu dia, Aprovações, Agenda');
  await p.screenshot({ path: S('n1-menu.png') });
  for (const [v, abas] of [['financeiro', 3], ['mapa', 6], ['central', 5], ['automacoes', 6]]) { await p.evaluate(`ir('${v}')`); await p.waitForTimeout(250); chk(await p.locator('.subnav button').count() === abas, `${v}: ${abas} abas`); }
  // Corretor no sistema: 5 entradas
  await p.evaluate(`estado.perfil='corretor'; estado.quem.corretor='caio'; ir('inicio')`); await p.waitForTimeout(300);
  const mc = await p.evaluate(() => [...document.querySelectorAll('#nav > button, #nav .nav-area > button')].map(b => b.textContent.trim())); console.log('corretor', mc.join(' | ')); chk(mc.length <= 6, `Corretor com ${mc.length} entradas`);
  // App como corretor
  await p.evaluate(`estado.perfil='corretor'; estado.quem.corretor='caio'; estado.app=true; estado.appAba='msgs'; render()`); await p.waitForTimeout(600);
  const nMsg = await p.locator('.wz-b').count(); console.log('mensagens', nMsg); chk(nMsg > 0, 'Aba Mensagens com conversa');
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300); await p.screenshot({ path: S('n2-msgs.png') });
  // Ir para o Início e receber um lead novo -> notificação
  await p.evaluate(`estado.appAba='inicio'; render()`); await p.waitForTimeout(400);
  await p.evaluate(`(() => { const id = 'L-T1'; store.salvar('leads', id, { nome: 'Paula Ramos', telefone: '12981112233', quer: 'Apartamento 2 dorm. no Aquarius', canal: 'Instagram', tipo: 'Locação', etapa: 'novo', origem: 'imobiliaria', criadoEm: REF, corretorId: 'caio', distEm: new Date().toISOString(), hist: [] }); })()`); await p.waitForTimeout(1200);
  chk(await p.locator('#wz-push.ve').count() === 1, 'Lead novo aparece como notificação estilo WhatsApp');
  console.log('push:', (await p.locator('#wz-push').innerText()).replace(/\n/g, ' | '));
  await p.screenshot({ path: S('n3-push.png') });
  chk((await p.locator('.ax-tabs .ax-nb').count()) === 1, 'Contador de não lidas na aba Mensagens');
  // Recado no chat e lembrete
  await p.evaluate(`(() => { const id = 'CH-T1'; DB.chat = { ...(DB.chat || {}), [id]: { id, canal: 'corretores', q: new Date().toISOString(), autor: 'Pedro', txt: 'Caio, chave do EL-0118 na portaria.' } }; store.gravarLocal(); agendar(); })()`); await p.waitForTimeout(1200);
  console.log('push2:', (await p.locator('#wz-push').innerText()).replace(/\n/g, ' | '));
  chk((await p.locator('#wz-push').innerText()).includes('Recado'), 'Recado vira notificação');
  await p.evaluate(`store.salvar('tarefas', 'TF-T1', { titulo: 'Visita com Paula Ramos', data: REF, hora: '15:00', corretorId: 'caio', leadId: 'L-T1', status: 'pendente' })`); await p.waitForTimeout(1200);
  chk((await p.locator('#wz-push').innerText()).includes('Lembrete'), 'Lembrete vira notificação');
  await p.locator('#wz-push').click(); await p.waitForTimeout(600);
  chk(await p.evaluate('estado.appAba') === 'msgs', 'Tocar na notificação abre as Mensagens');
  const txt = await p.locator('.wz-lista').innerText(); chk(txt.includes('Paula Ramos') && txt.includes('chave do EL-0118') && txt.includes('15:00'), 'Lead, recado e lembrete na conversa');
  await p.screenshot({ path: S('n4-conversa.png') });
  await p.locator('.wz-b .wz-bt').last().click(); await p.waitForTimeout(400); console.log('após tocar botão', await p.evaluate('estado.appAba'), await p.locator('dialog[open]').count());
  // Proprietário também tem Mensagens
  await p.evaluate(`estado.perfil='proprietario'; estado.appAba='msgs'; render()`); await p.waitForTimeout(500); chk(await p.evaluate("AX_ABAS.proprietario.some(a => a[0] === 'msgs') && AX_ABAS.inquilino.some(a => a[0] === 'msgs') && AX_ABAS.comprador.some(a => a[0] === 'msgs')"), 'Proprietário, locatário e comprador têm a aba Mensagens');
  chk(await p.evaluate('document.documentElement.scrollWidth') <= 390, 'Celular sem rolagem lateral');
  chk(!errs.length, 'Sem erros: ' + errs.join(' / '));
  console.log(`\n${ok} ok, ${falhas.length} falha(s)`); await b.close(); })();
