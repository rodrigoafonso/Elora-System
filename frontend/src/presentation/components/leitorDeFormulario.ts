/** Leitura tipada do FormData. */
export const leitor = (f: FormData) => ({
  texto: (k: string) => String(f.get(k) ?? '').trim(),
  numero: (k: string) => {
    const v = String(f.get(k) ?? '').trim();
    return v === '' ? undefined : parseFloat(v);
  },
  marcado: (k: string) => f.get(k) === 'on',
});
