import { centavos, type Centavos } from '@/domain/shared/dinheiro';
import { diasEntre } from '@/domain/shared/datas';
import { divisaoDoPedido, ehServicoDaElora, margemPrevista } from '@/domain/casamais/remuneracao';
import { estaAberto, margemFoiRecebida, type PedidoServico } from '@/domain/casamais/pedido';

export type FiltroPedidos = 'abertos' | 'feitos' | 'todos';

export interface ResumoCasaMais {
  readonly abertos: number;
  readonly semOrcamento: number;
  readonly feitos12m: number;
  readonly margem12m: Centavos;
  readonly participacaoCorretores12m: Centavos;
  readonly fundoBoaIdeia12m: Centavos;
  readonly aReceber: Centavos;
  /** Em aberto + feitos com margem ainda não recebida (a equipe precisa agir). */
  readonly pendentes: PedidoServico[];
}

const soma = (xs: Centavos[]): Centavos => xs.reduce((s, x) => s + x, 0) as Centavos;

/** Números e listas do painel do marketplace (mesmas contas do protótipo). */
export function resumirCasaMais(pedidos: readonly PedidoServico[], hoje: string): ResumoCasaMais {
  const ordenados = [...pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const noAno = (p: PedidoServico) => Boolean(p.recebidaEm) && diasEntre(p.recebidaEm!, hoje) <= 365;
  const abertos = ordenados.filter(estaAberto);
  const feitos = ordenados.filter(
    (p) => p.status === 'executado' && p.executadoEm && diasEntre(p.executadoEm, hoje) <= 365,
  );
  const recebidosAno = ordenados.filter(noAno);
  const divisoes = recebidosAno.map(divisaoDoPedido).filter((d) => d !== null);
  const aReceber = ordenados.filter((p) => p.status === 'executado' && !margemFoiRecebida(p) && !ehServicoDaElora(p));
  return {
    abertos: abertos.length,
    semOrcamento: abertos.filter((p) => p.status === 'pedido').length,
    feitos12m: feitos.length,
    margem12m: soma(recebidosAno.map((p) => centavos(p.margemRecebida ?? 0))),
    participacaoCorretores12m: soma(divisoes.map((d) => d.corretor)),
    fundoBoaIdeia12m: soma(divisoes.map((d) => d.fundo)),
    aReceber: soma(aReceber.map(margemPrevista)),
    pendentes: ordenados.filter((p) => estaAberto(p) || aReceber.includes(p)),
  };
}

export function filtrarPedidos(
  pedidos: readonly PedidoServico[],
  resumo: ResumoCasaMais,
  filtro: FiltroPedidos,
): PedidoServico[] {
  const ordenados = [...pedidos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  if (filtro === 'todos') return ordenados;
  if (filtro === 'feitos') return ordenados.filter((p) => p.status === 'executado');
  return resumo.pendentes;
}
