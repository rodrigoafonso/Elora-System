// API que roda no navegador, usada só na versão estática (página publicada sem servidor).
// Reaproveita as mesmas regras de busca do servidor (server/dominio/busca.js) sobre a base DEMO embutida.
// Relatos não são enviados a lugar nenhum: as respostas vêm marcadas com `simulado: true`.
import { buscarPostos, detalharPosto, ORDENACOES } from '../server/dominio/busca.js';
import { coordenadaValida, dataIsoValida } from '../server/dominio/texto.js';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');

export function instalarApiLocal({ base, status }) {
  const relatos = [];
  const resumoFonte = { tipo: base.meta.tipo, aviso: base.meta.aviso, fontes: base.meta.fontes };
  const erro = (s, msg, extra = {}) => [s, { erro: msg, ...extra }];

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
      const d = detalharPosto(base, m[1]);
      if (!d) return erro(404, 'Posto não encontrado nesta base.');
      return [200, { ...d, fonte: resumoFonte, linksOficiais: status.linksOficiais }];
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
