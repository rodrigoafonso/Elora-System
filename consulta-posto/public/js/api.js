// Cliente da API do próprio app. Erros viram ErroApi com mensagem pronta para a pessoa ler.

export class ErroApi extends Error {
  constructor(mensagem, status, corpo) {
    super(mensagem);
    this.status = status;
    this.corpo = corpo;
  }
}

async function requisitar(caminho, opcoes = {}) {
  // Versão estática: a "API" roda no próprio navegador sobre a base DEMO embutida.
  if (window.__API_LOCAL__) {
    const [status, corpo] = await window.__API_LOCAL__(caminho, opcoes);
    if (status >= 400) throw new ErroApi(corpo?.erro ?? 'Os dados não puderam ser carregados.', status, corpo);
    return corpo;
  }
  let resposta;
  try {
    resposta = await fetch(caminho, {
      ...opcoes,
      headers: { Accept: 'application/json', ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch {
    throw new ErroApi('Não foi possível conectar. Verifique sua internet e tente novamente.', 0, null);
  }
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new ErroApi(corpo?.erro ?? 'Os dados não puderam ser carregados.', resposta.status, corpo);
  return corpo;
}

let statusCache = null;
export function obterStatus() {
  statusCache ??= requisitar('/api/status').catch((e) => {
    statusCache = null;
    throw e;
  });
  return statusCache;
}

export const buscarPostos = (params) => requisitar(`/api/postos?${new URLSearchParams(params)}`);
export const obterPosto = (id) => requisitar(`/api/postos/${encodeURIComponent(id)}`);
export const obterRelatos = (id) => requisitar(`/api/postos/${encodeURIComponent(id)}/relatos`);
export const enviarRelato = (dados) => requisitar('/api/relatos', { method: 'POST', body: JSON.stringify(dados) });
export const removerRelato = (dados) => requisitar('/api/relatos/remocao', { method: 'POST', body: JSON.stringify(dados) });
export const solicitarRemocao = (dados) =>
  requisitar('/api/solicitacoes-remocao', { method: 'POST', body: JSON.stringify(dados) });
