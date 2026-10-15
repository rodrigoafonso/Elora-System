import { centavos, percentualDe, type Centavos } from '../shared/dinheiro';
import { categoria } from './categorias';
import type { PedidoServico, RegrasCasaMais } from './pedido';

/**
 * Regra de remuneração do Elora Casa+.
 * Só existe remuneração quando há margem efetivamente recebida do parceiro.
 * 1) Fundo do Projeto Boa Ideia = fundo% da margem.
 * 2) Corretor = corretor% do que sobra.
 * 3) Elora = o restante.
 * Os percentuais usados são os do dia em que a margem foi recebida (congelados no pedido).
 */
export interface DivisaoMargem {
  readonly margem: Centavos;
  readonly fundo: Centavos;
  readonly corretor: Centavos;
  readonly elora: Centavos;
}

export const dividirMargem = (
  margem: Centavos,
  fundoPct: number,
  corretorPct: number,
  temCorretor: boolean,
): DivisaoMargem => {
  const fundo = percentualDe(margem, fundoPct);
  const corretor = temCorretor ? percentualDe((margem - fundo) as Centavos, corretorPct) : (0 as Centavos);
  return { margem, fundo, corretor, elora: (margem - fundo - corretor) as Centavos };
};

/** Divisão de um pedido com margem já recebida (usa os percentuais congelados). */
export const divisaoDoPedido = (p: PedidoServico): DivisaoMargem | null => {
  if (!((p.margemRecebida ?? 0) > 0)) return null;
  return dividirMargem(centavos(p.margemRecebida ?? 0), p.fundoPct ?? 0, p.corretorPct ?? 0, Boolean(p.corretorId));
};

/** Margem prevista pelo orçamento (valor × comissão do parceiro). */
export const margemPrevista = (p: PedidoServico): Centavos =>
  p.orcamento && p.orcamento.valor > 0 ? percentualDe(centavos(p.orcamento.valor), p.margemPct ?? 0) : (0 as Centavos);

/** Previsão da parte do corretor com as regras atuais. */
export const participacaoPrevista = (margem: Centavos, regras: RegrasCasaMais): Centavos =>
  dividirMargem(margem, regras.fundoBoaIdeiaPct, regras.corretorPct, true).corretor;

export const ehServicoDaElora = (p: Pick<PedidoServico, 'categoria'>): boolean =>
  Boolean(categoria(p.categoria)?.daElora);
export const ehPlugPlay = (p: Pick<PedidoServico, 'categoria'>): boolean => p.categoria === 'plugplay';
