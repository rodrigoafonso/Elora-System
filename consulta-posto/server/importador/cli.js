#!/usr/bin/env node
// Uso:
//   node server/importador/cli.js \
//     --cadastro caminho/cadastro.csv [--fiscalizacoes caminho/acoes.csv] \
//     --mapeamento caminho/mapeamento.json \
//     --fonte-cadastro-nome "..." --fonte-cadastro-url https://... --fonte-cadastro-licenca "..." --fonte-cadastro-obtido-em AAAA-MM-DD \
//     [--fonte-fisc-nome ... --fonte-fisc-url ... --fonte-fisc-licenca ... --fonte-fisc-obtido-em ...] \
//     [--encoding latin1] [--saida data/importado/base.json]
//
// A importação é recusada sem origem, licença e data de obtenção de cada arquivo.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { lerCsv } from './csv.js';
import { importar } from './importar.js';
import { validarBase } from '../fontes/validarBase.js';

const { values: a } = parseArgs({
  options: {
    cadastro: { type: 'string' },
    fiscalizacoes: { type: 'string' },
    mapeamento: { type: 'string' },
    encoding: { type: 'string', default: 'utf8' },
    saida: { type: 'string', default: 'data/importado/base.json' },
    nome: { type: 'string' },
    'fonte-cadastro-nome': { type: 'string' },
    'fonte-cadastro-url': { type: 'string' },
    'fonte-cadastro-licenca': { type: 'string' },
    'fonte-cadastro-obtido-em': { type: 'string' },
    'fonte-cadastro-atualizado-em': { type: 'string' },
    'fonte-fisc-nome': { type: 'string' },
    'fonte-fisc-url': { type: 'string' },
    'fonte-fisc-licenca': { type: 'string' },
    'fonte-fisc-obtido-em': { type: 'string' },
    'fonte-fisc-atualizado-em': { type: 'string' },
  },
});

async function lerLinhas(caminho) {
  const texto = await readFile(caminho, a.encoding);
  if (extname(caminho).toLowerCase() === '.json') {
    const dados = JSON.parse(texto);
    if (!Array.isArray(dados)) throw new Error(`${caminho}: o JSON deve ser uma lista de objetos.`);
    return dados;
  }
  return lerCsv(texto);
}

const fonte = (p) => ({
  nome: a[`fonte-${p}-nome`],
  url: a[`fonte-${p}-url`],
  licenca: a[`fonte-${p}-licenca`],
  obtidoEm: a[`fonte-${p}-obtido-em`],
  ...(a[`fonte-${p}-atualizado-em`] ? { atualizadoEm: a[`fonte-${p}-atualizado-em`] } : {}),
});

try {
  if (!a.cadastro || !a.mapeamento) throw new Error('Informe --cadastro e --mapeamento.');
  const mapeamento = JSON.parse(await readFile(a.mapeamento, 'utf8'));
  const { base, avisos } = importar({
    linhasCadastro: await lerLinhas(a.cadastro),
    linhasFiscalizacoes: a.fiscalizacoes ? await lerLinhas(a.fiscalizacoes) : [],
    mapeamento,
    fontes: { cadastro: fonte('cadastro'), fiscalizacoes: fonte('fisc') },
    nome: a.nome,
  });
  const problemas = validarBase(base);
  if (problemas.length) throw new Error(`Base gerada é inválida: ${problemas.slice(0, 10).join('; ')}`);
  const destino = resolve(a.saida);
  await mkdir(dirname(destino), { recursive: true });
  await writeFile(destino, JSON.stringify(base));
  avisos.forEach((m) => console.warn(`Aviso: ${m}`));
  console.log(`Importados ${base.postos.length} postos e ${base.fiscalizacoes.length} fiscalizações -> ${destino}`);
  if (base.postos.length === 0) console.warn('Nenhum posto importado: confira o mapeamento de colunas.');
} catch (e) {
  console.error(`Erro na importação: ${e.message}`);
  process.exitCode = 1;
}
