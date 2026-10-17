import type { ChaveCategoria } from '@/domain/casamais/categorias';
import type { BuscaImovel, ChaveItemPacote, Empresa, Pacote } from '@/domain/casamais/pacote';
import type {
  ClienteEmJornada,
  Parceiro,
  PedidoServico,
  PerfilCliente,
  RegrasCasaMais,
} from '@/domain/casamais/pedido';

/**
 * Portas (interfaces) do Elora Casa+. A aplicação depende delas; a infraestrutura as implementa
 * (HTTP para o back-end Spring Boot ou memória para desenvolvimento e testes).
 */
export interface NovoPedido {
  readonly categoria: ChaveCategoria;
  readonly subservico?: string;
  readonly urgente: boolean;
  /** Cliente em jornada (perfil + referência do contrato ou do imóvel comprado). */
  readonly cliente: { readonly perfil: PerfilCliente; readonly referencia: string };
  readonly descricao: string;
  readonly preferenciaEm?: string;
}

export interface NovoOrcamento {
  readonly pedidoId: string;
  readonly parceiroId: string;
  readonly valor: number;
  readonly prazo?: string;
  readonly observacao?: string;
}

export interface MargemRecebida {
  readonly pedidoId: string;
  readonly valor: number;
  readonly recebidaEm: string;
}

export interface PedidoServicoRepository {
  listar(): Promise<PedidoServico[]>;
  registrar(dados: NovoPedido): Promise<PedidoServico>;
  registrarOrcamento(dados: NovoOrcamento): Promise<PedidoServico>;
  registrarAprovacao(pedidoId: string): Promise<PedidoServico>;
  registrarConclusao(pedidoId: string): Promise<PedidoServico>;
  registrarMargem(dados: MargemRecebida): Promise<PedidoServico>;
  cancelar(pedidoId: string, motivo: string): Promise<PedidoServico>;
}

export interface ParceiroRepository {
  listar(): Promise<Parceiro[]>;
  salvar(parceiro: Omit<Parceiro, 'id'> & { id?: string }): Promise<Parceiro>;
}

export interface RegrasCasaMaisRepository {
  obter(): Promise<RegrasCasaMais>;
  salvar(regras: RegrasCasaMais): Promise<RegrasCasaMais>;
}

export interface JornadaRepository {
  /** Compras dos últimos 180 dias e locações iniciadas nos últimos 90. */
  listar(): Promise<ClienteEmJornada[]>;
}

export interface NovoPacote {
  /** Cliente em jornada (perfil + referência) ou funcionário de empresa (perfil 'empresa', referência = id da empresa). */
  readonly cliente: {
    readonly perfil: PerfilCliente;
    readonly referencia: string;
    readonly nome?: string;
    readonly telefone?: string;
  };
  readonly data: string;
  readonly origem?: string;
  readonly pessoas: number;
  readonly pet: boolean;
  readonly gasEncanado: boolean;
  readonly observacao?: string;
  readonly buscaImovel?: BuscaImovel;
  readonly itens: readonly ChaveItemPacote[];
}

export interface PacoteRepository {
  listar(): Promise<Pacote[]>;
  /** Cria o pacote e os pedidos dos itens numa operação só. */
  registrar(dados: NovoPacote): Promise<Pacote>;
  marcarGuiaEnviado(pacoteId: string): Promise<Pacote>;
}

export interface EmpresaRepository {
  listar(): Promise<Empresa[]>;
  salvar(empresa: Omit<Empresa, 'id'> & { id?: string }): Promise<Empresa>;
}

export interface CasaMaisRepositories {
  readonly pedidos: PedidoServicoRepository;
  readonly parceiros: ParceiroRepository;
  readonly regras: RegrasCasaMaisRepository;
  readonly jornadas: JornadaRepository;
  readonly pacotes: PacoteRepository;
  readonly empresas: EmpresaRepository;
}
