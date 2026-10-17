import type { DataISO } from '../shared/datas';
import type { ChaveCategoria } from './categorias';
import type { ClientePedido, PedidoServico } from './pedido';

/**
 * Pacotes do Elora Casa+: vários serviços num pedido só. O Pacote Chegada atende quem comprou, alugou ou está
 * chegando à região, inclusive funcionários transferidos (Casa+ Empresas). Cada item vira um pedido comum do Casa+
 * (mesmas regras de orçamento, margem, fundo Boa Ideia e participação); o guia do bairro é tarefa da equipe.
 */
export type ChaveItemPacote = 'plugplay' | 'limpeza' | 'mudanca' | 'montagem' | 'instalacao' | 'clima' | 'guia';
export type MomentoItem = 'antes' | 'dia' | 'semana';

export interface ItemPacote {
  readonly chave: ChaveItemPacote;
  readonly titulo: string;
  readonly descricao: string;
  readonly momento: MomentoItem;
  readonly icone: string;
  /** Categoria do pedido gerado (o guia do bairro não gera pedido). */
  readonly categoria?: ChaveCategoria;
  readonly subservico?: string;
  readonly gratis?: boolean;
}

export const MOMENTOS: Record<MomentoItem, string> = {
  antes: 'Antes da mudança',
  dia: 'No dia',
  semana: 'Primeira semana',
};

export const ITENS_PACOTE: readonly ItemPacote[] = [
  {
    chave: 'plugplay',
    categoria: 'plugplay',
    titulo: 'Luz, água, gás e internet',
    descricao: 'A Elora encerra as contas do endereço antigo e liga tudo no novo, com procuração simples.',
    momento: 'antes',
    icone: 'raio',
  },
  {
    chave: 'limpeza',
    categoria: 'limpeza',
    titulo: 'Limpeza de entrada',
    descricao: 'Imóvel limpo antes de os móveis chegarem.',
    momento: 'antes',
    icone: 'balde',
  },
  {
    chave: 'mudanca',
    categoria: 'mudanca',
    titulo: 'Mudança e frete',
    descricao: 'Embalagem e transporte, com orçamento de parceiros avaliados.',
    momento: 'dia',
    icone: 'caixa',
  },
  {
    chave: 'montagem',
    categoria: 'moveis',
    titulo: 'Montagem de móveis',
    descricao: 'Montador para armários, camas e móveis planejados.',
    momento: 'semana',
    icone: 'sofa',
  },
  {
    chave: 'instalacao',
    categoria: 'manutencao',
    subservico: 'Marido de aluguel',
    titulo: 'Pequenas instalações',
    descricao: 'Cortinas, quadros, chuveiro, luminárias e suporte de TV.',
    momento: 'semana',
    icone: 'ferramenta',
  },
  {
    chave: 'clima',
    categoria: 'clima',
    titulo: 'Ar-condicionado',
    descricao: 'Instalação ou limpeza dos aparelhos.',
    momento: 'semana',
    icone: 'neve',
  },
  {
    chave: 'guia',
    titulo: 'Guia do bairro',
    descricao: 'Escolas, saúde, mercados e transporte perto do novo endereço, preparado pela Elora.',
    momento: 'semana',
    icone: 'pin',
    gratis: true,
  },
];

export const ITENS_PADRAO: readonly ChaveItemPacote[] = ['plugplay', 'limpeza', 'mudanca', 'guia'];
export const itemPacote = (chave: string): ItemPacote | undefined => ITENS_PACOTE.find((i) => i.chave === chave);

export interface Empresa {
  readonly id: string;
  readonly nome: string;
  readonly cidade?: string;
  readonly contato?: string;
  readonly whatsapp?: string;
  readonly email?: string;
  /** Auxílio-moradia ou faixa de aluguel combinada com o RH. */
  readonly auxilio?: string;
  readonly observacao?: string;
}

export type BuscaImovel = 'Locação' | 'Compra';

export interface Pacote {
  readonly id: string;
  readonly tipo: 'chegada';
  readonly cliente: ClientePedido;
  readonly empresaId?: string;
  readonly imovelId?: string;
  readonly corretorId?: string;
  readonly corretorNome?: string;
  /** Data da mudança. */
  readonly data: DataISO;
  readonly origem?: string;
  readonly pessoas: number;
  readonly pet: boolean;
  readonly observacao?: string;
  /** Precisa encontrar o imóvel (abre atendimento no Comercial quando ele for migrado). */
  readonly buscaImovel?: BuscaImovel;
  readonly itens: readonly ChaveItemPacote[];
  /** Pedidos do Casa+ gerados pelo pacote. */
  readonly pedidos: readonly string[];
  readonly guiaEnviadoEm?: DataISO;
  readonly criadoEm: string;
}

export interface Progresso {
  readonly total: number;
  readonly feitos: number;
  readonly pct: number;
  readonly pronto: boolean;
}

/** Itens prontos (serviço feito ou guia enviado) sobre o total; pedidos cancelados saem da conta. */
export function progressoDoPacote(pk: Pacote, pedidos: readonly PedidoServico[]): Progresso {
  const meus = pedidos.filter((p) => pk.pedidos.includes(p.id) && p.status !== 'cancelado');
  const temGuia = pk.itens.includes('guia');
  const total = meus.length + (temGuia ? 1 : 0);
  const feitos = meus.filter((p) => p.status === 'executado').length + (temGuia && pk.guiaEnviadoEm ? 1 : 0);
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  return { total, feitos, pct, pronto: total > 0 && feitos === total };
}

/** Pedido do pacote que corresponde a um item (mesma categoria e, se houver, mesmo subserviço). */
export const pedidoDoItem = (
  pk: Pacote,
  item: ItemPacote,
  pedidos: readonly PedidoServico[],
): PedidoServico | undefined =>
  pedidos.find(
    (p) =>
      pk.pedidos.includes(p.id) &&
      p.categoria === item.categoria &&
      (!item.subservico || p.subservico === item.subservico),
  );
