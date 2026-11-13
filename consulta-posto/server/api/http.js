// Utilitários HTTP: respostas JSON, leitura de corpo com limite, cabeçalhos de segurança e limite de envio.

export class ErroHttp extends Error {
  constructor(status, mensagem, extra = {}) {
    super(mensagem);
    this.status = status;
    this.extra = extra;
  }
}

export const CABECALHOS_SEGURANCA = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: blob: https://tile.openstreetmap.org",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

export function enviarJson(res, status, corpo, extras = {}) {
  const texto = JSON.stringify(corpo);
  res.writeHead(status, {
    ...CABECALHOS_SEGURANCA,
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extras,
  });
  res.end(texto);
}

export async function lerJson(req, limiteBytes) {
  const tipo = req.headers['content-type'] ?? '';
  if (!tipo.startsWith('application/json')) throw new ErroHttp(415, 'Envie os dados como JSON.');
  const declarado = Number(req.headers['content-length'] ?? 0);
  if (declarado > limiteBytes) throw new ErroHttp(413, 'Envio maior que o permitido.');
  const partes = [];
  let total = 0;
  for await (const parte of req) {
    total += parte.length;
    if (total > limiteBytes) throw new ErroHttp(413, 'Envio maior que o permitido.');
    partes.push(parte);
  }
  try {
    return JSON.parse(Buffer.concat(partes).toString('utf8'));
  } catch {
    throw new ErroHttp(400, 'JSON inválido.');
  }
}

/** Limite simples em memória por IP. O IP não é gravado em disco. */
export class LimitadorDeEnvios {
  constructor({ maximo, janelaMs }) {
    this.maximo = maximo;
    this.janelaMs = janelaMs;
    this.registros = new Map();
  }

  permitir(chave, agora = Date.now()) {
    const lista = (this.registros.get(chave) ?? []).filter((t) => agora - t < this.janelaMs);
    if (lista.length >= this.maximo) {
      this.registros.set(chave, lista);
      return false;
    }
    lista.push(agora);
    this.registros.set(chave, lista);
    if (this.registros.size > 10_000) this.registros.clear();
    return true;
  }
}
