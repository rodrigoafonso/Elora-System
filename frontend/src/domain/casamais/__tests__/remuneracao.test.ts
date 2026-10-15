import { describe, expect, it } from 'vitest';
import { centavos } from '../../shared/dinheiro';
import { dividirMargem, divisaoDoPedido, margemPrevista } from '../remuneracao';
import type { PedidoServico } from '../pedido';

const base: PedidoServico = {
  id: 'SV-T',
  categoria: 'limpeza',
  cliente: { perfil: 'inquilino', referencia: 'C-1', nome: 'Cliente' },
  descricao: 'Teste',
  status: 'executado',
  criadoEm: '2026-09-01T10:00:00Z',
};

describe('dividirMargem', () => {
  it('tira o fundo Boa Ideia antes e dá ao corretor a parte do restante (exemplo do manual: R$ 180)', () => {
    const d = dividirMargem(centavos(180), 10, 30, true);
    expect(d).toEqual({ margem: 18000, fundo: 1800, corretor: 4860, elora: 11340 });
  });

  it('sem corretor, o restante fica com a Elora', () => {
    const d = dividirMargem(centavos(180), 10, 30, false);
    expect(d.corretor).toBe(0);
    expect(d.elora).toBe(16200);
  });

  it('a soma das partes é sempre a margem (sem centavo perdido)', () => {
    for (const reais of [0.01, 1, 33.33, 99.99, 1234.57]) {
      const d = dividirMargem(centavos(reais), 7, 33, true);
      expect(d.fundo + d.corretor + d.elora).toBe(d.margem);
    }
  });
});

describe('divisaoDoPedido', () => {
  it('não existe sem margem efetivamente recebida', () => {
    expect(divisaoDoPedido(base)).toBeNull();
  });

  it('usa os percentuais congelados no pedido, não os atuais', () => {
    const d = divisaoDoPedido({ ...base, corretorId: 'k', margemRecebida: 100, fundoPct: 20, corretorPct: 50 });
    expect(d).toEqual({ margem: 10000, fundo: 2000, corretor: 4000, elora: 4000 });
  });
});

describe('margemPrevista', () => {
  it('é o valor do orçamento vezes a comissão do parceiro', () => {
    expect(margemPrevista({ ...base, orcamento: { valor: 1500, em: '2026-10-11' }, margemPct: 12 })).toBe(18000);
    expect(margemPrevista(base)).toBe(0);
  });
});
