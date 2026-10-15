/** Categorias do Elora Casa+ (marketplace de serviços depois das chaves). */
export type ChaveCategoria =
  | 'plugplay'
  | 'manutencao'
  | 'assistencia'
  | 'mudanca'
  | 'limpeza'
  | 'moveis'
  | 'clima'
  | 'seguranca'
  | 'jardim'
  | 'juridico'
  | 'reforma'
  | 'administracao';

export type GrupoServicos = readonly [grupo: string, itens: readonly string[]];

export interface Categoria {
  readonly chave: ChaveCategoria;
  readonly nome: string;
  readonly icone: string;
  /** Serviço prestado pela própria Elora (vira captação, não usa parceiro). */
  readonly daElora?: boolean;
  /** Lista de escolha (barra de seleção) com grupos de serviços. */
  readonly subservicos?: readonly GrupoServicos[];
  /** Fora da grade do app; mantida só para registros antigos. */
  readonly oculta?: boolean;
  /** Cobrada por taxa fixa (Mudança Plug & Play). */
  readonly taxaFixa?: boolean;
}

export const SUB_REPAROS: readonly GrupoServicos[] = [
  [
    'Mais pedidos',
    [
      'Marido de aluguel',
      'Encanador (urgência)',
      'Eletricista (urgência)',
      'Desentupidor (urgência)',
      'Chaveiro (urgência)',
      'Assistência técnica de eletrodomésticos',
    ],
  ],
  [
    'Reformas e reparos',
    [
      'Encanador',
      'Eletricista',
      'Gás',
      'Gesso e drywall',
      'Pavimentação',
      'Pintor',
      'Serralheria e solda',
      'Vidraceiro',
    ],
  ],
  [
    'Construção',
    [
      'Arquiteto',
      'Design de interiores',
      'Empreiteiro',
      'Engenheiro',
      'Limpeza pós-obra',
      'Marmoraria e granitos',
      'Pedreiro',
      'Poço artesiano',
      'Remoção de entulho',
    ],
  ],
  [
    'Instalação',
    [
      'Antenista',
      'Automação residencial',
      'Instalação de eletrônicos',
      'Instalador de TV digital',
      'Segurança eletrônica',
      'Toldos e coberturas',
    ],
  ],
  [
    'Serviços gerais',
    [
      'Chaveiro',
      'Dedetizador',
      'Desentupidor',
      'Desinfecção',
      'Impermeabilizador',
      'Marceneiro',
      'Marido de aluguel',
      'Mudanças e carretos',
      'Tapeceiro',
    ],
  ],
  [
    'Para casa',
    [
      'Banheira',
      'Coifas e exaustores',
      'Decorador',
      'Instalador de papel de parede',
      'Jardinagem',
      'Montador de móveis',
      'Paisagista',
      'Piscina',
    ],
  ],
  ['Aluguel de maquinário', ['Aluguel de maquinário']],
];

export const SUB_ASSISTENCIA: readonly GrupoServicos[] = [
  [
    'Eletrodomésticos',
    [
      'Adega climatizada',
      'Fogão e cooktop',
      'Geladeira e freezer',
      'Lava-louça',
      'Máquina de costura',
      'Máquina de lavar',
      'Micro-ondas',
      'Secadora de roupas',
    ],
  ],
];

export const SUB_JURIDICO: readonly GrupoServicos[] = [
  ['Jurídico', ['Advogado', 'Mediação de conflitos', 'Testamento e planejamento patrimonial']],
];

export const CATEGORIAS: readonly Categoria[] = [
  { chave: 'plugplay', nome: 'Mudança Plug & Play', icone: 'raio', taxaFixa: true },
  { chave: 'manutencao', nome: 'Reparos, reformas e outros serviços', icone: 'ferramenta', subservicos: SUB_REPAROS },
  { chave: 'assistencia', nome: 'Assistência técnica', icone: 'tomada', subservicos: SUB_ASSISTENCIA },
  { chave: 'mudanca', nome: 'Mudança e frete', icone: 'caixa' },
  { chave: 'limpeza', nome: 'Limpeza', icone: 'balde' },
  { chave: 'moveis', nome: 'Móveis planejados e montagem', icone: 'sofa' },
  { chave: 'clima', nome: 'Ar-condicionado', icone: 'neve' },
  { chave: 'seguranca', nome: 'Segurança e automação', icone: 'escudo' },
  { chave: 'jardim', nome: 'Jardim e piscina', icone: 'folha' },
  { chave: 'juridico', nome: 'Jurídico', icone: 'balanca', subservicos: SUB_JURIDICO },
  { chave: 'reforma', nome: 'Reforma e pintura', icone: 'pincel', oculta: true },
  { chave: 'administracao', nome: 'Alugar com a Elora', icone: 'chave', daElora: true },
];

const porChave = new Map(CATEGORIAS.map((c) => [c.chave, c]));
export const categoria = (chave: string): Categoria | undefined => porChave.get(chave as ChaveCategoria);

/** Advogado não pode pagar por indicação de clientes (Lei 8.906/94, art. 34, III e IV). */
export const CATEGORIAS_SEM_COMISSAO: ReadonlySet<ChaveCategoria> = new Set(['juridico']);
export const semComissao = (chave: string): boolean => CATEGORIAS_SEM_COMISSAO.has(chave as ChaveCategoria);
