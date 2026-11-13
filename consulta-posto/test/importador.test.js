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

test('datas em número serial do Excel e filtro de segmento', async () => {
  const { lerData } = await import('../server/importador/importar.js');
  assert.equal(lerData('46299'), '2026-10-04');
  assert.equal(lerData('26/07/2005'), '2005-07-26');
  const cadastro = [{ CNPJ: '11222333000181', FANTASIA: 'Posto A', MUNICIPIO: 'Recife', UF: 'PE' }];
  const fisc = [
    { CNPJ: '11222333000181', DATA: '46299', TIPO: 'Boletim', RESULTADO: 'Sem Registro de Ocorrência', DOC: '1', SEG: 'Revenda de Combustíveis' },
    { CNPJ: '11222333000181', DATA: '46299', TIPO: 'Boletim', RESULTADO: 'X', DOC: '2', SEG: 'Revenda de GLP' },
    { CNPJ: '11222333000181', DATA: '46200', TIPO: 'Notificação', RESULTADO: 'Prazo 30 dias', DOC: '3', SEG: 'Revenda de Combustíveis' },
    { CNPJ: '11222333000181', DATA: '46200', TIPO: 'Notificação', RESULTADO: 'Apresentar LMC', DOC: '3', SEG: 'Revenda de Combustíveis' },
  ];
  const { base, avisos } = importar({
    linhasCadastro: cadastro,
    linhasFiscalizacoes: fisc,
    mapeamento: { ...mapeamento, filtroFiscalizacoes: { coluna: 'SEG', valores: ['Revenda de Combustíveis'] } },
    fontes: { cadastro: fonte, fiscalizacoes: fonte },
  });
  assert.equal(base.postos[0].id, '11222333000181');
  assert.equal(base.fiscalizacoes.length, 2);
  const unico = base.fiscalizacoes.find((f) => f.documento === '1');
  assert.equal(unico.resultado, 'Sem Registro de Ocorrência');
  const varios = base.fiscalizacoes.find((f) => f.documento === '3');
  assert.deepEqual(varios.ocorrencias.map((o) => o.descricao), ['Prazo 30 dias', 'Apresentar LMC']);
  assert.ok(avisos.some((a) => a.includes('outros segmentos')));
});

test('XLSX mínimo com strings compartilhadas e número', async () => {
  const { lerXlsx } = await import('../server/importador/xlsx.js');
  const { deflateRawSync } = await import('node:zlib');
  const arquivos = {
    'xl/sharedStrings.xml': '<sst><si><t>CNPJ</t></si><si><t>DATA</t></si><si><t>11222333000181</t></si><si><r><t>A &amp; </t></r><r><t>B</t></r></si></sst>',
    'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="inlineStr"><is><t>NOME</t></is></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>46299</v></c><c r="C2" t="s"><v>3</v></c></row></sheetData></worksheet>',
  };
  // Monta um ZIP com deflate (cabeçalhos locais + diretório central)
  const locais = [];
  const centrais = [];
  let deslocamento = 0;
  for (const [nome, texto] of Object.entries(arquivos)) {
    const dados = deflateRawSync(Buffer.from(texto));
    const n = Buffer.from(nome);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(dados.length, 18);
    local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(dados.length, 20);
    central.writeUInt16LE(n.length, 28);
    central.writeUInt32LE(deslocamento, 42);
    locais.push(local, n, dados);
    centrais.push(central, n);
    deslocamento += 30 + n.length + dados.length;
  }
  const dir = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(2, 8);
  fim.writeUInt16LE(2, 10);
  fim.writeUInt32LE(dir.length, 12);
  fim.writeUInt32LE(deslocamento, 16);
  const linhas = lerXlsx(Buffer.concat([...locais, dir, fim]));
  assert.deepEqual(linhas, [{ CNPJ: '11222333000181', DATA: '46299', NOME: 'A & B' }]);
});
