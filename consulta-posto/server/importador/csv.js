// Leitor de CSV sem dependências: aspas, aspas escapadas (""), quebras de linha dentro de campos,
// separador ';' ou ',' (detectado pela primeira linha) e BOM UTF-8.

export function detectarSeparador(texto) {
  const primeira = texto.slice(0, texto.indexOf('\n') === -1 ? undefined : texto.indexOf('\n'));
  const contar = (ch) => primeira.split(ch).length - 1;
  return contar(';') >= contar(',') ? ';' : ',';
}

export function lerCsv(texto, separador) {
  const t = texto.replace(/^﻿/, '');
  const sep = separador ?? detectarSeparador(t);
  const linhas = [];
  let campo = '';
  let linha = [];
  let entreAspas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (entreAspas) {
      if (ch === '"') {
        if (t[i + 1] === '"') {
          campo += '"';
          i++;
        } else entreAspas = false;
      } else campo += ch;
    } else if (ch === '"' && campo === '') entreAspas = true;
    else if (ch === sep) {
      linha.push(campo);
      campo = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo);
      campo = '';
      if (linha.some((c) => c !== '')) linhas.push(linha);
      linha = [];
    } else campo += ch;
  }
  linha.push(campo);
  if (linha.some((c) => c !== '')) linhas.push(linha);

  const [cabecalho = [], ...dados] = linhas;
  const nomes = cabecalho.map((c) => c.trim());
  return dados.map((cols) => Object.fromEntries(nomes.map((n, i) => [n, (cols[i] ?? '').trim()])));
}
