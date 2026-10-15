import { z } from 'zod';
import type { LocacaoRepositories } from '@/application/ports/locacao';
import type { ContratoLocacao } from '@/domain/locacao/contrato';
import { http } from '../http/httpClient';
import { contratoSchema, imovelResumoSchema, pessoaResumoSchema } from './esquemas';

const base = '/locacao';
const contrato = async (p: Promise<unknown>) => contratoSchema.parse(await p) as ContratoLocacao;

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
