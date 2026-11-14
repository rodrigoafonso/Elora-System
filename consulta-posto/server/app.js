// Monta o servidor (API + arquivos estáticos). Recebe as dependências para facilitar testes e a troca da fonte.
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import { LINKS_OFICIAIS } from './config.js';
import { CABECALHOS_SEGURANCA, enviarJson, ErroHttp, lerJson, LimitadorDeEnvios } from './api/http.js';
import { FonteIndisponivelError } from './fontes/fonteArquivo.js';
import { ORDENACOES, RAIOS_KM } from './dominio/busca.js';
import { dataIsoValida, coordenadaValida } from './dominio/texto.js';
import { RETENCAO } from './relatos/repositorio.js';
import { NIVEIS } from './dominio/alerta.js';
import { sanearTexto, TIPOS_PROBLEMA, validarNovoRelato, LIMITES } from './relatos/validacao.js';

const UFS = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
const TIPOS_ARQUIVO = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

/** Lê e valida os parâmetros de busca. Parâmetros inválidos são ignorados ou geram 400. */
export function lerCriterios(params) {
  const q = sanearTexto(params.get('q'), 120);
  const uf = params.get('uf')?.toUpperCase() || null;
  if (uf && !UFS.includes(uf)) throw new ErroHttp(400, 'UF inválida.');
  const desde = params.get('desde') || null;
  const ate = params.get('ate') || null;
  if ((desde && !dataIsoValida(desde)) || (ate && !dataIsoValida(ate))) throw new ErroHttp(400, 'Período inválido.');
  const lat = params.has('lat') ? Number(params.get('lat')) : null;
  const lon = params.has('lon') ? Number(params.get('lon')) : null;
  const origem = lat !== null && lon !== null && coordenadaValida(lat, lon) ? { lat, lon } : null;
  const ordenar = ORDENACOES.includes(params.get('ordenar')) ? params.get('ordenar') : 'relevancia';
  const pagina = Math.min(1000, Math.max(1, Number.parseInt(params.get('pagina') ?? '1', 10) || 1));
  const porPagina = Math.min(100, Math.max(1, Number.parseInt(params.get('porPagina') ?? '20', 10) || 20));
  if (!q && !uf) throw new ErroHttp(400, 'Digite uma cidade, nome do posto ou CNPJ.');
  return {
    q,
    uf,
    combustivel: sanearTexto(params.get('combustivel'), 60) || null,
    situacao: sanearTexto(params.get('situacao'), 60) || null,
    desde,
    ate,
    origem,
    ordenar: ordenar === 'distancia' && !origem ? 'relevancia' : ordenar,
    pagina,
    porPagina,
  };
}

function fonteResumo(fonte) {
  const info = fonte.info();
  return info.disponivel ? { tipo: info.meta.tipo, aviso: info.meta.aviso, fontes: info.meta.fontes } : null;
}

