import { z } from 'zod';
import { ProblemasDoContratoError } from '@/application/locacao/casosDeUso';
import type { LocacaoRepositories } from '@/application/ports/locacao';
import type { ContratoLocacao } from '@/domain/locacao/contrato';
import { ApiError, http } from '../http/httpClient';
import { contratoSchema, imovelResumoSchema, pessoaResumoSchema } from './esquemas';

const base = '/locacao';

const problemaSchema = z.object({ art: z.string(), titulo: z.string(), msg: z.string() });

/** Converte o 422 com "problemas" da API no mesmo erro que o caso de uso lança (o formulário mostra a lista). */
async function contrato(p: Promise<unknown>): Promise<ContratoLocacao> {
  try {
    return contratoSchema.parse(await p) as ContratoLocacao;
  } catch (e) {
    const lista = e instanceof ApiError ? z.array(problemaSchema).safeParse(e.corpo.problemas) : null;
    if (lista?.success && lista.data.length) throw new ProblemasDoContratoError(lista.data);
    throw e;
  }
}

/** Locação sobre a API REST do back-end. */
export const locacaoHttp: LocacaoRepositories = {
  contratos: {
    listar: async () => z.array(contratoSchema).parse(await http('GET', `${base}/contratos`)) as ContratoLocacao[],
    criar: (dados) => contrato(http('POST', `${base}/contratos`, dados)),
    atualizar: (id, dados) => contrato(http('PUT', `${base}/contratos/${id}`, dados)),
    reajustar: (id, r) => contrato(http('POST', `${base}/contratos/${id}/reajustes`, r)),
  },
  cadastros: {
    imoveis: async () => z.array(imovelResumoSchema).parse(await http('GET', `${base}/imoveis`)),
    locatarios: async () => z.array(pessoaResumoSchema).parse(await http('GET', `${base}/locatarios`)),
    corretores: async () => z.array(pessoaResumoSchema).parse(await http('GET', `${base}/corretores`)),
  },
};
