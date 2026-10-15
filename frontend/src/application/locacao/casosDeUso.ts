import type { ContratoLocacao, DadosContrato } from '@/domain/locacao/contrato';
import { validarContrato, validarReajuste, type ProblemaContrato } from '@/domain/locacao/regras';
import type { LocacaoRepositories } from '../ports/locacao';

/** Um ou mais problemas legais/de cadastro, para listar no formulário (caixa .erros do protótipo). */
export class ProblemasDoContratoError extends Error {
  constructor(readonly problemas: readonly ProblemaContrato[]) {
    super(problemas.map((p) => `${p.titulo}. ${p.msg}`).join(' '));
  }
}

const exigirSemProblemas = (ps: ProblemaContrato[]) => {
  if (ps.length) throw new ProblemasDoContratoError(ps);
};

/** Casos de uso da Locação. O back-end repete as validações e o banco tem as travas principais. */
export const casosDeUsoLocacao = (repos: LocacaoRepositories) => ({
  async salvarContrato(dados: DadosContrato, existentes: readonly ContratoLocacao[], id?: string) {
    const imovelJaAlugado = existentes.some(
      (o) => o.id !== id && o.imovelId === dados.imovelId && o.status === 'ativo',
    );
    exigirSemProblemas(validarContrato(dados, { novo: !id, imovelJaAlugado }));
    const limpos: DadosContrato = { ...dados, ...(dados.status === 'ativo' ? { encerradoEm: undefined } : {}) };
    return id ? repos.contratos.atualizar(id, limpos) : repos.contratos.criar(limpos);
  },

  async reajustar(contrato: ContratoLocacao, em: string, pct: number, novo: number) {
    exigirSemProblemas(validarReajuste(contrato, em, pct, novo));
    return repos.contratos.reajustar(contrato.id, { em, pct, para: Math.round(novo * 100) / 100 });
  },
});

export type CasosDeUsoLocacao = ReturnType<typeof casosDeUsoLocacao>;
