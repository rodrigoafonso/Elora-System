import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCsv } from '../server/importador/csv.js';
import { importar } from '../server/importador/importar.js';
import { validarBase } from '../server/fontes/validarBase.js';

const fonte = { nome: 'Arquivo de teste', url: 'https://exemplo.gov.br/arquivo.csv', licenca: 'ODbL', obtidoEm: '2026-11-01' };
const mapeamento = {
  cadastro: { cnpj: ['CNPJ'], nomeFantasia: ['FANTASIA'], municipio: ['MUNICIPIO'], uf: ['UF'], latitude: ['LAT'], longitude: ['LON'], combustiveis: ['PRODUTOS'] },
  fiscalizacoes: { cnpj: ['CNPJ'], data: ['DATA'], tipo: ['TIPO'], resultado: ['RESULTADO'], documento: ['DOC'], ocorrenciaDescricao: ['INFRACAO'] },
};

test('CSV com ponto e vírgula, aspas, BOM e quebra de linha dentro do campo', () => {
  const linhas = lerCsv('﻿CNPJ;FANTASIA\r\n11222333000181;"Posto ""Bom""; Ltda"\r\n22333444000100;"Linha\nquebrada"\r\n');
  assert.equal(linhas.length, 2);
  assert.equal(linhas[0].FANTASIA, 'Posto "Bom"; Ltda');
  assert.equal(linhas[1].FANTASIA, 'Linha\nquebrada');
});

test('importa cadastro e agrupa infrações da mesma ação', () => {
  const cadastro = lerCsv('CNPJ;FANTASIA;MUNICIPIO;UF;LAT;LON;PRODUTOS\n11.222.333/0001-81;Posto A;Recife;pe;-8,05;-34,88;GNV, Etanol\nsem cnpj;Posto B;Recife;PE;;;\n');
  const fisc = lerCsv('CNPJ;DATA;TIPO;RESULTADO;DOC;INFRACAO\n11222333000181;10/02/2024;Rotina;Autuado;AI-1;Infração 1\n11222333000181;10/02/2024;Rotina;Autuado;AI-1;Infração 2\n99999999000199;01/01/2024;Rotina;OK;;\n');
  const { base, avisos } = importar({ linhasCadastro: cadastro, linhasFiscalizacoes: fisc, mapeamento, fontes: { cadastro: fonte, fiscalizacoes: fonte } });
  assert.equal(base.meta.tipo, 'oficial');
  assert.equal(base.postos.length, 1);
  const [p] = base.postos;
  assert.equal(p.endereco.uf, 'PE');
  assert.deepEqual(p.coordenadas, { lat: -8.05, lon: -34.88 });
  assert.deepEqual(p.combustiveis, ['GNV', 'Etanol']);
  assert.equal(base.fiscalizacoes.length, 1);
  assert.equal(base.fiscalizacoes[0].data, '2024-02-10');
  assert.equal(base.fiscalizacoes[0].ocorrencias.length, 2);
  assert.equal(base.meta.camposConfiaveis.situacaoCadastral, false);
  assert.ok(avisos.some((a) => a.includes('ignoradas')));
  assert.ok(avisos.some((a) => a.includes('sem posto correspondente')));
  assert.deepEqual(validarBase(base), []);
});

test('importação é recusada sem origem, licença e data', () => {
  assert.throws(
    () => importar({ linhasCadastro: [], mapeamento, fontes: { cadastro: { nome: 'x', url: 'http://inseguro' } } }),
    /licen|obtidoEm|https/,
  );
});