export function criarApp({ fonte, relatos, config }) {
  const limiteRelatos = new LimitadorDeEnvios({ maximo: 5, janelaMs: 10 * 60 * 1000 });
  const limiteRemocao = new LimitadorDeEnvios({ maximo: 10, janelaMs: 10 * 60 * 1000 });

  const ipDe = (req) =>
    (config.confiarProxy && String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim()) || req.socket.remoteAddress;

  function exigirModerador(req) {
    const token = config.tokenModeracao;
    if (!token) throw new ErroHttp(404, 'Não encontrado.');
    const enviado = String(req.headers.authorization ?? '').replace(/^Bearer /, '');
    const a = Buffer.from(enviado);
    const b = Buffer.from(token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new ErroHttp(401, 'Não autorizado.');
  }

  const rotas = [
    ['GET', /^\/api\/status$/, async () => {
      const info = fonte.info();
      return {
        disponivel: info.disponivel,
        erro: info.disponivel ? null : 'Os dados não puderam ser carregados no momento.',
        fonte: info.disponivel
          ? { tipo: info.meta.tipo, nome: info.meta.nome, aviso: info.meta.aviso, fontes: info.meta.fontes, totalPostos: info.totalPostos }
          : null,
        filtros: info.filtros,
        ufs: UFS,
        raiosKm: RAIOS_KM,
        linksOficiais: LINKS_OFICIAIS,
        relatos: { tiposProblema: TIPOS_PROBLEMA, limites: LIMITES, retencaoDias: RETENCAO },
        alerta: info.disponivel ? { niveis: NIVEIS, referencia: info.referenciaAlerta } : null,
        numeros: info.disponivel ? info.numeros : null,
      };
    }],

    ['GET', /^\/api\/postos$/, async (req, url) => {
      const resultado = await fonte.buscar(lerCriterios(url.searchParams));
      return { ...resultado, fonte: fonteResumo(fonte) };
    }],

    ['GET', /^\/api\/proximos$/, async (_req, url) => {
      const p = url.searchParams;
      const raioKm = RAIOS_KM.includes(Number(p.get('raio'))) ? Number(p.get('raio')) : 5;
      let origem = null;
      let porCep = null;
      if (p.has('cep')) {
        porCep = await fonte.localizarCep(p.get('cep'));
        if (!porCep) throw new ErroHttp(404, 'Não foi possível localizar esse CEP: os dados oficiais não trazem a localização de postos dessa região, ou o CEP está incompleto. Confira os 8 números ou use a busca por cidade.');
        origem = { lat: porCep.lat, lon: porCep.lon };
      } else {
        const lat = Number(p.get('lat'));
        const lon = Number(p.get('lon'));
        if (!coordenadaValida(lat, lon)) throw new ErroHttp(400, 'Localização inválida.');
        origem = { lat, lon };
      }
      const resultado = await fonte.proximos({ origem, raioKm, limite: 60 });
      return { ...resultado, origem, porCep, fonte: fonteResumo(fonte) };
    }],

    ['GET', /^\/api\/postos\/([\w-]{1,80})$/, async (_req, _url, [id]) => {
      const detalhe = await fonte.obterPosto(id);
      if (!detalhe) throw new ErroHttp(404, 'Posto não encontrado nesta base.');
      return { ...detalhe, fonte: fonteResumo(fonte), linksOficiais: LINKS_OFICIAIS };
    }],

    ['GET', /^\/api\/postos\/([\w-]{1,80})\/relatos$/, async (_req, _url, [id]) => relatos.listarPublicos(id)],

    ['POST', /^\/api\/relatos$/, async (req) => {
      if (!limiteRelatos.permitir(ipDe(req))) throw new ErroHttp(429, 'Muitos envios em pouco tempo. Tente novamente mais tarde.');
      const corpo = await lerJson(req, 9 * 1024 * 1024);
      const { erros, relato } = validarNovoRelato(corpo, { postoExiste: (id) => fonte.postoExiste(id) });
      if (!relato) throw new ErroHttp(422, 'Confira os campos destacados.', { erros });
      const { protocolo, codigoRemocao } = await relatos.criar(relato);
      return [201, { protocolo, codigoRemocao, status: 'em_moderacao' }];
    }],

    ['POST', /^\/api\/relatos\/remocao$/, async (req) => {
      if (!limiteRemocao.permitir(ipDe(req))) throw new ErroHttp(429, 'Muitas tentativas. Tente mais tarde.');
      const corpo = await lerJson(req, 4096);
      const ok = await relatos.removerPeloAutor(corpo?.protocolo, corpo?.codigo);
      if (!ok) throw new ErroHttp(404, 'Protocolo ou código de remoção não conferem.');
      return { removido: true };
    }],

    ['POST', /^\/api\/solicitacoes-remocao$/, async (req) => {
      if (!limiteRemocao.permitir(ipDe(req))) throw new ErroHttp(429, 'Muitas tentativas. Tente mais tarde.');
      const corpo = await lerJson(req, 16 * 1024);
      const referencia = sanearTexto(corpo?.referencia, 200);
      const motivo = sanearTexto(corpo?.motivo, 2000);
      const contato = sanearTexto(corpo?.contato, 254);
      const erros = {};
      if (!referencia) erros.referencia = 'Informe o posto ou o relato a que se refere.';
      if (motivo.length < 20) erros.motivo = 'Explique o motivo com pelo menos 20 caracteres.';
      if (!/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(contato)) erros.contato = 'Informe um e-mail para receber a resposta.';
      if (corpo?.aceitePrivacidade !== true) erros.aceitePrivacidade = 'É preciso concordar com o uso do e-mail para a resposta.';
      if (Object.keys(erros).length) throw new ErroHttp(422, 'Confira os campos destacados.', { erros });
      return [201, await relatos.registrarSolicitacaoRemocao({ referencia, motivo, contato })];
    }],

    // --- Moderação (requer MODERACAO_TOKEN) ----------------------------------------------------
    ['GET', /^\/api\/moderacao\/pendentes$/, async (req) => {
      exigirModerador(req);
      return relatos.listarParaModeracao();
    }],
    ['POST', /^\/api\/moderacao\/relatos\/([\w-]{36})$/, async (req, _url, [id]) => {
      exigirModerador(req);
      const corpo = await lerJson(req, 4096);
      if (corpo?.acao === 'remover') {
        if (!(await relatos.removerPorModeracao(id))) throw new ErroHttp(404, 'Relato não encontrado.');
        return { removido: true };
      }
      if (!['publicar', 'rejeitar'].includes(corpo?.acao)) throw new ErroHttp(400, 'Ação deve ser publicar, rejeitar ou remover.');
      const r = await relatos.decidir(id, corpo.acao);
      if (!r) throw new ErroHttp(404, 'Relato não encontrado ou já decidido.');
      return r;
    }],
    ['POST', /^\/api\/moderacao\/solicitacoes\/(S-[0-9A-F]{8})\/fechar$/, async (req, _url, [protocolo]) => {
      exigirModerador(req);
      if (!(await relatos.fecharSolicitacao(protocolo))) throw new ErroHttp(404, 'Solicitação não encontrada.');
      return { fechada: true };
    }],
    ['GET', /^\/api\/moderacao\/relatos\/([\w-]{36})\/anexos\/([\w.-]{1,80})$/, async (req, _url, [id, nome], res) => {
      exigirModerador(req);
      const anexo = relatos.caminhoAnexo(id, nome);
      if (!anexo) throw new ErroHttp(404, 'Anexo não encontrado.');
      res.writeHead(200, { ...CABECALHOS_SEGURANCA, 'Content-Type': anexo.tipo, 'Cache-Control': 'no-store' });
      createReadStream(anexo.caminho).pipe(res);
      return undefined;
    }],
  ];

  async function servirEstatico(req, res, caminhoUrl) {
    const relativo = normalize(decodeURIComponent(caminhoUrl)).replace(/^([/\\])+/, '');
    let arquivo = join(config.dirPublico, relativo);
    if (!arquivo.startsWith(config.dirPublico + sep) && arquivo !== config.dirPublico) throw new ErroHttp(404, 'Não encontrado.');
    let info = await stat(arquivo).catch(() => null);
    if (!info || info.isDirectory()) {
      // Rotas do app (SPA): qualquer caminho sem extensão devolve o index.html.
      if (extname(relativo)) throw new ErroHttp(404, 'Não encontrado.');
      arquivo = join(config.dirPublico, 'index.html');
      info = await stat(arquivo);
    }
    res.writeHead(200, {
      ...CABECALHOS_SEGURANCA,
      'Content-Type': TIPOS_ARQUIVO[extname(arquivo)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': arquivo.includes(`${sep}vendor${sep}`) ? 'public, max-age=86400' : 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(arquivo).pipe(res);
  }

  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    try {
      if (url.pathname.startsWith('/api/')) {
        for (const [metodo, padrao, tratar] of rotas) {
          const m = url.pathname.match(padrao);
          if (!m) continue;
          if (req.method !== metodo) continue;
          const resposta = await tratar(req, url, m.slice(1), res);
          if (resposta === undefined) return;
          const [status, corpo] = Array.isArray(resposta) ? resposta : [200, resposta];
          return enviarJson(res, status, corpo);
        }
        throw new ErroHttp(404, 'Rota não encontrada.');
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new ErroHttp(405, 'Método não permitido.');
      await servirEstatico(req, res, url.pathname);
    } catch (e) {
      if (e instanceof FonteIndisponivelError) {
        return enviarJson(res, 503, {
          erro: 'Os dados não puderam ser carregados no momento. Consulte a ferramenta oficial da ANP.',
          linksOficiais: LINKS_OFICIAIS,
        });
      }
      if (e instanceof ErroHttp) return enviarJson(res, e.status, { erro: e.message, ...e.extra });
      console.error(e);
      if (!res.headersSent) enviarJson(res, 500, { erro: 'Erro interno. Tente novamente.', linksOficiais: LINKS_OFICIAIS });
      else res.destroy();
    }
  });
}
