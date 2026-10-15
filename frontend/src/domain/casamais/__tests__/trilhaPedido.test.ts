import { describe, expect, it } from 'vitest';
import { passosDoPedido } from '../trilhaPedido';
import type { PedidoServico } from '../pedido';

const pedido = (extra: Partial<PedidoServico>): PedidoServico => ({
  id: 'SV-T',
  categoria: 'mudanca',
  cliente: { perfil: 'comprador', referencia: 'EL-1', nome: 'Cliente' },
  descricao: 'Teste',
  status: 'pedido',
  criadoEm: '2026-10-10T10:00:00Z',
  ...extra,
});

const estados = (p: PedidoServico, interno = true) => passosDoPedido(p, interno).map((x) => x.estado);

describe('passosDoPedido', () => {
  it('pedido novo: só o primeiro passo feito, orçamento é o atual', () => {
    expect(estados(pedido({}))).toEqual(['ok', 'meio', '', '', '']);
  });

  it('equipe vê a margem como último passo; o cliente vê a avaliação', () => {
    const p = pedido({ status: 'executado', executadoEm: '2026-10-12', orcamento: { valor: 1000, em: '2026-10-10' } });
    expect(passosDoPedido(p, true).at(-1)).toMatchObject({ titulo: 'Margem', detalhe: 'a receber', estado: 'meio' });
    expect(passosDoPedido(p, false).at(-1)).toMatchObject({ titulo: 'Avaliação', estado: 'meio' });
  });

  it('margem recebida fecha a trilha da equipe', () => {
    const p = pedido({ status: 'executado', margemRecebida: 120 });
    expect(estados(p)).toEqual(['ok', 'ok', 'ok', 'ok', 'ok']);
  });

  it('cancelado marca o primeiro passo pendente como travado', () => {
    const p = pedido({ status: 'cancelado' });
    const passos = passosDoPedido(p, true);
    expect(passos.map((x) => x.estado)).toEqual(['ok', 'bad', '', '', '']);
    expect(passos[1]?.detalhe).toBe('cancelado');
  });

  it('serviço da própria Elora segue a trilha de captação', () => {
    expect(passosDoPedido(pedido({ categoria: 'administracao' }), true).map((x) => x.titulo)).toEqual([
      'Pedido',
      'Conversa com a Elora',
      'Captação',
    ]);
  });
});
