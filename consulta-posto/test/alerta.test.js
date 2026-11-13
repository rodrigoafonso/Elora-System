import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularAlerta, gravidade, referenciaDaBase } from '../server/dominio/alerta.js';

const REF = '2026-10-04';
const f = (data, tipo, resultado, ocorrencias = []) => ({ data, tipo, resultado, ocorrencias });

test('amostra reprovada nos últimos 12 meses gera Alerta', () => {
  const a = calcularAlerta([f('2026-03-01', 'Auto de Infração', 'Amostra Prova de Gasolina Reprovada - percentual de etanol')], REF);
  assert.equal(a.nivel, 'alerta');
  assert.match(a.motivo, /Reprovada/);
  assert.equal(a.data, '2026-03-01');
});

test('irregularidade de bomba e interdição geram Alerta; desinterdição não', () => {
  assert.equal(calcularAlerta([f('2026-09-01', 'Notificação', 'Bomba Medidora - Aferição Irregular')], REF).nivel, 'alerta');
  assert.equal(calcularAlerta([f('2026-09-01', 'Auto de Interdição', 'Interdição por Falta de Segurança nas Instalações')], REF).nivel, 'alerta');
  assert.equal(gravidade(f('2026-09-01', 'Termo Final de Medida Cautelar', 'Desinterdição total')), null);
});

test('resultado grave dentro de uma lista de ocorrências é encontrado', () => {
  const a = calcularAlerta([f('2026-05-01', 'Auto de Infração', '2 resultados registrados (ver lista)', [
    { descricao: 'LMC - Não apresentação' },
    { descricao: 'Comercializar/Armazenar Gasolina fora das especificações - percentual de Etanol' },
  ])], REF);
  assert.equal(a.nivel, 'alerta');
  assert.match(a.motivo, /fora das especificações/);
});

test('grave entre 12 e 24 meses ou auto de infração comum geram Atenção', () => {
  assert.equal(calcularAlerta([f('2025-02-01', 'Auto de Infração', 'Amostra Prova de Etanol Reprovada - pH')], REF).nivel, 'atencao');
  const a = calcularAlerta([f('2026-08-01', 'Auto de Infração', 'Painel de Preços - Ausência/Em desacordo com a legislação')], REF);
  assert.equal(a.nivel, 'atencao');
  assert.match(a.motivo, /Painel de Preços/);
});

test('fiscalização sem registros graves → Sem alertas; nada em 24 meses → Sem fiscalização recente', () => {
  assert.equal(calcularAlerta([f('2026-01-10', 'Boletim de Fiscalização', 'Sem Registro de Ocorrência'), f('2026-02-10', 'Notificação', 'Notificação - Prazo 30 dias')], REF).nivel, 'sem_alerta');
  assert.equal(calcularAlerta([f('2023-01-10', 'Auto de Interdição', 'Interdição total')], REF).nivel, 'sem_registro');
  assert.equal(calcularAlerta([], REF).nivel, 'sem_registro');
});

test('coleta de amostra e volume a mais para o consumidor não geram alerta', () => {
  assert.equal(gravidade(f('2026-09-01', 'Termo de Coleta de Amostra', 'Coleta de amostra de Gasolina comum')), null);
  assert.equal(gravidade(f('2026-09-01', 'Medida Reparadora de Conduta', 'MRC - PR Comb - Fornecimento de volume de combustível superior ao indicado na bomba')), null);
});

test('referência é a fiscalização mais recente da base', () => {
  assert.equal(referenciaDaBase([{ data: '2025-01-01' }, { data: '2026-10-04' }, { data: null }]), '2026-10-04');
});
