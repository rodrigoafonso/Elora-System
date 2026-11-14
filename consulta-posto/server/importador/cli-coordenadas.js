#!/usr/bin/env node
// Acumula coordenadas de postos a partir de CSVs do PMQC num JSON { cnpj: [lat, lon, dataColeta] }.
// Uso: node server/importador/cli-coordenadas.js --saida data/importado/coordenadas-pmqc.json arquivo1.csv [arquivo2.csv …]
// Se o arquivo de saída já existir, ele é atualizado (fica a coleta mais recente de cada CNPJ).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { parseArgs } from 'node:util';
import { extrairCoordenadas } from './coordenadasPmqc.js';

const { values: a, positionals: arquivos } = parseArgs({
  allowPositionals: true,
  options: { saida: { type: 'string', default: 'data/importado/coordenadas-pmqc.json' } },
});

const acumulado = new Map();
try {
  const existente = JSON.parse(await readFile(a.saida, 'utf8'));
  for (const [cnpj, [lat, lon, data]] of Object.entries(existente)) acumulado.set(cnpj, { lat, lon, data });
} catch (e) {
  if (e.code !== 'ENOENT') throw e;
}
const antes = acumulado.size;
await extrairCoordenadas(arquivos, acumulado);
await mkdir(dirname(a.saida), { recursive: true });
await writeFile(a.saida, JSON.stringify(Object.fromEntries([...acumulado].map(([c, v]) => [c, [v.lat, v.lon, v.data]]))));
console.log(`Coordenadas: ${acumulado.size} CNPJs (${acumulado.size - antes} novos) -> ${a.saida}`);
