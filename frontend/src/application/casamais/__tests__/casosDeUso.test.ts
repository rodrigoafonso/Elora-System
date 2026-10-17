import { describe, expect, it } from 'vitest';
import { criarCasaMaisMemoria } from '@/infrastructure/casamais/memoria';
import { casosDeUsoCasaMais, RegraVioladaError } from '../casosDeUso';
import { resumirCasaMais } from '../painel';

const montar = () => {
  const repos = criarCasaMaisMemoria();
  return { repos, casos: casosDeUsoCasaMais(repos) };
};

describe('casos de uso do Elora Casa+', () => {
  it('orçamento exige parceiro e valor', async () => {
    const { casos } = montar();
    await expect(casos.registrarOrcamento({ pedidoId: 'SV-1', parceiroId: '', valor: 100 })).rejects.toThrow(
      RegraVioladaError,
    );
    await expect(casos.registrarOrcamento({ pedidoId: 'SV-1', parceiroId: 'PA-3', valor: 0 })).rejects.toThrow(
      'Informe o valor.',
    );
  });

  it('orçamento congela a comissão do parceiro no pedido', async () => {
    const { casos } = montar();
    const p = await casos.registrarOrcamento({ pedidoId: 'SV-1', parceiroId: 'PA-3', valor: 350 });
    expect(p).toMatchObject({ status: 'orcamento', margemPct: 10, orcamento: { valor: 350 } });
  });

  it('margem recebida congela as regras do dia', async () => {
    const { casos } = montar();
    await casos.salvarRegras({ corretorPct: 40, fundoBoaIdeiaPct: 15, taxaPlugPlay: 150 });
    const p = await casos.registrarMargem({ pedidoId: 'SV-2', valor: 180, recebidaEm: '2026-10-14' });
    expect(p).toMatchObject({ margemRecebida: 180, fundoPct: 15, corretorPct: 40 });
  });

  it('parceiro só do Jurídico fica sem comissão (Lei 8.906/94, art. 34)', async () => {
    const { casos } = montar();
    const p = await casos.salvarParceiro({
      nome: 'Advocacia Exemplo',
      categorias: ['juridico'],
      comissaoPct: 10,
      ativo: true,
    });
    expect(p.comissaoPct).toBe(0);
  });

  it('regras ficam dentro dos limites', async () => {
    const { casos } = montar();
    expect(await casos.salvarRegras({ corretorPct: 140, fundoBoaIdeiaPct: 90, taxaPlugPlay: -5 })).toEqual({
      corretorPct: 100,
      fundoBoaIdeiaPct: 50,
      taxaPlugPlay: 0,
    });
  });

  it('novo pedido descarta subserviço de outra categoria e urgência no Jurídico', async () => {
    const { casos } = montar();
    const p = await casos.registrarPedido({
      categoria: 'juridico',
      subservico: 'Encanador',
      urgente: true,
      cliente: { perfil: 'comprador', referencia: 'EL-0117' },
      descricao: '  Inventário  ',
    });
    expect(p).toMatchObject({
      categoria: 'juridico',
      urgente: false,
      descricao: 'Inventário',
      status: 'pedido',
      cliente: { nome: 'Tatiana Moura' },
    });
    expect(p.subservico).toBeUndefined();
  });
});

describe('resumirCasaMais', () => {
  it('conta abertos, feitos e a margem dos últimos 12 meses', async () => {
    const { repos } = montar();
    const r = resumirCasaMais(await repos.pedidos.listar(), '2026-10-15');
    expect(r).toMatchObject({
      abertos: 2,
      semOrcamento: 1,
      feitos12m: 1,
      margem12m: 18000,
      fundoBoaIdeia12m: 1800,
      participacaoCorretores12m: 4860,
    });
    expect(r.pendentes.map((p) => p.id)).toEqual(['SV-1', 'SV-2']);
  });
});

describe('pacotes do Casa+', () => {
  it('cria o pacote e um pedido por item (Plug & Play já aprovado, com a taxa)', async () => {
    const { repos, casos } = montar();
    const pk = await casos.registrarPacote({
      cliente: { perfil: 'comprador', referencia: 'EL-0117' },
      data: '2026-11-05',
      pessoas: 3,
      pet: false,
      gasEncanado: false,
      itens: ['plugplay', 'limpeza', 'guia', 'limpeza'],
    });
    expect(pk).toMatchObject({
      itens: ['plugplay', 'limpeza', 'guia'],
      cliente: { nome: 'Tatiana Moura' },
      imovelId: 'EL-0117',
    });
    expect(pk.pedidos).toHaveLength(2);
    const criados = (await repos.pedidos.listar()).filter((p) => p.pacoteId === pk.id);
    expect(criados.map((p) => [p.categoria, p.status])).toEqual(
      expect.arrayContaining([
        ['plugplay', 'aprovado'],
        ['limpeza', 'pedido'],
      ]),
    );
    expect(criados.find((p) => p.categoria === 'plugplay')?.orcamento?.valor).toBe(150);
  });

  it('funcionário de empresa precisa de nome; pacote sem itens é recusado', async () => {
    const { casos } = montar();
    await expect(
      casos.registrarPacote({
        cliente: { perfil: 'empresa', referencia: 'EM-1' },
        data: '2026-11-05',
        pessoas: 1,
        pet: false,
        gasEncanado: false,
        itens: ['guia'],
      }),
    ).rejects.toThrow('Informe o nome do funcionário.');
    await expect(
      casos.registrarPacote({
        cliente: { perfil: 'empresa', referencia: 'EM-1', nome: 'Daniel' },
        data: '2026-11-05',
        pessoas: 1,
        pet: false,
        gasEncanado: false,
        itens: [],
      }),
    ).rejects.toThrow('Escolha ao menos um item do pacote.');
  });

  it('marca o guia do bairro enviado', async () => {
    const { casos } = montar();
    const pk = await casos.registrarPacote({
      cliente: { perfil: 'empresa', referencia: 'EM-1', nome: 'Daniel' },
      data: '2026-11-05',
      pessoas: 1,
      pet: false,
      gasEncanado: false,
      itens: ['guia'],
    });
    expect((await casos.marcarGuiaEnviado(pk.id)).guiaEnviadoEm).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
