import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

/** Mensagem curta no rodapé (#toast do protótipo). */
const Contexto = createContext<(texto: string) => void>(() => undefined);

export function ProvedorDeAvisos({ children }: { children: ReactNode }) {
  const [texto, setTexto] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const avisar = useCallback((t: string) => {
    setTexto(t);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setTexto(null), 3800);
  }, []);
  return (
    <Contexto.Provider value={avisar}>
      {children}
      <div id="toast" role="status" hidden={!texto}>
        {texto}
      </div>
    </Contexto.Provider>
  );
}

export const useAviso = () => useContext(Contexto);
