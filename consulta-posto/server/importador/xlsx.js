// Leitor mínimo de XLSX sem dependências: lê o ZIP (diretório central + inflateRaw), as strings
// compartilhadas e a primeira planilha. Devolve linhas como objetos { cabeçalho: valor }.
// Datas ficam como número serial do Excel; o importador converte (ver paraDataIso em importar.js).
import { inflateRawSync } from 'node:zlib';

function lerZip(buf) {
  // Fim do diretório central (EOCD): assinatura 0x06054b50 nos últimos ~64 KB
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('XLSX inválido (ZIP sem diretório central).');
  const total = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entradas = new Map();
  for (let n = 0; n < total; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('XLSX inválido (entrada do ZIP).');
    const metodo = buf.readUInt16LE(p + 10);
    const tamComprimido = buf.readUInt32LE(p + 20);
    const tamNome = buf.readUInt16LE(p + 28);
    const tamExtra = buf.readUInt16LE(p + 30);
    const tamComent = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const nome = buf.subarray(p + 46, p + 46 + tamNome).toString('utf8');
    entradas.set(nome, { metodo, tamComprimido, local });
    p += 46 + tamNome + tamExtra + tamComent;
  }
  return (nome) => {
    const e = entradas.get(nome);
    if (!e) return null;
    const inicio = e.local + 30 + buf.readUInt16LE(e.local + 26) + buf.readUInt16LE(e.local + 28);
    const dados = buf.subarray(inicio, inicio + e.tamComprimido);
    if (e.metodo === 0) return dados.toString('utf8');
    if (e.metodo === 8) return inflateRawSync(dados).toString('utf8');
    throw new Error(`Compressão ZIP não suportada (${e.metodo}).`);
  };
}

const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
function decodificar(t) {
  return t.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1)));
    return ENTIDADES[e] ?? m;
  });
}

function textoDe(xml) {
  let t = '';
  for (const m of xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)) t += m[1];
  return decodificar(t);
}

function colunaParaIndice(ref) {
  let n = 0;
  for (const ch of ref.replace(/\d+/g, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function lerXlsx(buf) {
  const ler = lerZip(buf);
  const compartilhadas = [];
  const sst = ler('xl/sharedStrings.xml');
  if (sst) for (const m of sst.matchAll(/<si>([\s\S]*?)<\/si>/g)) compartilhadas.push(textoDe(m[1]));
  const planilha = ler('xl/worksheets/sheet1.xml');
  if (!planilha) throw new Error('XLSX sem a primeira planilha (xl/worksheets/sheet1.xml).');

  const linhas = [];
  for (const mLinha of planilha.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const valores = [];
    for (const mCel of mLinha[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = mCel[1];
      const conteudo = mCel[2] ?? '';
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1];
      const tipo = attrs.match(/\bt="(\w+)"/)?.[1];
      let valor = '';
      if (tipo === 'inlineStr') valor = textoDe(conteudo);
      else {
        const v = conteudo.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
        valor = tipo === 's' ? compartilhadas[Number(v)] ?? '' : decodificar(v);
      }
      valores[ref ? colunaParaIndice(ref) : valores.length] = valor;
    }
    linhas.push(valores);
  }
  const [cabecalho = [], ...dados] = linhas;
  const nomes = Array.from(cabecalho, (c) => String(c ?? '').trim());
  return dados
    .filter((cols) => cols.some((c) => c !== undefined && c !== ''))
    .map((cols) => Object.fromEntries(nomes.map((n, i) => [n, String(cols[i] ?? '').trim()])));
}
