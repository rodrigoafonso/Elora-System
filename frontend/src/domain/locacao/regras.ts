import { diasEntre, formatarData, mesesEntre, somaMeses, type DataISO } from '../shared/datas';
import { DOCS, INDICES, type ChaveDocumento, type ContratoLocacao, type DadosContrato } from './contrato';

/** Problema legal ou de cadastro, com a lei de origem (mostrada ao lado da mensagem). */
export interface ProblemaContrato {
  readonly art: string;
  readonly titulo: string;
  readonly msg: string;
}

export interface ContextoValidacao {
  /** Contrato novo (cadastro) ou edição. */
  readonly novo: boolean;
  /** Já existe outro contrato ativo para o mesmo imóvel. */
  readonly imovelJaAlugado: boolean;
  /** Política da imobiliária: só seguro-fiança em contratos novos. */
  readonly soSeguroFianca?: boolean;
}

/** Travas da Lei 8.245/91 aplicadas no cadastro (mesmas do protótipo; o banco repete as principais). */
export function validarContrato(c: DadosContrato, ctx: ContextoValidacao): ProblemaContrato[] {
  const e: ProblemaContrato[] = [];
  const add = (art: string, titulo: string, msg: string) => e.push({ art, titulo, msg });
  if (!c.imovelId) add('', 'Campo obrigatório', 'Imóvel');
  if (!c.locatarioId) add('', 'Campo obrigatório', 'Locatário');
  if (!(c.aluguel > 0)) add('', 'Campo obrigatório', 'Aluguel (R$)');
  if (!c.inicio || !c.fim || c.fim <= c.inicio) {
    add('', 'Prazo inválido', 'A data final precisa ser posterior à inicial.');
    return e;
  }
  if (!(c.indice in INDICES))
    add(
      'Lei 8.245/91, art. 17',
      'Índice de reajuste não permitido',
      'O aluguel não pode ser vinculado ao salário mínimo, à variação cambial ou a moeda estrangeira.',
    );
  if (c.garantia === 'caucao_dinheiro' && !((c.caucao ?? 0) > 0))
    add(
      'Lei 8.245/91, art. 38, § 2º',
      'Informe o valor da caução',
      'A caução em dinheiro precisa de valor, limitado a três aluguéis.',
    );
  if (c.garantia === 'caucao_dinheiro' && (c.caucao ?? 0) > 3 * c.aluguel)
    add(
      'Lei 8.245/91, art. 38, § 2º',
      'Caução acima de três aluguéis',
      `A caução informada equivale a ${((c.caucao ?? 0) / c.aluguel).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} aluguéis. O limite é o equivalente a três meses.`,
    );
  if (c.antecipada && c.garantia !== 'nenhuma')
    add(
      'Lei 8.245/91, arts. 20 e 43, III',
      'Cobrança antecipada com garantia',
      'Aluguel antecipado só é admitido em contrato sem garantia.',
    );
  if (c.status === 'ativo' && mesesEntre(c.inicio, c.fim) >= 120 && c.venia === 'pendente')
    add(
      'Lei 8.245/91, art. 3º',
      'Falta a vênia conjugal',
      'Contrato de dez anos ou mais depende de vênia conjugal. Registre a vênia ou marque que não se aplica.',
    );
  if (ctx.soSeguroFianca && ctx.novo && c.garantia !== 'seguro_fianca')
    add(
      '',
      'Garantia fora da política da Elora',
      'A política atual aceita apenas seguro-fiança em contratos novos. Ela pode ser alterada em Jurídico.',
    );
  if (c.status === 'ativo' && ctx.imovelJaAlugado)
    add('', 'Imóvel já alugado', 'Este imóvel já tem um contrato ativo. Encerre o anterior antes de ativar outro.');
  if (c.status !== 'ativo' && !c.encerradoEm) add('', 'Campo obrigatório', 'Data de encerramento');
  return e;
}

export const ultimoReajuste = (c: Pick<ContratoLocacao, 'reajustes'>): DataISO | null =>
  c.reajustes
    .map((r) => r.em)
    .filter(Boolean)
    .sort()
    .pop() ?? null;

/** Último aniversário já vencido e o próximo. */
export function aniversarios(inicio: DataISO, hoje: DataISO): { ant: DataISO | null; prox: DataISO } {
  let n = 1;
  let ant: DataISO | null = null;
  while (somaMeses(inicio, 12 * n) <= hoje) {
    ant = somaMeses(inicio, 12 * n);
    n++;
  }
  return { ant, prox: somaMeses(inicio, 12 * n) };
}

/** Aniversário dos últimos 90 dias ainda sem reajuste aplicado. */
export function reajustePendente(c: ContratoLocacao, hoje: DataISO): DataISO | null {
  if (c.status !== 'ativo') return null;
  const { ant } = aniversarios(c.inicio, hoje);
  const ult = ultimoReajuste(c) ?? '';
  return ant && diasEntre(ant, hoje) <= 90 && !(ult >= ant) ? ant : null;
}

/** Data sugerida para o próximo reajuste (o pendente, ou o próximo aniversário). */
export function dataSugeridaDeReajuste(c: ContratoLocacao, hoje: DataISO): DataISO {
  const pend = reajustePendente(c, hoje);
  const { ant, prox } = aniversarios(c.inicio, hoje);
  return pend ?? (ant && !((ultimoReajuste(c) ?? '') >= ant) ? ant : prox);
}

/** Lei 10.192/2001, art. 2º, § 1º: periodicidade mínima anual. */
export function validarReajuste(c: ContratoLocacao, em: DataISO, pct: number, novo: number): ProblemaContrato[] {
  const base = ultimoReajuste(c) ?? c.inicio;
  if (!em || !(novo > 0) || !Number.isFinite(pct))
    return [{ art: '', titulo: 'Dados do reajuste', msg: 'Informe a data, a variação do índice e o novo aluguel.' }];
  const e: ProblemaContrato[] = [];
  if (em < somaMeses(base, 12))
    e.push({
      art: 'Lei 10.192/2001, art. 2º, § 1º',
      titulo: 'Reajuste antes de um ano',
      msg: `O último marco é ${formatarData(base)}. O aluguel só pode ser reajustado a partir de ${formatarData(somaMeses(base, 12))}.`,
    });
  if (pct < -30 || pct > 60)
    e.push({
      art: '',
      titulo: 'Variação fora do esperado',
      msg: 'Confira a variação acumulada do índice nos doze meses.',
    });
  return e;
}

/** Novo aluguel calculado pela variação, em reais com 2 casas. */
export const aluguelReajustado = (aluguel: number, pct: number): number =>
  Math.round(aluguel * (1 + pct / 100) * 100) / 100;

/** Documentos exigidos (o comprovante de garantia só quando há garantia) e quantos estão arquivados. */
export function documentosDoContrato(c: DadosContrato): { exigidos: ChaveDocumento[]; arquivados: number } {
  const exigidos = (Object.keys(DOCS) as ChaveDocumento[]).filter(
    (k) => !(k === 'docGarantia' && c.garantia === 'nenhuma'),
  );
  return { exigidos, arquivados: exigidos.filter((k) => c[k]).length };
}
