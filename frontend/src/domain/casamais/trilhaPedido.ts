import { formatarReais } from '../shared/dinheiro';
import { diaMes } from '../shared/datas';
import { passosEmSequencia, type Passo } from '../shared/trilha';
import { ehServicoDaElora } from './remuneracao';
import type { PedidoServico } from './pedido';

/**
 * Trilha do pedido: o cliente vê até a avaliação; a equipe e o corretor veem até a margem recebida.
 * Mesma lógica do protótipo (passosServ).
 */
export function passosDoPedido(p: PedidoServico, interno: boolean): Passo[] {
  if (ehServicoDaElora(p)) {
    return passosEmSequencia(
      [
        ['Pedido', diaMes(p.criadoEm)],
        ['Conversa com a Elora', ''],
        ['Captação', ''],
      ],
      p.status === 'executado' ? 3 : 1,
      p.status === 'cancelado',
    );
  }
  const recebida = (p.margemRecebida ?? 0) > 0;
  const atualPorStatus: Partial<Record<PedidoServico['status'], number>> = { pedido: 1, orcamento: 2, aprovado: 3 };
  const atual =
    atualPorStatus[p.status] ?? (p.status === 'executado' ? (interno ? (recebida ? 5 : 4) : p.avaliacao ? 5 : 4) : 1);
  const fim: readonly [string, string] = interno
    ? ['Margem', recebida ? formatarReais(p.margemRecebida ?? 0) : p.status === 'executado' ? 'a receber' : '']
    : ['Avaliação', p.avaliacao ? `nota ${p.avaliacao.nota}` : ''];
  const passos = passosEmSequencia(
    [
      ['Pedido', diaMes(p.criadoEm)],
      ['Orçamento', p.orcamento && p.orcamento.valor > 0 ? formatarReais(p.orcamento.valor) : ''],
      ['Aprovação', p.aprovadoEm ? diaMes(p.aprovadoEm) : ''],
      ['Serviço feito', p.executadoEm ? diaMes(p.executadoEm) : ''],
      fim,
    ],
    atual,
  );
  if (p.status === 'cancelado') {
    const k = passos.findIndex((x) => x.estado !== 'ok');
    if (k >= 0) passos[k] = { ...passos[k]!, estado: 'bad', detalhe: 'cancelado' };
  }
  return passos;
}
