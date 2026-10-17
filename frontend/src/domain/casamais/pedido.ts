import type { DataISO } from '../shared/datas';
import type { ChaveCategoria } from './categorias';

export type StatusPedido = 'pedido' | 'orcamento' | 'aprovado' | 'executado' | 'cancelado';
/** 'empresa' = funcionário de uma empresa cliente (Casa+ Empresas); a referência é o id da empresa. */
export type PerfilCliente = 'proprietario' | 'inquilino' | 'comprador' | 'empresa';

export const STATUS_PEDIDO: Record<StatusPedido, readonly [classe: string, rotulo: string]> = {
  pedido: ['gold', 'Pedido de orçamento'],
  orcamento: ['gold', 'Orçamento enviado'],
  aprovado: ['', 'Aprovado'],
  executado: ['ok', 'Serviço feito'],
  cancelado: ['', 'Cancelado'],
};

export interface ClientePedido {
  readonly perfil: PerfilCliente;
  readonly referencia: string;
  readonly nome: string;
  readonly telefone?: string;
}

export interface Orcamento {
  /** Valor do serviço, em reais. */
  readonly valor: number;
  readonly prazo?: string;
  readonly observacao?: string;
  readonly em: DataISO;
}

export interface Avaliacao {
  readonly nota: number;
  readonly comentario?: string;
  readonly em: DataISO;
}

export interface PedidoServico {
  readonly id: string;
  readonly categoria: ChaveCategoria;
  readonly subservico?: string;
  readonly urgente?: boolean;
  readonly parceiroId?: string;
  readonly cliente: ClientePedido;
  readonly imovelId?: string;
  readonly corretorId?: string;
  readonly corretorNome?: string;
  readonly descricao: string;
  /** Data de preferência do cliente para o serviço. */
  readonly preferenciaEm?: DataISO;
  readonly status: StatusPedido;
  readonly criadoEm: string;
  readonly aprovadoEm?: DataISO;
  readonly executadoEm?: DataISO;
  readonly orcamento?: Orcamento;
  /** Comissão do parceiro (% do serviço) congelada no orçamento. */
  readonly margemPct?: number;
  /** Margem efetivamente recebida do parceiro, em reais. */
  readonly margemRecebida?: number;
  readonly recebidaEm?: DataISO;
  /** Percentuais do dia em que a margem foi recebida (regra congelada). */
  readonly corretorPct?: number;
  readonly fundoPct?: number;
  readonly avaliacao?: Avaliacao;
  /** Pacote do Casa+ que gerou o pedido, se houver. */
  readonly pacoteId?: string;
}

export interface Parceiro {
  readonly id: string;
  readonly nome: string;
  readonly categorias: readonly ChaveCategoria[];
  /** Comissão da Elora sobre o valor do serviço (%). */
  readonly comissaoPct: number;
  readonly whatsapp?: string;
  readonly cidades?: string;
  readonly prazo?: string;
  readonly apresentacao?: string;
  readonly ativo: boolean;
}

export interface RegrasCasaMais {
  /** Participação do corretor sobre a margem que sobra depois do fundo (%). */
  readonly corretorPct: number;
  /** Parte de cada margem que vai para o fundo do Projeto Boa Ideia (%). */
  readonly fundoBoaIdeiaPct: number;
  /** Taxa da Mudança Plug & Play (R$). */
  readonly taxaPlugPlay: number;
}

export const REGRAS_PADRAO: RegrasCasaMais = { corretorPct: 30, fundoBoaIdeiaPct: 10, taxaPlugPlay: 150 };

export interface ClienteEmJornada {
  readonly perfil: PerfilCliente;
  readonly referencia: string;
  readonly nome: string;
  readonly telefone?: string;
  readonly imovelId?: string;
  readonly corretorId?: string;
  readonly corretorNome?: string;
  /** Data da compra ou do início da locação. */
  readonly desde: DataISO;
  readonly rotulo: 'Comprou' | 'Alugou';
  readonly pedidos: number;
}

export const estaAberto = (p: PedidoServico): boolean =>
  p.status === 'pedido' || p.status === 'orcamento' || p.status === 'aprovado';
export const margemFoiRecebida = (p: PedidoServico): boolean => (p.margemRecebida ?? 0) > 0;
