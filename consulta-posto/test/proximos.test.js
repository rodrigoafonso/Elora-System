import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buscarProximos, localizarPorCep } from '../server/dominio/busca.js';
import { aplicarCoordenadas, normalizarCep } from '../server/importador/importar.js';

const fonte = { nome: 'Teste', url: 'https://exemplo.gov.br', licenca: 'Aberta', obtidoEm: '2026-11-14' };
const posto = (id, municipio, cep, coordenadas) => ({ id, cnpj: id, razaoSocial: `Posto ${id}`, endereco: { municipio, uf: 'SP', cep }, coordenadas });
const base = {
  meta: { fontes: {}, camposConfiaveis: { coordenadas: true } },
  postos: [
    posto('11111111000111', 'SAO PAULO', '01310100', { lat: -23.5614, lon: -46.6559 }), // Av. Paulista
    posto('22222222000122', 'SAO PAULO', '01310200', { lat: -23.5640, lon: -46.6525 }),
    posto('33333333000133', 'SAO PAULO', '04563002', { lat: -23.6087, lon: -46.6887 }),
    posto('44444444000144', 'SAO PAULO', '01311000', null), // sem localização
    posto('55555555000155', 'CAMPINAS', '13010000', { lat: -22.9056, lon: -47.0608 }),
  ],
  fiscalizacoes: [{ id: 'f', postoId: '22222222000122', data: '2026-09-01', tipo: 'Auto de Interdição', resultado: 'Interdição total', ocorrencias: [] }],
};

test('postos ao redor: só dentro do raio, do mais perto ao mais longe, com alerta', () => {
  const r = buscarProximos(base, { origem: { lat: -23.5620, lon: -46.6550 }, raioKm: 2 });
  assert.deepEqual(r.itens.map((p) => p.id), ['11111111000111', '22222222000122']);
  assert.ok(r.itens[0].distanciaKm < r.itens[1].distanciaKm);
  assert.equal(r.itens[1].alerta.nivel, 'alerta');
  assert.equal(r.porNivel.alerta, 1);
  assert.deepEqual(r.municipio, { municipio: 'SAO PAULO', uf: 'SP', total: 4, semLocalizacao: 1 });
});

test('nenhum posto no raio informa a distância do mais próximo', () => {
  const r = buscarProximos(base, { origem: { lat: -23.0, lon: -46.9 }, raioKm: 1 });
  assert.equal(r.totalNoRaio, 0);
  assert.ok(r.maisProximoKm > 1);
});

test('CEP: usa o prefixo mais longo disponível e devolve null sem dados', () => {
  const a = localizarPorCep(base, '01310-900');
  assert.equal(a.digitos, 5);
  assert.equal(a.postosUsados, 2);
  const b = localizarPorCep(base, '04500-000');
  assert.equal(b.digitos, 3);
  assert.equal(localizarPorCep(base, '69900000'), null);
  assert.equal(localizarPorCep(base, '123'), null);
});

test('CEP sem zero inicial é corrigido na importação', () => {
  assert.equal(normalizarCep('4563002'), '04563002');
  assert.equal(normalizarCep('01310-100'), '01310100');
  assert.equal(normalizarCep('123'), null);
});

test('coordenadas externas exigem fonte e não sobrescrevem as existentes', () => {
  const b = structuredClone(base);
  assert.throws(() => aplicarCoordenadas(b, {}, { nome: 'x' }), /licen|https|obtidoEm/);
  const n = aplicarCoordenadas(b, { '44444444000144': [-23.56, -46.65, '2025-05-01'], '11111111000111': [0, 0, 'x'] }, fonte);
  assert.equal(n, 1);
  assert.equal(b.postos[3].coordenadasData, '2025-05-01');
  assert.deepEqual(b.postos[0].coordenadas, { lat: -23.5614, lon: -46.6559 });
  assert.equal(b.meta.fontes.coordenadas.nome, 'Teste');
});
