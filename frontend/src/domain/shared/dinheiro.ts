/**
 * Dinheiro em centavos (inteiros) para evitar erro de arredondamento.
 * Os valores vêm da API em reais com duas casas e são convertidos na borda.
 */
export type Centavos = number & { readonly __brand: 'Centavos' };

export const centavos = (reais: number): Centavos => Math.round((Number(reais) || 0) * 100) as Centavos;
export const emReais = (c: Centavos): number => c / 100;

const formatoBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** "R$ 1.500,00" — mesmo formato do protótipo. */
export const formatarBRL = (c: Centavos): string => formatoBRL.format(c / 100);
export const formatarReais = (reais: number): string => formatarBRL(centavos(reais));

/** Aplica um percentual e arredonda para o centavo (mesma regra do protótipo e do back-end). */
export const percentualDe = (valor: Centavos, pct: number): Centavos =>
  Math.round((valor * (Number(pct) || 0)) / 100) as Centavos;

/** "30%", "12,5%" */
export const formatarPct = (n: number): string => `${(+n).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
