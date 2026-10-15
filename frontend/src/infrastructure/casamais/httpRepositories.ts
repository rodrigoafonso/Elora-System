import { z } from 'zod';
import type { CasaMaisRepositories } from '@/application/ports/casamais';
import type { ClienteEmJornada, Parceiro, PedidoServico, RegrasCasaMais } from '@/domain/casamais/pedido';
import { http } from '../http/httpClient';
import { jornadaSchema, parceiroSchema, pedidoSchema, regrasSchema } from './esquemas';

const base = '/casamais';
const pedido = async (p: Promise<unknown>) => pedidoSchema.parse(await p) as PedidoServico;

/** Implementação das portas do Elora Casa+ sobre a API REST do back-end. */
export const casaMaisHttp: CasaMaisRepositories = {
  pedidos: {
    listar: async () => z.array(pedidoSchema).parse(await http('GET', `${base}/pedidos`)) as PedidoServico[],
    registrar: (dados) => pedido(http('POST', `${base}/pedidos`, dados)),
    registrarOrcamento: ({ pedidoId, ...corpo }) =>
      pedido(http('POST', `${base}/pedidos/${pedidoId}/orcamento`, corpo)),
    registrarAprovacao: (id) => pedido(http('POST', `${base}/pedidos/${id}/aprovacao`, {})),
    registrarConclusao: (id) => pedido(http('POST', `${base}/pedidos/${id}/conclusao`, {})),
    registrarMargem: ({ pedidoId, ...corpo }) => pedido(http('POST', `${base}/pedidos/${pedidoId}/margem`, corpo)),
    cancelar: (id, motivo) => pedido(http('POST', `${base}/pedidos/${id}/cancelamento`, { motivo })),
  },
  parceiros: {
    listar: async () => z.array(parceiroSchema).parse(await http('GET', `${base}/parceiros`)) as Parceiro[],
    salvar: async ({ id, ...dados }) =>
      parceiroSchema.parse(
        await http(id ? 'PUT' : 'POST', id ? `${base}/parceiros/${id}` : `${base}/parceiros`, dados),
      ) as Parceiro,
  },
  regras: {
    obter: async () => regrasSchema.parse(await http('GET', `${base}/regras`)) as RegrasCasaMais,
    salvar: async (r) => regrasSchema.parse(await http('PUT', `${base}/regras`, r)) as RegrasCasaMais,
  },
  jornadas: {
    listar: async () => z.array(jornadaSchema).parse(await http('GET', `${base}/jornadas`)) as ClienteEmJornada[],
  },
};
