/**
 * Trilha de andamento (pontos ligados por linhas) usada em toda solicitação.
 * ok = feito · meio = passo atual · bad = travou · '' = falta.
 */
export type EstadoPasso = 'ok' | 'meio' | 'bad' | '';

export interface Passo {
  readonly titulo: string;
  readonly detalhe: string;
  readonly estado: EstadoPasso;
}

/** Passos em sequência: os anteriores ao atual ficam feitos; "atual" além do fim marca tudo como feito. */
export const passosEmSequencia = (
  itens: ReadonlyArray<readonly [string, string?]>,
  atual: number,
  travou = false,
): Passo[] =>
  itens.map(([titulo, detalhe], k) => ({
    titulo,
    detalhe: detalhe ?? '',
    estado: k < atual ? 'ok' : k === atual ? (travou ? 'bad' : 'meio') : '',
  }));

/** Passo que resume a trilha para leitores de tela. */
export const passoAtual = (ps: readonly Passo[]): Passo | undefined =>
  ps.find((p) => p.estado === 'meio' || p.estado === 'bad') ??
  [...ps].reverse().find((p) => p.estado === 'ok') ??
  ps[0];
