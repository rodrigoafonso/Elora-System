// Extrai coordenadas de postos dos arquivos do PMQC (Programa de Monitoramento da Qualidade dos
// Combustíveis, ANP). Segundo os metadados oficiais, as colunas Latitude/Longitude são a posição
// do posto (SIRGAS 2000, EPSG:4674 — compatível com WGS84 para exibir em mapa).
// Lê CSVs grandes linha a linha e guarda a coordenada da coleta mais recente de cada CNPJ.
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { apenasDigitos } from '../dominio/texto.js';
import { lerCsv } from './csv.js';

// Limites aproximados do território brasileiro, para descartar coordenadas trocadas ou zeradas.
export function dentroDoBrasil(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && lat > -34.5 && lat < 5.9 && lon > -74.5 && lon < -28.5;
}

function separar(linha, cabecalho) {
  if (!linha.includes('"')) return linha.split(';');
  const [obj] = lerCsv(`${cabecalho}\n${linha}`, ';');
  return Object.values(obj ?? {});
}

/**
 * @param {string[]} arquivos caminhos de CSVs do PMQC
 * @param {Map<string, {lat:number, lon:number, data:string}>} acumulado
 */
export async function extrairCoordenadas(arquivos, acumulado = new Map()) {
  let descartadas = 0;
  for (const arquivo of arquivos) {
    const leitor = createInterface({ input: createReadStream(arquivo, 'utf8'), crlfDelay: Infinity });
    let cab = null;
    let iData, iCnpj, iLat, iLon, cabecalho;
    for await (const bruta of leitor) {
      const linha = bruta.replace(/^﻿/, '');
      if (!cab) {
        cabecalho = linha;
        cab = linha.split(';').map((c) => c.trim());
        [iData, iCnpj, iLat, iLon] = ['DataColeta', 'CnpjPosto', 'Latitude', 'Longitude'].map((n) => cab.indexOf(n));
        if ([iData, iCnpj, iLat, iLon].some((i) => i < 0)) throw new Error(`${arquivo}: colunas do PMQC não encontradas.`);
        continue;
      }
      if (!linha) continue;
      const c = separar(linha, cabecalho);
      const cnpj = apenasDigitos(c[iCnpj]);
      if (cnpj.length !== 14) continue;
      const data = String(c[iData] ?? '').slice(0, 10);
      const atual = acumulado.get(cnpj);
      if (atual && atual.data >= data) continue;
      const lat = Number(String(c[iLat] ?? '').replace(',', '.'));
      const lon = Number(String(c[iLon] ?? '').replace(',', '.'));
      if (!c[iLat] || !c[iLon] || !dentroDoBrasil(lat, lon)) {
        descartadas++;
        continue;
      }
      acumulado.set(cnpj, { lat: Math.round(lat * 1e6) / 1e6, lon: Math.round(lon * 1e6) / 1e6, data });
    }
  }
  return { coordenadas: acumulado, descartadas };
}
