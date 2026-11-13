// Validação e saneamento de relatos de usuários. Funções puras.
import { dataIsoValida } from '../dominio/texto.js';

export const TIPOS_PROBLEMA = {
  qualidade: 'Suspeita sobre a qualidade do combustível',
  volume: 'Suspeita de volume abastecido menor que o pago',
  preco: 'Preço ou informação de preço',
  atendimento: 'Informação ao consumidor / nota fiscal',
  seguranca: 'Condições de segurança do posto',
  outro: 'Outro',
};

export const LIMITES = {
  descricaoMin: 20,
  descricaoMax: 2000,
  anexosMax: 3,
  anexoBytesMax: 2 * 1024 * 1024,
};

/** Remove caracteres de controle (mantém quebras de linha), normaliza e corta espaços. */
export function sanearTexto(texto, max) {
  return String(texto ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁦-⁩]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

const PADROES_PESSOAIS = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/g, // e-mail
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, // CPF
  /(?:\+?55\s?)?\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g, // telefone
  /\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b/g, // placa de veículo
];

/** Oculta e-mails, CPFs, telefones e placas antes de qualquer exibição pública. */
export function ocultarDadosPessoais(texto) {
  return PADROES_PESSOAIS.reduce((t, re) => t.replace(re, '[dado pessoal removido]'), texto);
}

function emailValido(email) {
  return /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,}$/i.test(email);
}

/** Data aproximada: AAAA-MM ou AAAA-MM-DD, não futura e no máximo 5 anos atrás. */
export function validarDataAproximada(valor, hoje = new Date()) {
  const v = String(valor ?? '').trim();
  const iso = /^\d{4}-\d{2}$/.test(v) ? `${v}-01` : v;
  if (!dataIsoValida(iso)) return null;
  const hojeIso = hoje.toISOString().slice(0, 10);
  const limite = new Date(hoje);
  limite.setUTCFullYear(limite.getUTCFullYear() - 5);
  if (iso > hojeIso || iso < limite.toISOString().slice(0, 10)) return null;
  return v;
}

/**
 * Valida o corpo de um novo relato. Devolve { erros, relato } — relato já saneado.
 * Anexos chegam como [{ nome, tipo, base64 }] e são verificados pelos bytes, não pela extensão.
 */
export function validarNovoRelato(corpo, { postoExiste, hoje } = {}) {
  const erros = {};
  const c = corpo && typeof corpo === 'object' ? corpo : {};

  const postoId = sanearTexto(c.postoId, 80);
  if (!postoId) erros.postoId = 'Selecione o posto.';
  else if (postoExiste && !postoExiste(postoId)) erros.postoId = 'Posto não encontrado na base atual.';

  const dataAproximada = validarDataAproximada(c.dataAproximada, hoje);
  if (!dataAproximada) erros.dataAproximada = 'Informe mês e ano (ou a data) dos últimos 5 anos, sem datas futuras.';

  const tipoProblema = String(c.tipoProblema ?? '');
  if (!Object.hasOwn(TIPOS_PROBLEMA, tipoProblema)) erros.tipoProblema = 'Escolha o tipo de problema.';

  const descricao = sanearTexto(c.descricao, LIMITES.descricaoMax + 1);
  if (descricao.length < LIMITES.descricaoMin) erros.descricao = `Descreva o ocorrido com pelo menos ${LIMITES.descricaoMin} caracteres.`;
  else if (descricao.length > LIMITES.descricaoMax) erros.descricao = `Use no máximo ${LIMITES.descricaoMax} caracteres.`;

  if (c.aceiteTermos !== true) erros.aceiteTermos = 'É preciso aceitar os termos de uso e a política de privacidade.';

  let contato = null;
  if (c.contato != null && String(c.contato).trim() !== '') {
    contato = sanearTexto(c.contato, 254).toLowerCase();
    if (!emailValido(contato)) erros.contato = 'Informe um e-mail válido ou deixe em branco para enviar de forma anônima.';
    else if (c.consentimentoContato !== true) erros.contato = 'Autorize o uso do e-mail ou deixe o campo em branco.';
  }

  const anexosBrutos = Array.isArray(c.anexos) ? c.anexos : [];
  const anexos = [];
  if (anexosBrutos.length > LIMITES.anexosMax) erros.anexos = `Envie no máximo ${LIMITES.anexosMax} imagens.`;
  else if (anexosBrutos.length && c.consentimentoImagens !== true) {
    erros.anexos = 'Confirme o consentimento para o envio de imagens.';
  } else {
    for (const a of anexosBrutos) {
      const resultado = validarImagem(a);
      if (resultado.erro) {
        erros.anexos = resultado.erro;
        break;
      }
      anexos.push(resultado);
    }
  }

  return {
    erros,
    relato: Object.keys(erros).length ? null : { postoId, dataAproximada, tipoProblema, descricao, contato, anexos },
  };
}

// --- Imagens -------------------------------------------------------------------------------------

function detectarTipo(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png';
  }
  return null;
}

export function validarImagem(anexo) {
  const b64 = String(anexo?.base64 ?? '');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return { erro: 'Anexo inválido.' };
  if ((b64.length * 3) / 4 > LIMITES.anexoBytesMax + 4) return { erro: 'Cada imagem deve ter no máximo 2 MB.' };
  const buf = Buffer.from(b64, 'base64');
  const tipo = detectarTipo(buf);
  if (!tipo) return { erro: 'Envie apenas imagens JPEG ou PNG.' };
  try {
    const limpo = tipo === 'image/jpeg' ? removerMetadadosJpeg(buf) : removerMetadadosPng(buf);
    return { tipo, bytes: limpo };
  } catch {
    return { erro: 'Não foi possível ler a imagem enviada.' };
  }
}

/** Remove segmentos APPn (exceto APP0/JFIF) e comentários — inclui EXIF com localização GPS. */
export function removerMetadadosJpeg(buf) {
  const partes = [buf.subarray(0, 2)];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error('JPEG malformado');
    const marcador = buf[i + 1];
    if (marcador === 0xda) {
      partes.push(buf.subarray(i)); // início dos dados da imagem: copia o restante
      return Buffer.concat(partes);
    }
    const tamanho = buf.readUInt16BE(i + 2);
    const fim = i + 2 + tamanho;
    if (fim > buf.length) throw new Error('JPEG malformado');
    const descartar = (marcador >= 0xe1 && marcador <= 0xef) || marcador === 0xfe;
    if (!descartar) partes.push(buf.subarray(i, fim));
    i = fim;
  }
  throw new Error('JPEG sem dados de imagem');
}

const CHUNKS_PNG_PERMITIDOS = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'sBIT', 'pHYs']);

/** Mantém apenas os blocos PNG necessários para exibir a imagem (descarta textos, eXIf, datas). */
export function removerMetadadosPng(buf) {
  const partes = [buf.subarray(0, 8)];
  let i = 8;
  while (i < buf.length) {
    const tamanho = buf.readUInt32BE(i);
    const tipo = buf.subarray(i + 4, i + 8).toString('latin1');
    const fim = i + 12 + tamanho;
    if (fim > buf.length) throw new Error('PNG malformado');
    if (CHUNKS_PNG_PERMITIDOS.has(tipo)) partes.push(buf.subarray(i, fim));
    i = fim;
    if (tipo === 'IEND') return Buffer.concat(partes);
  }
  throw new Error('PNG sem IEND');
}
