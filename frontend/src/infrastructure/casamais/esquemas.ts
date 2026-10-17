import { z } from 'zod';

/** Validação das respostas da API na borda: o resto do código confia nos tipos do domínio. */
const categoria = z.enum([
  'plugplay',
  'manutencao',
  'assistencia',
  'mudanca',
  'limpeza',
  'moveis',
  'clima',
  'seguranca',
  'jardim',
  'juridico',
  'reforma',
  'administracao',
]);

export const pedidoSchema = z.object({
  id: z.string(),
  categoria,
  subservico: z.string().optional(),
  urgente: z.boolean().optional(),
  parceiroId: z.string().optional(),
  cliente: z.object({
    perfil: z.enum(['proprietario', 'inquilino', 'comprador', 'empresa']),
    referencia: z.string(),
    nome: z.string(),
    telefone: z.string().optional(),
  }),
  imovelId: z.string().optional(),
  corretorId: z.string().optional(),
  corretorNome: z.string().optional(),
  descricao: z.string(),
  preferenciaEm: z.string().optional(),
  status: z.enum(['pedido', 'orcamento', 'aprovado', 'executado', 'cancelado']),
  criadoEm: z.string(),
  aprovadoEm: z.string().optional(),
  executadoEm: z.string().optional(),
  orcamento: z
    .object({ valor: z.number(), prazo: z.string().optional(), observacao: z.string().optional(), em: z.string() })
    .optional(),
  margemPct: z.number().optional(),
  margemRecebida: z.number().optional(),
  recebidaEm: z.string().optional(),
  corretorPct: z.number().optional(),
  fundoPct: z.number().optional(),
  avaliacao: z.object({ nota: z.number(), comentario: z.string().optional(), em: z.string() }).optional(),
  pacoteId: z.string().optional(),
});

export const parceiroSchema = z.object({
  id: z.string(),
  nome: z.string(),
  categorias: z.array(categoria),
  comissaoPct: z.number(),
  whatsapp: z.string().optional(),
  cidades: z.string().optional(),
  prazo: z.string().optional(),
  apresentacao: z.string().optional(),
  ativo: z.boolean(),
});

export const regrasSchema = z.object({
  corretorPct: z.number(),
  fundoBoaIdeiaPct: z.number(),
  taxaPlugPlay: z.number(),
});

export const jornadaSchema = z.object({
  perfil: z.enum(['proprietario', 'inquilino', 'comprador']),
  referencia: z.string(),
  nome: z.string(),
  telefone: z.string().optional(),
  imovelId: z.string().optional(),
  corretorId: z.string().optional(),
  corretorNome: z.string().optional(),
  desde: z.string(),
  rotulo: z.enum(['Comprou', 'Alugou']),
  pedidos: z.number(),
});

const itemPacote = z.enum(['plugplay', 'limpeza', 'mudanca', 'montagem', 'instalacao', 'clima', 'guia']);

export const empresaSchema = z.object({
  id: z.string(),
  nome: z.string(),
  cidade: z.string().optional(),
  contato: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  auxilio: z.string().optional(),
  observacao: z.string().optional(),
});

export const pacoteSchema = z.object({
  id: z.string(),
  tipo: z.literal('chegada'),
  cliente: pedidoSchema.shape.cliente,
  empresaId: z.string().optional(),
  imovelId: z.string().optional(),
  corretorId: z.string().optional(),
  corretorNome: z.string().optional(),
  data: z.string(),
  origem: z.string().optional(),
  pessoas: z.number(),
  pet: z.boolean(),
  observacao: z.string().optional(),
  buscaImovel: z.enum(['Locação', 'Compra']).optional(),
  itens: z.array(itemPacote),
  pedidos: z.array(z.string()),
  guiaEnviadoEm: z.string().optional(),
  criadoEm: z.string(),
});
