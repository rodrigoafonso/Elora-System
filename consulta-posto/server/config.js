import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Links oficiais exibidos no app. Conferidos em 13/11/2026 em resultados de busca:
 * - A página do aplicativo "ANP com VC – Postos" fica no portal gov.br da ANP (lançado em 13/07/2026).
 * - O serviço de denúncia de irregularidades em postos fica no portal gov.br.
 * Revise estes links periodicamente — eles podem mudar.
 */
export const LINKS_OFICIAIS = {
  consultaPostos: {
    rotulo: 'ANP com VC – Postos (consulta oficial da ANP)',
    url: 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/aplicativos/anp-com-vc-postos',
  },
  denuncia: {
    rotulo: 'Denunciar irregularidades em postos de combustíveis (gov.br)',
    url: 'https://www.gov.br/pt-br/servicos/denunciar-irregularidades-em-postos-de-combustiveis',
  },
  dadosAbertos: {
    rotulo: 'Portal de dados abertos da ANP',
    url: 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos',
  },
};

export function lerConfig(env = process.env) {
  const fonte = env.FONTE_DADOS === 'importada' ? 'importada' : 'demo';
  return {
    porta: Number(env.PORT ?? 3000),
    host: env.HOST ?? '127.0.0.1',
    fonte,
    caminhoBase: resolve(
      env.CAMINHO_BASE ?? (fonte === 'importada' ? join(raiz, 'data/importado/base.json') : join(raiz, 'data/demo/base-demo.json')),
    ),
    dirPrivado: resolve(env.DIR_PRIVADO ?? join(raiz, 'data/privado')),
    dirPublico: join(raiz, 'public'),
    // Sem token configurado, as rotas de moderação ficam desligadas.
    tokenModeracao: env.MODERACAO_TOKEN && env.MODERACAO_TOKEN.length >= 24 ? env.MODERACAO_TOKEN : null,
    confiarProxy: env.CONFIAR_PROXY === '1',
  };
}
