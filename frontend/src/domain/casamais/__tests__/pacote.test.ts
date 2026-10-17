import { describe, expect, it } from 'vitest';
import { progressoDoPacote, type Pacote } from '../pacote';
import type { PedidoServico } from '../pedido';

const pedido = (
  id: string,
  status: PedidoServico['status'],
  categoria: PedidoServico['categoria'] = 'limpeza',
): PedidoServico => ({
  id,
  categoria,
  cliente: { perfil: 'inquilino', referencia: 'C-1', nome: 'Ana' },
  descricao: 'Pacote Chegada',
  status,
  criadoEm: '2026-10-17T10:00:00Z',
});

const pacote = (extra: Partial<Pacote> = {}): Pacote => ({
  id: 'PK-1',
  tipo: 'chegada',
  cliente: { perfil: 'inquilino', referencia: 'C-1', nome: 'Ana' },
  data: '2026-11-05',
  pessoas: 2,
  pet: false,
  itens: ['limpeza', 'mudanca', 'guia'],
  pedidos: ['SV-1', 'SV-2'],
  criadoEm: '2026-10-17T10:00:00Z',
  ...extra,
});

describe('progressoDoPacote', () => {
  it('conta serviços feitos e o guia do bairro enviado', () => {
    const ps = [pedido('SV-1', 'executado'), pedido('SV-2', 'orcamento', 'mudanca')];
    expect(progressoDoPacote(pacote(), ps)).toEqual({ total: 3, feitos: 1, pct: 33, pronto: false });
    expect(progressoDoPacote(pacote({ guiaEnviadoEm: '2026-10-20' }), ps).feitos).toBe(2);
  });

  it('pedido cancelado sai da conta; pacote fica pronto quando todo o resto está feito', () => {
    const ps = [pedido('SV-1', 'executado'), pedido('SV-2', 'cancelado', 'mudanca')];
    expect(progressoDoPacote(pacote({ guiaEnviadoEm: '2026-10-20' }), ps)).toEqual({
      total: 2,
      feitos: 2,
      pct: 100,
      pronto: true,
    });
  });
});
