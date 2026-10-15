import type { CasaMaisRepositories } from '@/application/ports/casamais';
import { semComissao } from '@/domain/casamais/categorias';
import {
  REGRAS_PADRAO,
  type ClienteEmJornada,
  type Parceiro,
  type PedidoServico,
  type RegrasCasaMais,
} from '@/domain/casamais/pedido';
import { hojeISO } from '@/domain/shared/datas';

/**
 * Repositórios em memória com dados de exemplo (fictícios), para desenvolver o front-end sem o back-end
 * e para testes. Ativados com VITE_DATA_SOURCE=mock. Reproduzem as regras do servidor.
 */
const PARCEIROS: Parceiro[] = [
  {
    id: 'PA-1',
    nome: 'Mudanças Vale (exemplo)',
    categorias: ['mudanca'],
    comissaoPct: 12,
    whatsapp: '12999990000',
    prazo: 'Orçamento em 24 h',
    cidades: 'São José dos Campos, Jacareí',
    ativo: true,
  },
  {
    id: 'PA-2',
    nome: 'Brilho Limpezas (exemplo)',
    categorias: ['limpeza'],
    comissaoPct: 10,
    whatsapp: '12988887777',
    ativo: true,
  },
  {
    id: 'PA-3',
    nome: 'Hidráulica Paraíba (exemplo)',
    categorias: ['manutencao'],
    comissaoPct: 10,
    whatsapp: '12977776666',
    prazo: 'Atende urgência',
    ativo: true,
  },
];

const PEDIDOS: PedidoServico[] = [
  {
    id: 'SV-1',
    categoria: 'manutencao',
    subservico: 'Encanador (urgência)',
    urgente: true,
    cliente: { perfil: 'inquilino', referencia: 'C-0101', nome: 'Bruna Teles', telefone: '12991234567' },
    imovelId: 'EL-0101',
    corretorId: 'caio',
    corretorNome: 'Caio Bittencourt',
    descricao: 'Vazamento embaixo da pia da cozinha',
    status: 'pedido',
    criadoEm: '2026-10-14T09:12:00Z',
  },
  {
    id: 'SV-2',
    categoria: 'mudanca',
    parceiroId: 'PA-1',
    cliente: { perfil: 'comprador', referencia: 'EL-0117', nome: 'Tatiana Moura', telefone: '12990001111' },
    imovelId: 'EL-0117',
    corretorId: 'caio',
    corretorNome: 'Caio Bittencourt',
    descricao: 'Mudança de apartamento de 2 dormitórios',
    status: 'orcamento',
    criadoEm: '2026-10-10T13:00:00Z',
    orcamento: { valor: 1500, prazo: 'dia 20', em: '2026-10-11' },
    margemPct: 12,
  },
  {
    id: 'SV-3',
    categoria: 'limpeza',
    parceiroId: 'PA-2',
    cliente: { perfil: 'inquilino', referencia: 'C-0107', nome: 'Componentes Mantiqueira S.A.' },
    imovelId: 'EL-0107',
    corretorId: 'helena',
    corretorNome: 'Helena Sakamoto',
    descricao: 'Limpeza de entrada no galpão',
    status: 'executado',
    criadoEm: '2026-09-03T10:00:00Z',
    aprovadoEm: '2026-09-04',
    executadoEm: '2026-09-08',
    orcamento: { valor: 1800, em: '2026-09-03' },
    margemPct: 10,
    margemRecebida: 180,
    recebidaEm: '2026-09-20',
    corretorPct: 30,
    fundoPct: 10,
    avaliacao: { nota: 9, em: '2026-09-09' },
  },
];

const JORNADAS: ClienteEmJornada[] = [
  {
    perfil: 'comprador',
    referencia: 'EL-0117',
    nome: 'Tatiana Moura',
    telefone: '12990001111',
    imovelId: 'EL-0117',
    corretorId: 'caio',
    corretorNome: 'Caio Bittencourt',
    desde: '2026-09-18',
    rotulo: 'Comprou',
    pedidos: 1,
  },
  {
    perfil: 'inquilino',
    referencia: 'C-0107',
    nome: 'Componentes Mantiqueira S.A.',
    imovelId: 'EL-0107',
    corretorId: 'helena',
    corretorNome: 'Helena Sakamoto',
    desde: '2026-09-01',
    rotulo: 'Alugou',
    pedidos: 1,
  },
];

