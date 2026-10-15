import type { ComponentType } from 'react';
import { Navigate, useParams } from 'react-router';
import { todasAsTelas } from '@/presentation/navigation/menu';
import { CasaMaisPage } from '@/presentation/pages/casamais/CasaMaisPage';
import { LegacyScreen } from '@/presentation/pages/legacy/LegacyScreen';

/**
 * Telas já migradas para React. Para migrar uma tela:
 * 1) crie a página em presentation/pages/<tela>; 2) registre aqui; 3) marque "migrada" no menu;
 * 4) atualize docs/MIGRACAO.md.
 */
const TELAS_MIGRADAS: Record<string, ComponentType> = {
  posvenda: CasaMaisPage,
};

const TELAS_CONHECIDAS = new Set([...todasAsTelas('equipe'), ...todasAsTelas('corretor')].map((i) => i.id));

export function Tela() {
  const { tela = 'central' } = useParams();
  const Migrada = TELAS_MIGRADAS[tela];
  if (Migrada) return <Migrada />;
  // Telas fora do menu (ex.: "quem") também existem no protótipo; as desconhecidas voltam ao Dashboard.
  if (!TELAS_CONHECIDAS.has(tela) && !/^[a-z0-9-]{2,30}$/.test(tela)) return <Navigate to="/central" replace />;
  return <LegacyScreen tela={tela} />;
}
