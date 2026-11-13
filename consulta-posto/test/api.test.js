import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { criarApp } from '../server/app.js';
import { lerConfig } from '../server/config.js';
import { FonteArquivo } from '../server/fontes/fonteArquivo.js';
import { RepositorioRelatos } from '../server/relatos/repositorio.js';
import { JPEG_COM_EXIF } from './fixtures.js';

const TOKEN = 'token-de-moderacao-para-testes-123';
let dir;
let url;
let servidor;
let servidorSemDados;
let urlSemDados;

async function subir(fonte, relatos, config) {
  const s = criarApp({ fonte, relatos, config });
  await new Promise((ok) => s.listen(0, '127.0.0.1', ok));
  return [s, `http://127.0.0.1:${s.address().port}`];
}

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'api-'));
  const config = { ...lerConfig({ MODERACAO_TOKEN: TOKEN }), dirPrivado: dir };
  const relatos = await new RepositorioRelatos(dir).iniciar();
  [servidor, url] = await subir(await new FonteArquivo(config.caminhoBase).carregar(), relatos, config);
  [servidorSemDados, urlSemDados] = await subir(await new FonteArquivo(join(dir, 'nao-existe.json')).carregar(), relatos, config);
});

after(async () => {
  servidor.close();
  servidorSemDados.close();
  await rm(dir, { recursive: true, force: true });
});

const json = (caminho, opcoes = {}, base = url) =>
  fetch(base + caminho, { ...opcoes, headers: { 'Content-Type': 'application/json', ...opcoes.headers } }).then(async (r) => [r.status, await r.json(), r]);

