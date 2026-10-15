import type { DataISO } from '../shared/datas';

/** Contrato de locação (Lei 8.245/91). Valores em reais. */
export type TipoLocacao = 'residencial' | 'nao_residencial' | 'built_to_suit';
export type Garantia =
  'nenhuma' | 'seguro_fianca' | 'fianca' | 'caucao_dinheiro' | 'caucao_bens' | 'cessao_quotas_fundo';
/** Art. 17: sem salário mínimo, variação cambial ou moeda estrangeira — a lista simplesmente não os oferece. */
export type IndiceReajuste = 'IPCA' | 'IGPM' | 'INPC' | 'IVAR' | 'FIXO_CONTRATUAL';
export type FormaPagamento = 'boleto' | 'pix' | 'transferencia' | 'deposito';
export type Venia = 'na' | 'pendente' | 'obtida';
export type StatusContrato = 'ativo' | 'rescindido' | 'encerrado';
export type ChaveDocumento = 'docContrato' | 'docVistoria' | 'docGarantia' | 'docSeguro';

export const TIPO: Record<TipoLocacao, string> = {
  residencial: 'Residencial',
  nao_residencial: 'Não residencial',
  built_to_suit: 'Sob medida (art. 54-A)',
};
export const GARANTIA: Record<Garantia, string> = {
  nenhuma: 'Sem garantia',
  seguro_fianca: 'Seguro-fiança',
  fianca: 'Fiança',
  caucao_dinheiro: 'Caução em dinheiro',
  caucao_bens: 'Caução em bens',
  cessao_quotas_fundo: 'Quotas de fundo de investimento',
};
export const INDICES: Record<IndiceReajuste, string> = {
  IPCA: 'IPCA',
  IGPM: 'IGP-M',
  INPC: 'INPC',
  IVAR: 'IVAR',
  FIXO_CONTRATUAL: 'Percentual fixo em contrato',
};
export const FORMA_PAG: Record<FormaPagamento, string> = {
  boleto: 'Boleto',
  pix: 'PIX',
  transferencia: 'Transferência bancária',
  deposito: 'Depósito identificado',
};
export const VENIA: Record<Venia, string> = { na: 'Não se aplica', pendente: 'Pendente', obtida: 'Obtida' };
export const STATUS_CONTRATO: Record<StatusContrato, string> = {
  ativo: 'Ativo',
  rescindido: 'Rescindido',
  encerrado: 'Encerrado',
};
export const DOCS: Record<ChaveDocumento, string> = {
  docContrato: 'contrato assinado',
  docVistoria: 'laudo de vistoria de entrada',
  docGarantia: 'comprovante da garantia',
  docSeguro: 'seguro contra incêndio',
};

export interface Reajuste {
  /** Data a partir da qual o novo aluguel vale. */
  readonly em: DataISO;
  readonly indice: IndiceReajuste;
  readonly pct: number;
  readonly de: number;
  readonly para: number;
}

export interface ImovelResumo {
  readonly id: string;
  readonly codigo: string;
  readonly descricao: string;
  readonly bairro: string;
  readonly cidade: string;
}

export interface PessoaResumo {
  readonly id: string;
  readonly nome: string;
}

export interface CorretorResumo {
  readonly id: string;
  readonly nome: string;
}

/** Dados editáveis do contrato (o formulário). */
export interface DadosContrato {
  readonly imovelId: string;
  readonly locatarioId: string;
  readonly tipo: TipoLocacao;
  readonly inicio: DataISO;
  readonly fim: DataISO;
  readonly aluguel: number;
  /** Taxa de administração (%). */
  readonly taxa: number;
  readonly venc?: number;
  readonly formaPagamento?: FormaPagamento;
  readonly indice: IndiceReajuste;
  readonly garantia: Garantia;
  readonly caucao?: number;
  readonly seguradora?: string;
  readonly apolice?: string;
  readonly apoliceFim?: DataISO;
  readonly premio?: number;
  readonly antecipada: boolean;
  readonly venia: Venia;
  readonly cond?: number;
  readonly iptu?: number;
  readonly intermediacao?: number;
  readonly corretorLocId?: string;
  readonly diaRepasse?: number;
  readonly extraLocDesc?: string;
  readonly extraLocValor?: number;
  readonly extraPropDesc?: string;
  readonly extraPropValor?: number;
  readonly clausulas?: string;
  readonly docContrato: boolean;
  readonly docVistoria: boolean;
  readonly docGarantia: boolean;
  readonly docSeguro: boolean;
  readonly status: StatusContrato;
  readonly encerradoEm?: DataISO;
}

export interface ContratoLocacao extends DadosContrato {
  readonly id: string;
  readonly imovel: ImovelResumo;
  readonly locatario: PessoaResumo;
  /** Corretor de origem do imóvel (quem trouxe). */
  readonly corretorOrigemId?: string;
  readonly reajustes: readonly Reajuste[];
}

export const PADRAO_CONTRATO: Pick<
  DadosContrato,
  'tipo' | 'taxa' | 'venc' | 'indice' | 'garantia' | 'venia' | 'status' | 'antecipada'
> = {
  tipo: 'residencial',
  taxa: 8,
  venc: 5,
  indice: 'IPCA',
  garantia: 'seguro_fianca',
  venia: 'na',
  status: 'ativo',
  antecipada: false,
};

/** "Apartamento 2 dormitórios, Jardim Aquarius (EL-0101)" — como o protótipo nomeia o contrato. */
export const rotuloContrato = (c: Pick<ContratoLocacao, 'imovel'>): string =>
  `${c.imovel.descricao || 'Imóvel'}, ${c.imovel.bairro} (${c.imovel.codigo})`;
