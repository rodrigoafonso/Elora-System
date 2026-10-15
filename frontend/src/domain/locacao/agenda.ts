import { diasEntre, formatarData, mesesEntre, somaMeses, type DataISO } from '../shared/datas';
import { INDICES, rotuloContrato, type ContratoLocacao } from './contrato';

export type Severidade = 'bloqueio' | 'atencao' | 'pendente' | 'info';
export const SEV: Record<Severidade, readonly [classe: string, rotulo: string]> = {
  bloqueio: ['bad', 'Bloqueado'],
  atencao: ['warn', 'Atenção'],
  pendente: ['gold', 'Pendente'],
  info: ['', 'Informativo'],
};

export interface EventoAgenda {
  readonly data: DataISO;
  readonly sev: Severidade;
  readonly titulo: string;
  readonly detalhe: string;
  readonly lei: string;
  readonly contratoId: string;
}

/**
 * Prazos legais dos contratos ativos nos próximos n dias (agenda() do protótipo):
 * reajuste anual, fim do prazo (arts. 46, 47 e 56), prorrogação e janela da ação renovatória (art. 51, § 5º).
 */
export function agendaLegal(contratos: readonly ContratoLocacao[], hoje: DataISO, n = 120): EventoAgenda[] {
  const ev: EventoAgenda[] = [];
  for (const c of contratos) {
    if (c.status !== 'ativo') continue;
    const nome = rotuloContrato(c);
    const prazo = mesesEntre(c.inicio, c.fim);
    const add = (data: DataISO, sev: Severidade, titulo: string, detalhe: string, lei: string) =>
      ev.push({ data, sev, titulo, detalhe, lei, contratoId: c.id });

    // Seguro do imóvel: precisa estar em vigor durante todo o contrato (política da Elora).
    const POLITICA = 'Política da Elora · seguro do imóvel';
    if (!c.seguroImovelFim)
      add(
        hoje,
        'pendente',
        'Seguro do imóvel não informado',
        `${nome}: pergunte ao cliente a seguradora e a vigência do seguro do imóvel.`,
        POLITICA,
      );
    else if (c.seguroImovelFim < hoje)
      add(
        c.seguroImovelFim,
        'bloqueio',
        'Seguro do imóvel vencido',
        `${nome}: o seguro venceu em ${formatarData(c.seguroImovelFim)}. Peça ao cliente a renovação e a nova apólice.`,
        POLITICA,
      );
    else if (diasEntre(hoje, c.seguroImovelFim) <= n)
      add(
        c.seguroImovelFim,
        diasEntre(hoje, c.seguroImovelFim) <= 30 ? 'atencao' : 'info',
        'Renovar o seguro do imóvel',
        `${nome}: o seguro vale até ${formatarData(c.seguroImovelFim)}${c.seguroImovelSeguradora ? ` (${c.seguroImovelSeguradora})` : ''}. Combine a renovação com o cliente antes do vencimento.`,
        POLITICA,
      );

    let aniv = c.inicio;
    while (aniv < hoje) aniv = somaMeses(aniv, 12);
    if (diasEntre(hoje, aniv) <= n)
      add(
        aniv,
        diasEntre(hoje, aniv) <= 45 ? 'atencao' : 'info',
        'Reajuste anual',
        `${nome}: aniversário do contrato em ${formatarData(aniv)}, reajuste pelo ${INDICES[c.indice]}.`,
        'Lei 10.192/2001, art. 2º, § 1º',
      );

    if (c.fim < hoje)
      add(
        c.fim,
        'info',
        'Contrato por prazo indeterminado',
        `${nome}: o prazo terminou em ${formatarData(c.fim)} e a locação segue prorrogada nas mesmas condições.`,
        c.tipo === 'residencial' ? 'Lei 8.245/91, arts. 46, § 1º, e 47' : 'Lei 8.245/91, art. 56, parágrafo único',
      );
    else if (diasEntre(hoje, c.fim) <= n)
      add(
        c.fim,
        'atencao',
        'Fim do prazo do contrato',
        `${nome}: termina em ${formatarData(c.fim)}. ` +
          (c.tipo === 'residencial'
            ? prazo >= 30
              ? 'Com trinta meses ou mais, a locação termina no prazo; se o locatário ficar mais de trinta dias sem oposição, prorroga-se.'
              : 'Com menos de trinta meses, a locação se prorroga por tempo indeterminado e a retomada fica restrita.'
            : 'Se o locatário permanecer por mais de trinta dias sem oposição, a locação segue sem prazo determinado.'),
        c.tipo === 'residencial'
          ? prazo >= 30
            ? 'Lei 8.245/91, art. 46'
            : 'Lei 8.245/91, art. 47'
          : 'Lei 8.245/91, art. 56',
      );

    if (c.tipo === 'nao_residencial' && prazo >= 60 && c.fim >= hoje) {
      const abre = somaMeses(c.fim, -12);
      const fecha = somaMeses(c.fim, -6);
      if (hoje >= abre && hoje <= fecha)
        add(
          fecha,
          'atencao',
          'Janela da ação renovatória aberta',
          `${nome}: o contrato termina em ${formatarData(c.fim)}. O locatário perde o direito à renovação se não propuser a ação até ${formatarData(fecha)} (faltam ${diasEntre(hoje, fecha)} dias).`,
          'Lei 8.245/91, art. 51, § 5º',
        );
      else if (hoje < abre && diasEntre(hoje, abre) <= n)
        add(
          abre,
          'info',
          'Janela da ação renovatória vai abrir',
          `${nome}: de ${formatarData(abre)} a ${formatarData(fecha)}.`,
          'Lei 8.245/91, art. 51, § 5º',
        );
    }
  }
  return ev.sort((a, b) => (a.data < b.data ? -1 : 1));
}
