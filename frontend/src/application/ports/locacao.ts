import type {
  ContratoLocacao,
  CorretorResumo,
  DadosContrato,
  ImovelResumo,
  PessoaResumo,
  Reajuste,
} from '@/domain/locacao/contrato';

/** Portas da Locação. Implementadas por HTTP (back-end) ou memória (desenvolvimento e testes). */
export interface ContratoRepository {
  listar(): Promise<ContratoLocacao[]>;
  criar(dados: DadosContrato): Promise<ContratoLocacao>;
  atualizar(id: string, dados: DadosContrato): Promise<ContratoLocacao>;
  reajustar(id: string, reajuste: Omit<Reajuste, 'indice' | 'de'>): Promise<ContratoLocacao>;
}

/** Cadastros de outros módulos que o formulário de contrato usa (somente leitura). */
export interface CadastrosLocacao {
  imoveis(): Promise<ImovelResumo[]>;
  locatarios(): Promise<PessoaResumo[]>;
  corretores(): Promise<CorretorResumo[]>;
}

export interface LocacaoRepositories {
  readonly contratos: ContratoRepository;
  readonly cadastros: CadastrosLocacao;
}
