import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router';
import { env } from './config/env';
import { Provedores } from './app/providers';
import { rotas } from './app/rotas';
import './styles/index.css';

// Rotas no endereço (/locacao) em produção; no build de demonstração, no "#" (#/locacao).
const router = env.router === 'hash' ? createHashRouter(rotas) : createBrowserRouter(rotas);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provedores>
      <RouterProvider router={router} />
    </Provedores>
  </StrictMode>,
);
