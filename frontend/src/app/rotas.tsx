import { Navigate, type RouteObject } from 'react-router';
import { TeamLayout } from '@/presentation/layouts/TeamLayout';
import { LegacyScreen } from '@/presentation/pages/legacy/LegacyScreen';
import { Tela } from './Tela';

export const rotas: RouteObject[] = [
  { path: '/', element: <Navigate to="/central" replace /> },
  { path: '/app', element: <LegacyScreen tela="app" telaCheia /> },
  { path: '/:tela', element: <TeamLayout />, children: [{ index: true, element: <Tela /> }] },
];
