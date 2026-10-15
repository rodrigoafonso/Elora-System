import { createContext, useContext, type ReactNode } from 'react';
import type { Container } from '@/infrastructure/di/container';

/**
 * Disponibiliza as dependências (repositórios e casos de uso) para as telas.
 * Nos testes, basta montar a tela com outro container (ex.: repositórios em memória).
 */
const Contexto = createContext<Container | null>(null);

export const ProvedorDeDependencias = ({ container, children }: { container: Container; children: ReactNode }) => (
  <Contexto.Provider value={container}>{children}</Contexto.Provider>
);

export function useDependencias(): Container {
  const c = useContext(Contexto);
  if (!c) throw new Error('ProvedorDeDependencias ausente.');
  return c;
}
