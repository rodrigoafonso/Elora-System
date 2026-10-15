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
