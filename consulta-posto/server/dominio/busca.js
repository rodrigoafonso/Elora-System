// Regras de busca, filtro e ordenação sobre uma base normalizada (ver docs/MODELO-DE-DADOS.md).
import { apenasDigitos, distanciaKm, normalizar, pareceCnpj } from './texto.js';

export const ORDENACOES = ['relevancia', 'nome', 'distancia'];

/**
 * Quais filtros a base suporta com dados confiáveis.
 * Um filtro só é oferecido se a fonte declarar o campo e houver valores preenchidos.
 */
export function filtrosDisponiveis(base) {
  const postos = base.postos ?? [];
  const campos = base.meta?.camposConfiaveis ?? {};
  const combustiveis = new Set();
  const situacoes = new Set();
  for (const p of postos) {
    for (const c of p.combustiveis ?? []) combustiveis.add(c);
    if (p.situacaoCadastral) situacoes.add(p.situacaoCadastral);
  }
  const datas = (base.fiscalizacoes ?? []).map((f) => f.data).filter(Boolean).sort();
  return {
    coordenadas: postos.some((p) => p.coordenadas),
    combustivel: campos.combustiveis && combustiveis.size > 0 ? [...combustiveis].sort() : null,
    situacaoCadastral: campos.situacaoCadastral && situacoes.size > 0 ? [...situacoes].sort() : null,
    periodoFiscalizacao: campos.fiscalizacoes && datas.length > 0 ? { min: datas[0], max: datas.at(-1) } : null,
  };
}

// Caches por objeto: a base pode ter dezenas de milhares de postos.
const cacheTexto = new WeakMap();
const cacheGrupos = new WeakMap();

function textoPesquisavel(p) {
  if (cacheTexto.has(p)) return cacheTexto.get(p);
  const t = normalizar(
    [p.nomeFantasia, p.razaoSocial, p.endereco?.logradouro, p.endereco?.bairro, p.endereco?.municipio, p.endereco?.uf].join(' '),
  );
  cacheTexto.set(p, t);
  return t;
}

function pontuacao(p, termoNorm) {
  if (!termoNorm) return 0;
  const municipio = normalizar(p.endereco?.municipio);
  const nome = normalizar(`${p.nomeFantasia ?? ''} ${p.razaoSocial ?? ''}`);
  if (municipio === termoNorm) return 3;
  if (nome.includes(termoNorm)) return 2;
  return 1;
}

/**
 * @param {object} base base normalizada
 * @param {object} c critérios validados: { q, uf, combustivel, situacao, desde, ate, origem, ordenar, pagina, porPagina }
 */
export function buscarPostos(base, c) {
  const filtros = filtrosDisponiveis(base);
  const termo = String(c.q ?? '').trim();
  const termoNorm = normalizar(termo);
  const palavras = termoNorm.split(' ').filter(Boolean);
  const porCnpj = pareceCnpj(termo);
  const digitos = apenasDigitos(termo);

  const lista = base.fiscalizacoes ?? [];
  if (!cacheGrupos.has(lista)) cacheGrupos.set(lista, agruparFiscalizacoes(lista));
  const fiscPorPosto = cacheGrupos.get(lista);
  const itens = (base.postos ?? []).filter((p) => {
    if (porCnpj) {
      if (!apenasDigitos(p.cnpj).startsWith(digitos)) return false;
    } else if (palavras.length) {
      const alvo = textoPesquisavel(p);
      if (!palavras.every((w) => alvo.includes(w))) return false;
    }
    if (c.uf && p.endereco?.uf !== c.uf) return false;
    if (c.combustivel && filtros.combustivel && !(p.combustiveis ?? []).includes(c.combustivel)) return false;
    if (c.situacao && filtros.situacaoCadastral && p.situacaoCadastral !== c.situacao) return false;
    if ((c.desde || c.ate) && filtros.periodoFiscalizacao) {
      const noPeriodo = (fiscPorPosto.get(p.id) ?? []).some(
        (f) => (!c.desde || f.data >= c.desde) && (!c.ate || f.data <= c.ate),
      );
      if (!noPeriodo) return false;
    }
    return true;
  });

  let resultado = itens.map((p) => {
    const item = resumoPosto(p, fiscPorPosto.get(p.id) ?? []);
    if (c.origem && p.coordenadas) item.distanciaKm = Math.round(distanciaKm(c.origem, p.coordenadas) * 10) / 10;
    item._score = pontuacao(p, termoNorm);
    return item;
  });

  const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR');
  if (c.ordenar === 'distancia' && c.origem) {
    // Postos sem coordenadas vão para o fim, nunca somem da lista.
    resultado.sort((a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity) || porNome(a, b));
  } else if (c.ordenar === 'nome') {
    resultado.sort(porNome);
  } else {
    resultado.sort((a, b) => b._score - a._score || porNome(a, b));
  }

  const total = resultado.length;
  const porPagina = c.porPagina ?? 20;
  const pagina = Math.max(1, c.pagina ?? 1);
  resultado = resultado.slice((pagina - 1) * porPagina, pagina * porPagina).map(({ _score, ...r }) => r);
  return { total, pagina, porPagina, itens: resultado, buscaPorCnpj: porCnpj };
}

export function agruparFiscalizacoes(fiscalizacoes) {
  const mapa = new Map();
  for (const f of fiscalizacoes) {
    if (!mapa.has(f.postoId)) mapa.set(f.postoId, []);
    mapa.get(f.postoId).push(f);
  }
  for (const lista of mapa.values()) lista.sort((a, b) => String(b.data).localeCompare(String(a.data)));
  return mapa;
}

function resumoPosto(p, fisc) {
  return {
    id: p.id,
    nome: p.nomeFantasia || p.razaoSocial || 'Posto sem nome informado',
    razaoSocial: p.razaoSocial ?? null,
    cnpj: p.cnpj ?? null,
    endereco: p.endereco ?? null,
    coordenadas: p.coordenadas ?? null,
    bandeira: p.bandeira ?? null,
    // Só a contagem e a data — sem nota, cor ou rótulo de "bom/ruim".
    // Versão estática: o resumo vem pré-calculado porque o histórico é carregado só no detalhe.
    fiscalizacoesRegistradas: p.resumoFiscalizacoes?.total ?? fisc.length,
    ultimaFiscalizacao: p.resumoFiscalizacoes?.ultima ?? fisc[0]?.data ?? null,
  };
}

export function detalharPosto(base, id) {
  const p = (base.postos ?? []).find((x) => x.id === id);
  if (!p) return null;
  const fisc = (base.fiscalizacoes ?? [])
    .filter((f) => f.postoId === id)
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));
  return { posto: p, fiscalizacoes: fisc };
}
