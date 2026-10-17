import { categoria, semComissao } from '@/domain/casamais/categorias';
import type { Parceiro, RegrasCasaMais } from '@/domain/casamais/pedido';
import { itemPacote, type Empresa } from '@/domain/casamais/pacote';
import type { CasaMaisRepositories, MargemRecebida, NovoOrcamento, NovoPacote, NovoPedido } from '../ports/casamais';

/** Erro de regra de negócio com mensagem pronta para a tela. */
export class RegraVioladaError extends Error {}

const exigir = (condicao: unknown, mensagem: string): void => {
  if (!condicao) throw new RegraVioladaError(mensagem);
};

/**
 * Casos de uso do Elora Casa+. Validam a entrada, aplicam as regras e delegam a persistência às portas.
 * O back-end aplica as mesmas regras; aqui elas existem para dar resposta imediata na tela.
 */
export const casosDeUsoCasaMais = (repos: CasaMaisRepositories) => ({
  async registrarPedido(dados: NovoPedido) {
    exigir(dados.cliente.referencia, 'Escolha o cliente.');
    exigir(dados.descricao.trim(), 'Explique o serviço.');
    const cat = categoria(dados.categoria);
    exigir(cat, 'Escolha o serviço.');
    // Subserviço só vale se pertencer à lista da categoria; urgência não se aplica ao Jurídico nem aos serviços da Elora.
    const subValido = cat?.subservicos?.some(([, itens]) => itens.includes(dados.subservico ?? '')) ?? false;
    return repos.pedidos.registrar({
      ...dados,
      descricao: dados.descricao.trim().slice(0, 500),
      subservico: subValido ? dados.subservico : undefined,
      urgente: dados.urgente && !cat?.daElora && dados.categoria !== 'juridico',
    });
  },

  async registrarOrcamento(dados: NovoOrcamento) {
    exigir(dados.parceiroId, 'Escolha o parceiro.');
    exigir(dados.valor > 0, 'Informe o valor.');
    return repos.pedidos.registrarOrcamento(dados);
  },

  async registrarMargem(dados: MargemRecebida) {
    exigir(dados.valor > 0, 'Informe o valor recebido.');
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(dados.recebidaEm), 'Informe a data do recebimento.');
    return repos.pedidos.registrarMargem(dados);
  },

  async registrarPacote(dados: NovoPacote) {
    exigir(/^\d{4}-\d{2}-\d{2}$/.test(dados.data), 'Informe a data da mudança.');
    const itens = [...new Set(dados.itens)].filter((k) => itemPacote(k));
    exigir(itens.length > 0, 'Escolha ao menos um item do pacote.');
    exigir(dados.cliente.referencia, 'Escolha para quem é o pacote.');
    if (dados.cliente.perfil === 'empresa') exigir(dados.cliente.nome?.trim(), 'Informe o nome do funcionário.');
    return repos.pacotes.registrar({
      ...dados,
      itens,
      pessoas: Math.min(20, Math.max(1, Math.round(dados.pessoas) || 1)),
      origem: dados.origem?.trim().slice(0, 80) || undefined,
      observacao: dados.observacao?.trim().slice(0, 400) || undefined,
    });
  },

  marcarGuiaEnviado: (pacoteId: string) => repos.pacotes.marcarGuiaEnviado(pacoteId),

  async salvarEmpresa(e: Omit<Empresa, 'id'> & { id?: string }) {
    exigir(e.nome.trim(), 'Informe o nome da empresa.');
    return repos.empresas.salvar({ ...e, nome: e.nome.trim().slice(0, 100) });
  },

  aprovar: (pedidoId: string) => repos.pedidos.registrarAprovacao(pedidoId),
  concluir: (pedidoId: string) => repos.pedidos.registrarConclusao(pedidoId),
  cancelar: (pedidoId: string) => repos.pedidos.cancelar(pedidoId, 'Cancelado pela equipe'),

  async salvarParceiro(p: Omit<Parceiro, 'id'> & { id?: string }) {
    exigir(p.nome.trim(), 'Informe o nome e ao menos um serviço.');
    exigir(p.categorias.length > 0, 'Informe o nome e ao menos um serviço.');
    // Jurídico: advogado não pode pagar por indicação (Lei 8.906/94, art. 34).
    const comissaoPct = p.categorias.every(semComissao) ? 0 : Math.min(50, Math.max(0, p.comissaoPct));
    return repos.parceiros.salvar({ ...p, nome: p.nome.trim(), comissaoPct });
  },

  async salvarRegras(r: RegrasCasaMais) {
    return repos.regras.salvar({
      corretorPct: Math.min(100, Math.max(0, Math.round(r.corretorPct))),
      fundoBoaIdeiaPct: Math.min(50, Math.max(0, Math.round(r.fundoBoaIdeiaPct))),
      taxaPlugPlay: Math.max(0, Math.round(r.taxaPlugPlay)),
    });
  },
});

export type CasosDeUsoCasaMais = ReturnType<typeof casosDeUsoCasaMais>;
