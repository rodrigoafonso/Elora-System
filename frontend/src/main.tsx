import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { Provedores } from './app/providers';
import { rotas } from './app/rotas';
import './styles/index.css';

const router = createBrowserRouter(rotas);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provedores>
      <RouterProvider router={router} />
    </Provedores>
  </StrictMode>,
);
