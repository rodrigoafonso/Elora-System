/** Preferências do navegador (pastas recolhidas etc.). Falhas de armazenamento são ignoradas. */
const PREFIXO = 'elora.';

export const lerPreferencia = (chave: string): string | null => {
  try {
    return localStorage.getItem(PREFIXO + chave);
  } catch {
    return null;
  }
};

export const gravarPreferencia = (chave: string, valor: string): void => {
  try {
    localStorage.setItem(PREFIXO + chave, valor);
  } catch {
    /* armazenamento indisponível: segue sem lembrar */
  }
};
