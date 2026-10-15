import { casosDeUsoCasaMais } from '@/application/casamais/casosDeUso';
import type { CasaMaisRepositories } from '@/application/ports/casamais';
import { env } from '@/config/env';
import { casaMaisHttp } from '../casamais/httpRepositories';
import { criarCasaMaisMemoria } from '../casamais/memoria';

/**
 * Composição (injeção de dependências): o único lugar que escolhe as implementações das portas.
 * Trocar a fonte de dados não exige mudar telas nem casos de uso.
 */
export interface Container {
  readonly casaMais: CasaMaisRepositories;
  readonly casosCasaMais: ReturnType<typeof casosDeUsoCasaMais>;
}

export function criarContainer(fonte: 'mock' | 'api' = env.dataSource): Container {
  const casaMais = fonte === 'api' ? casaMaisHttp : criarCasaMaisMemoria();
  return { casaMais, casosCasaMais: casosDeUsoCasaMais(casaMais) };
}
