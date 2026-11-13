// API que roda no navegador, usada só na versão estática (página publicada sem servidor).
// Reaproveita as mesmas regras de busca do servidor (server/dominio/busca.js) sobre a base DEMO embutida.
// Relatos não são enviados a lugar nenhum: as respostas vêm marcadas com `simulado: true`.
import { buscarPostos, detalharPosto, ORDENACOES } from '../server/dominio/busca.js';
import { coordenadaValida, dataIsoValida } from '../server/dominio/texto.js';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

// Formato compacto dos arquivos publicados (ver scripts/gerar-pagina-estatica.js):
// postos.json -> { meta, campos: [...], postos: [[...valores na ordem de campos]] }
// fisc-UF.json -> { [cnpj]: [[data, tipo, resultado, documento, [descrições...]]] }
function desempacotarPostos(arquivo) {
  const i = Object.fromEntries(arquivo.campos.map((c, n) => [c, n]));
  return {
    meta: arquivo.meta,
    fiscalizacoes: [],
    postos: arquivo.postos.map((v) => ({
      id: v[i.cnpj],
      cnpj: v[i.cnpj],
      razaoSocial: v[i.razaoSocial],
      nomeFantasia: null,
      endereco: { logradouro: v[i.logradouro], numero: null, complemento: v[i.complemento], bairro: v[i.bairro], cep: v[i.cep], municipio: v[i.municipio], uf: v[i.uf] },
      coordenadas: null,
      bandeira: v[i.bandeira],
      bandeiraDesde: v[i.bandeiraDesde],
      situacaoCadastral: null,
      combustiveis: null,
      autorizacao: { numero: v[i.autorizacaoNumero], data: v[i.autorizacaoData] },
      resumoFiscalizacoes: { total: v[i.totalFisc], ultima: v[i.ultimaFisc] },
    })),
  };
}

