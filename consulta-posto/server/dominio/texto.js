// Funções puras de texto, CNPJ e geografia. Sem dependência de I/O.

/** Remove acentos, caixa e espaços extras para comparar textos. */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Mantém só os dígitos. */
export function apenasDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/** Formata 14 dígitos como 00.000.000/0000-00. Devolve o texto original se não tiver 14 dígitos. */
export function formatarCnpj(cnpj) {
  const d = apenasDigitos(cnpj);
  if (d.length !== 14) return cnpj ?? null;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Valida os dígitos verificadores de um CNPJ numérico. */
export function cnpjValido(cnpj) {
  const d = apenasDigitos(cnpj);
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = base.split('').reduce((acc, n, i) => acc + Number(n) * pesos[i], 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const dv1 = calc(d.slice(0, 12));
  const dv2 = calc(d.slice(0, 12) + dv1);
  return d.endsWith(`${dv1}${dv2}`);
}

/** Uma busca é tratada como CNPJ quando tem 8 a 14 dígitos e quase nenhuma letra. */
export function pareceCnpj(termo) {
  const t = String(termo ?? '');
  const digitos = apenasDigitos(t);
  return digitos.length >= 8 && digitos.length <= 14 && !/[a-z]/i.test(t);
}

/** Distância em km entre dois pontos (fórmula de haversine). */
export function distanciaKm(a, b) {
  const rad = (g) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export function coordenadaValida(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
}

/** Data ISO (AAAA-MM-DD) válida? */
export function dataIsoValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto ?? ''))) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(texto);
}

/** Converte datas comuns em planilhas brasileiras (DD/MM/AAAA) para ISO. */
export function paraDataIso(texto) {
  const t = String(texto ?? '').trim();
  if (dataIsoValida(t.slice(0, 10))) return t.slice(0, 10);
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return dataIsoValida(iso) ? iso : null;
}

/** Converte número com vírgula decimal ("-23,55") em Number. */
export function paraNumero(texto) {
  if (typeof texto === 'number') return texto;
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