test('status informa base DEMO, fontes e filtros', async () => {
  const [s, corpo, r] = await json('/api/status');
  assert.equal(s, 200);
  assert.equal(corpo.fonte.tipo, 'demo');
  assert.match(corpo.fonte.aviso, /DEMO — não são dados reais/);
  assert.ok(corpo.fonte.fontes.cadastro.obtidoEm);
  assert.ok(corpo.filtros.combustivel.length > 0);
  assert.match(corpo.linksOficiais.consultaPostos.url, /^https:\/\/www\.gov\.br\/anp\//);
  assert.match(r.headers.get('content-security-policy'), /default-src 'self'/);
});

test('busca, detalhe e validação de parâmetros', async () => {
  const [s, corpo] = await json('/api/postos?q=curitiba');
  assert.equal(s, 200);
  assert.ok(corpo.total > 0);
  assert.equal(corpo.fonte.tipo, 'demo');
  const [s2, det] = await json(`/api/postos/${corpo.itens[0].id}`);
  assert.equal(s2, 200);
  assert.equal(det.posto.id, corpo.itens[0].id);
  assert.ok(Array.isArray(det.fiscalizacoes));
  assert.equal((await json('/api/postos/nao-existe'))[0], 404);
  assert.equal((await json('/api/postos?q='))[0], 400);
  assert.equal((await json('/api/postos?q=x&uf=XX'))[0], 400);
});

test('ordenar por distância sem localização cai para relevância', async () => {
  const [s, corpo] = await json('/api/postos?q=recife&ordenar=distancia');
  assert.equal(s, 200);
  assert.ok(corpo.itens.every((p) => p.distanciaKm === undefined));
});

test('fonte indisponível responde 503 com link oficial', async () => {
  const [s, corpo] = await json('/api/postos?q=recife', {}, urlSemDados);
  assert.equal(s, 503);
  assert.match(corpo.erro, /não puderam ser carregados/);
  assert.ok(corpo.linksOficiais.consultaPostos.url);
  const [, status] = await json('/api/status', {}, urlSemDados);
  assert.equal(status.disponivel, false);
});

test('fluxo de relato: envio, moderação, publicação e remoção', async () => {
  const [, busca] = await json('/api/postos?q=recife');
  const postoId = busca.itens[0].id;
  const [s422, erro] = await json('/api/relatos', { method: 'POST', body: JSON.stringify({ postoId }) });
  assert.equal(s422, 422);
  assert.ok(erro.erros.descricao && erro.erros.aceiteTermos);

  const [s, criado] = await json('/api/relatos', {
    method: 'POST',
    body: JSON.stringify({
      postoId,
      dataAproximada: '2026-09',
      tipoProblema: 'volume',
      descricao: 'Abasteci 20 litros e o tanque pareceu receber bem menos que o indicado.',
      aceiteTermos: true,
      consentimentoImagens: true,
      anexos: [{ nome: 'nota.jpg', tipo: 'image/jpeg', base64: JPEG_COM_EXIF.toString('base64') }],
    }),
  });
  assert.equal(s, 201);
  assert.match(criado.protocolo, /^R-[0-9A-F]{8}$/);

  let [, publicos] = await json(`/api/postos/${postoId}/relatos`);
  assert.equal(publicos.itens.length, 0);
  assert.equal(publicos.aguardandoModeracao, 1);

  assert.equal((await json('/api/moderacao/pendentes'))[0], 401);
  const auth = { headers: { Authorization: `Bearer ${TOKEN}` } };
  const [, pend] = await json('/api/moderacao/pendentes', auth);
  const relato = pend.relatos[0];
  const anexo = await fetch(`${url}/api/moderacao/relatos/${relato.id}/anexos/${relato.anexos[0].nome}`, auth);
  assert.equal(anexo.status, 200);
  assert.ok(!Buffer.from(await anexo.arrayBuffer()).includes(Buffer.from('Exif')));
  await json(`/api/moderacao/relatos/${relato.id}`, { method: 'POST', body: JSON.stringify({ acao: 'publicar' }), ...auth });

  [, publicos] = await json(`/api/postos/${postoId}/relatos`);
  assert.equal(publicos.itens.length, 1);
  assert.equal(publicos.itens[0].verificado, false);
  assert.equal(publicos.itens[0].contato, undefined);

  const [sRem] = await json('/api/relatos/remocao', { method: 'POST', body: JSON.stringify({ protocolo: criado.protocolo, codigo: criado.codigoRemocao }) });
  assert.equal(sRem, 200);
  [, publicos] = await json(`/api/postos/${postoId}/relatos`);
  assert.equal(publicos.itens.length, 0);
});

test('pedido de remoção por terceiros exige motivo e e-mail', async () => {
  const [s] = await json('/api/solicitacoes-remocao', { method: 'POST', body: JSON.stringify({ referencia: 'x' }) });
  assert.equal(s, 422);
  const [s2, r] = await json('/api/solicitacoes-remocao', {
    method: 'POST',
    body: JSON.stringify({ referencia: 'Posto Demonstração 01', motivo: 'O relato cita meu nome completo e meu telefone.', contato: 'resp@exemplo.com', aceitePrivacidade: true }),
  });
  assert.equal(s2, 201);
  assert.match(r.protocolo, /^S-/);
});

test('arquivos estáticos: SPA, bloqueio de travessia de diretório e tipo de conteúdo', async () => {
  const r = await fetch(`${url}/posto/demo-001`);
  assert.equal(r.status, 200);
  assert.match(await r.text(), /Consulta Posto/);
  assert.equal((await fetch(`${url}/..%2f..%2fpackage.json`)).status, 404);
  assert.equal((await fetch(`${url}/nao-existe.js`)).status, 404);
  assert.match((await fetch(`${url}/js/app.js`)).headers.get('content-type'), /javascript/);
});

test('corpo acima do limite e tipo errado são recusados', async () => {
  const r = await fetch(`${url}/api/relatos/remocao`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: 'x' });
  assert.equal(r.status, 415);
  const grande = await fetch(`${url}/api/relatos/remocao`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 'a'.repeat(10000) }) });
  assert.equal(grande.status, 413);
});