export function instalarApiLocal({ base: baseEmbutida, status, dados }) {
  const relatos = [];
  const erro = (s, msg, extra = {}) => [s, { erro: msg, ...extra }];
  const indisponivel = () =>
    erro(503, 'Os dados não puderam ser carregados no momento. Consulte a ferramenta oficial da ANP.', { linksOficiais: status.linksOficiais });

  let promessaBase = baseEmbutida ? Promise.resolve(baseEmbutida) : null;
  const obterBase = () =>
    (promessaBase ??= fetch(dados.postos)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(desempacotarPostos)
      .catch((e) => {
        promessaBase = null;
        throw e;
      }));

  const fiscPorUf = new Map();
  async function fiscalizacoesDoPosto(base, posto) {
    if (baseEmbutida) return detalharPosto(base, posto.id).fiscalizacoes;
    const uf = posto.endereco.uf;
    if (!fiscPorUf.has(uf)) {
      fiscPorUf.set(uf, fetch(dados.fiscalizacoes.replace('{uf}', uf)).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))));
    }
    let porCnpj;
    try {
      porCnpj = await fiscPorUf.get(uf);
    } catch (e) {
      fiscPorUf.delete(uf);
      throw e;
    }
    return (porCnpj[posto.cnpj] ?? []).map(([data, tipo, resultado, documento, descricoes], n) => ({
      id: `${posto.id}-${n}`,
      postoId: posto.id,
      data,
      tipo,
      resultado,
      documento,
      ocorrencias: (descricoes ?? []).map((d) => ({ categoria: null, descricao: d })),
    }));
  }

  function criterios(p) {
    const q = String(p.get('q') ?? '').trim().slice(0, 120);
    const uf = p.get('uf')?.toUpperCase() || null;
    if (uf && !UFS.includes(uf)) return { erro: 'UF inválida.' };
    const desde = p.get('desde') || null;
    const ate = p.get('ate') || null;
    if ((desde && !dataIsoValida(desde)) || (ate && !dataIsoValida(ate))) return { erro: 'Período inválido.' };
    if (!q && !uf) return { erro: 'Digite uma cidade, nome do posto ou CNPJ.' };
    const lat = p.has('lat') ? Number(p.get('lat')) : null;
    const lon = p.has('lon') ? Number(p.get('lon')) : null;
    const origem = lat !== null && lon !== null && coordenadaValida(lat, lon) ? { lat, lon } : null;
    const ordenar = ORDENACOES.includes(p.get('ordenar')) ? p.get('ordenar') : 'relevancia';
    return {
      q, uf, desde, ate, origem,
      combustivel: p.get('combustivel') || null,
      situacao: p.get('situacao') || null,
      ordenar: ordenar === 'distancia' && !origem ? 'relevancia' : ordenar,
      pagina: Math.max(1, Number.parseInt(p.get('pagina') ?? '1', 10) || 1),
      porPagina: Math.min(100, Math.max(1, Number.parseInt(p.get('porPagina') ?? '20', 10) || 20)),
    };
  }

  window.__API_LOCAL__ = async (caminho, opcoes = {}) => {
    const url = new URL(caminho, 'https://app.local');
    const metodo = opcoes.method ?? 'GET';
    const corpo = opcoes.body ? JSON.parse(opcoes.body) : null;
    let m;
    if (metodo === 'GET' && url.pathname === '/api/status') return [200, status];
    let base;
    if (metodo === 'GET' && url.pathname.startsWith('/api/postos')) {
      try {
        base = await obterBase();
      } catch {
        return indisponivel();
      }
    }
    const resumoFonte = { tipo: status.fonte.tipo, aviso: status.fonte.aviso, fontes: status.fonte.fontes };
    if (metodo === 'GET' && url.pathname === '/api/postos') {
      const c = criterios(url.searchParams);
      if (c.erro) return erro(400, c.erro);
      return [200, { ...buscarPostos(base, c), fonte: resumoFonte }];
    }
    if (metodo === 'GET' && (m = url.pathname.match(/^\/api\/postos\/([\w-]{1,80})\/relatos$/))) {
      const doPosto = relatos.filter((r) => r.postoId === m[1]);
      return [200, { itens: [], aguardandoModeracao: doPosto.length }];
    }
    if (metodo === 'GET' && (m = url.pathname.match(/^\/api\/postos\/([\w-]{1,80})$/))) {
      const posto = base.postos.find((p) => p.id === m[1]);
      if (!posto) return erro(404, 'Posto não encontrado nesta base.');
      let fiscalizacoes;
      try {
        fiscalizacoes = await fiscalizacoesDoPosto(base, posto);
      } catch {
        return indisponivel();
      }
      return [200, { posto, fiscalizacoes, fonte: resumoFonte, linksOficiais: status.linksOficiais }];
    }
    if (metodo === 'POST' && url.pathname === '/api/relatos') {
      const protocolo = `DEMO-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
      const codigoRemocao = Math.random().toString(36).slice(2, 14);
      relatos.push({ postoId: corpo?.postoId, protocolo, codigoRemocao });
      return [201, { protocolo, codigoRemocao, status: 'em_moderacao', simulado: true }];
    }
    if (metodo === 'POST' && url.pathname === '/api/relatos/remocao') {
      const i = relatos.findIndex((r) => r.protocolo === String(corpo?.protocolo ?? '').trim().toUpperCase() && r.codigoRemocao === String(corpo?.codigo ?? '').trim());
      if (i < 0) return erro(404, 'Protocolo ou código de remoção não conferem.');
      relatos.splice(i, 1);
      return [200, { removido: true }];
    }
    if (metodo === 'POST' && url.pathname === '/api/solicitacoes-remocao') {
      const erros = {};
      if (!String(corpo?.referencia ?? '').trim()) erros.referencia = 'Informe o posto ou o relato a que se refere.';
      if (String(corpo?.motivo ?? '').trim().length < 20) erros.motivo = 'Explique o motivo com pelo menos 20 caracteres.';
      if (!/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(String(corpo?.contato ?? ''))) erros.contato = 'Informe um e-mail para receber a resposta.';
      if (corpo?.aceitePrivacidade !== true) erros.aceitePrivacidade = 'É preciso concordar com o uso do e-mail para a resposta.';
      if (Object.keys(erros).length) return erro(422, 'Confira os campos destacados.', { erros });
      return [201, { protocolo: 'S-DEMO (simulado, nada foi enviado)' }];
    }
    return erro(404, 'Rota não encontrada.');
  };
}
