/** Datas no formato ISO (aaaa-mm-dd). */
export type DataISO = string;

export const formatarData = (s?: string | null): string =>
  s && /^\d{4}-\d{2}-\d{2}/.test(s) ? `${s.slice(8, 10)}/${s.slice(5, 7)}/${s.slice(0, 4)}` : '—';

/** "dd/mm" para legendas curtas (trilha). */
export const diaMes = (s?: string | null): string => (s ? formatarData(String(s).slice(0, 10)).slice(0, 5) : '');

const utc = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00Z`).getTime();

/** Dias corridos de a até b (b - a). */
export const diasEntre = (a: string, b: string): number => Math.round((utc(b) - utc(a)) / 864e5);

export const hojeISO = (agora: Date = new Date()): DataISO => {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
};

const dt = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00Z`);
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Soma n meses mantendo o dia (ou o último dia do mês, se não existir). Igual ao protótipo. */
export const somaMeses = (s: string, n: number): DataISO => {
  const d = dt(s);
  const dia = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + n);
  const ultimo = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(dia, ultimo));
  return iso(d);
};

/** Meses completos de a até b, contando o dia final (prazo do contrato). */
export const mesesEntre = (a: string, b: string): number => {
  const x = dt(a);
  const y = dt(b);
  y.setUTCDate(y.getUTCDate() + 1);
  return (
    (y.getUTCFullYear() - x.getUTCFullYear()) * 12 +
    y.getUTCMonth() -
    x.getUTCMonth() -
    (y.getUTCDate() < x.getUTCDate() ? 1 : 0)
  );
};

/** Soma n dias corridos. */
export const somaDias = (s: string, n: number): DataISO => {
  const d = dt(s);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
