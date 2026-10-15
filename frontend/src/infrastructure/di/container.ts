import { casosDeUsoCasaMais } from '@/application/casamais/casosDeUso';
import { casosDeUsoLocacao } from '@/application/locacao/casosDeUso';
import type { CasaMaisRepositories } from '@/application/ports/casamais';
import type { LocacaoRepositories } from '@/application/ports/locacao';
import { env } from '@/config/env';
import { casaMaisHttp } from '../casamais/httpRepositories';
import { criarCasaMaisMemoria } from '../casamais/memoria';
import { locacaoHttp } from '../locacao/httpRepositories';
import { criarLocacaoMemoria } from '../locacao/memoria';

/**
 * Composição (injeção de dependências): o único lugar que escolhe as implementações das portas.
 * Trocar a fonte de dados não exige mudar telas nem casos de uso.
 */
export interface Container {
  readonly casaMais: CasaMaisRepositories;
  readonly casosCasaMais: ReturnType<typeof casosDeUsoCasaMais>;
  readonly locacao: LocacaoRepositories;
  readonly casosLocacao: ReturnType<typeof casosDeUsoLocacao>;
}

export function montarContainer(casaMais: CasaMaisRepositories, locacao: LocacaoRepositories): Container {
  return { casaMais, casosCasaMais: casosDeUsoCasaMais(casaMais), locacao, casosLocacao: casosDeUsoLocacao(locacao) };
}

export function criarContainer(fonte: 'mock' | 'api' = env.dataSource): Container {
  return fonte === 'api'
    ? montarContainer(casaMaisHttp, locacaoHttp)
    : montarContainer(criarCasaMaisMemoria(), criarLocacaoMemoria());
}
