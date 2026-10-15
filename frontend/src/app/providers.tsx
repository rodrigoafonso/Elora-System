import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { criarContainer, type Container } from '@/infrastructure/di/container';
import { ProvedorDeAvisos } from '@/presentation/components/Avisos';
import { ProvedorDeDependencias } from '@/presentation/providers/ContainerContext';

/** Provedores globais: dependências (DI), cache de dados (react-query) e avisos (#toast). */
export function Provedores({ children, container }: { children: ReactNode; container?: Container }) {
  const [c] = useState(() => container ?? criarContainer());
  const [clienteDeDados] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } }),
  );
  return (
    <ProvedorDeDependencias container={c}>
      <QueryClientProvider client={clienteDeDados}>
        <ProvedorDeAvisos>{children}</ProvedorDeAvisos>
      </QueryClientProvider>
    </ProvedorDeDependencias>
  );
}
