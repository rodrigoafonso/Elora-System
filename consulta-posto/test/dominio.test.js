import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cnpjValido, formatarCnpj, normalizar, pareceCnpj, paraDataIso, distanciaKm } from '../server/dominio/texto.js';
import { buscarPostos, filtrosDisponiveis } from '../server/dominio/busca.js';
import { validarBase } from '../server/fontes/validarBase.js';

const fonte = { nome: 'Teste', url: 'https://exemplo.gov.br', licenca: 'CC-BY', obtidoEm: '2026-11-01' };
const base = {
  meta: { tipo: 'oficial', camposConfiaveis: { combustiveis: true, situacaoCadastral: false, fiscalizacoes: true }, fontes: { cadastro: fonte, fiscalizacoes: fonte } },
  postos: [
    { id: 'a', cnpj: '11222333000181', nomeFantasia: 'Auto Posto São João', endereco: { municipio: 'São Paulo', uf: 'SP' }, coordenadas: { lat: -23.55, lon: -46.63 }, combustiveis: ['GNV'], situacaoCadastral: 'Ativo' },
    { id: 'b', cnpj: '22333444000100', nomeFantasia: 'Posto Central', endereco: { municipio: 'Campinas', uf: 'SP' }, coordenadas: { lat: -22.9, lon: -47.06 }, combustiveis: ['Etanol'] },
    { id: 'c', cnpj: '33444555000100', nomeFantasia: 'Posto Paulista', endereco: { municipio: 'São Paulo', uf: 'SP' }, coordenadas: null },
  ],
  fiscalizacoes: [
    { id: 'f1', postoId: 'a', data: '2021-05-10', tipo: 'Rotina', resultado: 'OK', ocorrencias: [] },
    { id: 'f2', postoId: 'a', data: '2024-02-01', tipo: 'Rotina', resultado: 'OK', ocorrencias: [] },
  ],
};

test('normaliza acentos e caixa', () => {
  assert.equal(normalizar('  SÃO   Paulo '), 'sao paulo');
});

test('CNPJ: validação, formatação e detecção na busca', () => {
  assert.equal(cnpjValido('11.222.333/0001-81'), true);
  assert.equal(cnpjValido('11.222.333/0001-82'), false);
  assert.equal(cnpjValido('00000000000000'), false);
  assert.equal(formatarCnpj('11222333000181'), '11.222.333/0001-81');
  assert.equal(pareceCnpj('11.222.333'), true);
  assert.equal(pareceCnpj('Posto 123'), false);
});

test('datas brasileiras viram ISO e datas inválidas são rejeitadas', () => {
  assert.equal(paraDataIso('05/03/2024'), '2024-03-05');
  assert.equal(paraDataIso('2024-03-05T10:00'), '2024-03-05');
  assert.equal(paraDataIso('31/02/2024'), null);
});

test('distância aproximada São Paulo–Campinas', () => {
  const d = distanciaKm({ lat: -23.55, lon: -46.63 }, { lat: -22.9, lon: -47.06 });
  assert.ok(d > 80 && d < 90, `distância ${d}`);
});

test('busca por cidade sem acento e sem diferenciar maiúsculas', () => {
  const r = buscarPostos(base, { q: 'sao paulo' });
  assert.deepEqual(r.itens.map((p) => p.id).sort(), ['a', 'c']);
});

test('busca por CNPJ parcial com pontuação', () => {
  const r = buscarPostos(base, { q: '22.333.444' });
  assert.equal(r.buscaPorCnpj, true);
  assert.deepEqual(r.itens.map((p) => p.id), ['b']);
});

test('resumo não tem nota, cor ou rótulo de qualidade', () => {
  const [item] = buscarPostos(base, { q: 'São João' }).itens;
  assert.equal(item.fiscalizacoesRegistradas, 2);
  assert.equal(item.ultimaFiscalizacao, '2024-02-01');
  for (const proibido of ['nota', 'cor', 'classificacao', 'seguro']) assert.ok(!(proibido in item));
});

test('filtros só aparecem quando a fonte declara dados confiáveis', () => {
  const f = filtrosDisponiveis(base);
  assert.deepEqual(f.combustivel, ['Etanol', 'GNV']);
  assert.equal(f.situacaoCadastral, null, 'situação não declarada como confiável');
  assert.deepEqual(f.periodoFiscalizacao, { min: '2021-05-10', max: '2024-02-01' });
  // filtro não confiável é ignorado na busca
  assert.equal(buscarPostos(base, { q: 'sao paulo', situacao: 'Ativo' }).total, 2);
});

test('filtro por período de fiscalização', () => {
  assert.deepEqual(buscarPostos(base, { uf: 'SP', desde: '2023-01-01' }).itens.map((p) => p.id), ['a']);
  assert.equal(buscarPostos(base, { uf: 'SP', ate: '2020-01-01' }).total, 0);
});

test('ordenação por distância mantém postos sem coordenadas no fim da lista', () => {
  const r = buscarPostos(base, { uf: 'SP', ordenar: 'distancia', origem: { lat: -22.9, lon: -47.06 } });
  assert.deepEqual(r.itens.map((p) => p.id), ['b', 'a', 'c']);
  assert.equal(r.itens[2].distanciaKm, undefined);
});

test('paginação', () => {
  const r = buscarPostos(base, { uf: 'SP', ordenar: 'nome', pagina: 2, porPagina: 2 });
  assert.equal(r.total, 3);
  assert.equal(r.itens.length, 1);
});

test('base sem licença ou data de obtenção é recusada', () => {
  const ruim = structuredClone(base);
  delete ruim.meta.fontes.cadastro.licenca;
  ruim.meta.fontes.cadastro = { ...ruim.meta.fontes.cadastro, obtidoEm: 'ontem' };
  const erros = validarBase(ruim);
  assert.ok(erros.some((e) => e.includes('licenca')));
  assert.ok(erros.some((e) => e.includes('obtidoEm')));
});

test('base DEMO precisa do aviso "DEMO"', () => {
  const demo = structuredClone(base);
  demo.meta.tipo = 'demo';
  assert.ok(validarBase(demo).some((e) => e.includes('DEMO')));
  demo.meta.aviso = 'DEMO — não são dados reais';
  assert.deepEqual(validarBase(demo), []);
});