export function criarCasaMaisMemoria(semente?: {
  pedidos?: PedidoServico[];
  parceiros?: Parceiro[];
  regras?: RegrasCasaMais;
}): CasaMaisRepositories {
  let pedidos = structuredClone(semente?.pedidos ?? PEDIDOS);
  let parceiros = structuredClone(semente?.parceiros ?? PARCEIROS);
  let regras = { ...(semente?.regras ?? REGRAS_PADRAO) };
  const atualizar = (id: string, f: (p: PedidoServico) => PedidoServico) => {
    const atual = pedidos.find((p) => p.id === id);
    if (!atual) throw new Error('Pedido não encontrado.');
    const novo = f(atual);
    pedidos = pedidos.map((p) => (p.id === id ? novo : p));
    return Promise.resolve(structuredClone(novo));
  };
  return {
    pedidos: {
      listar: () => Promise.resolve(structuredClone(pedidos)),
      registrar: (dados) => {
        const j = JORNADAS.find((x) => x.perfil === dados.cliente.perfil && x.referencia === dados.cliente.referencia);
        const novo: PedidoServico = {
          id: `SV-${Date.now().toString(36)}`,
          categoria: dados.categoria,
          ...(dados.subservico ? { subservico: dados.subservico } : {}),
          urgente: dados.urgente,
          cliente: { ...dados.cliente, nome: j?.nome ?? 'Cliente', ...(j?.telefone ? { telefone: j.telefone } : {}) },
          ...(j?.imovelId ? { imovelId: j.imovelId } : {}),
          ...(j?.corretorId ? { corretorId: j.corretorId, corretorNome: j.corretorNome } : {}),
          descricao: dados.descricao,
          ...(dados.preferenciaEm ? { preferenciaEm: dados.preferenciaEm } : {}),
          status: 'pedido',
          criadoEm: new Date().toISOString(),
        };
        pedidos = [novo, ...pedidos];
        return Promise.resolve(structuredClone(novo));
      },
      registrarOrcamento: ({ pedidoId, parceiroId, valor, prazo, observacao }) =>
        atualizar(pedidoId, (p) => {
          const parc = parceiros.find((x) => x.id === parceiroId);
          if (!parc) throw new Error('Parceiro não encontrado.');
          return {
            ...p,
            status: 'orcamento',
            parceiroId,
            margemPct: semComissao(p.categoria) ? 0 : parc.comissaoPct,
            orcamento: { valor, em: hojeISO(), ...(prazo ? { prazo } : {}), ...(observacao ? { observacao } : {}) },
          };
        }),
      registrarAprovacao: (id) => atualizar(id, (p) => ({ ...p, status: 'aprovado', aprovadoEm: hojeISO() })),
      registrarConclusao: (id) => atualizar(id, (p) => ({ ...p, status: 'executado', executadoEm: hojeISO() })),
      registrarMargem: ({ pedidoId, valor, recebidaEm }) =>
        atualizar(pedidoId, (p) => ({
          ...p,
          margemRecebida: valor,
          recebidaEm,
          fundoPct: regras.fundoBoaIdeiaPct,
          corretorPct: p.corretorId ? regras.corretorPct : 0,
        })),
      cancelar: (id) => atualizar(id, (p) => ({ ...p, status: 'cancelado' })),
    },
    parceiros: {
      listar: () => Promise.resolve(structuredClone(parceiros)),
      salvar: (p) => {
        const salvo: Parceiro = { ...p, id: p.id ?? `PA-${Date.now().toString(36)}` };
        parceiros = parceiros.some((x) => x.id === salvo.id)
          ? parceiros.map((x) => (x.id === salvo.id ? salvo : x))
          : [...parceiros, salvo];
        return Promise.resolve(structuredClone(salvo));
      },
    },
    regras: {
      obter: () => Promise.resolve({ ...regras }),
      salvar: (r) => {
        regras = { ...r };
        return Promise.resolve({ ...regras });
      },
    },
    jornadas: { listar: () => Promise.resolve(structuredClone(JORNADAS)) },
  };
}
