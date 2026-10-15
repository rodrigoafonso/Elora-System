import { passoAtual, type Passo } from '@/domain/shared/trilha';

/** Trilha de andamento: pontos ligados por linhas (mesmo markup do protótipo). */
export function Trilha({ passos, compacta = false }: { passos: readonly Passo[]; compacta?: boolean }) {
  const agora = passoAtual(passos);
  const rotulo = agora ? `Andamento: ${agora.titulo}${agora.detalhe ? `, ${agora.detalhe}` : ''}` : 'Andamento';
  return (
    <ol className={`trilha${compacta ? ' min' : ''}`} aria-label={rotulo}>
      {passos.map((p) => (
        <li
          key={p.titulo}
          className={p.estado}
          aria-current={p.estado === 'meio' || p.estado === 'bad' ? 'step' : undefined}
        >
          <b>{p.titulo}</b>
          {p.detalhe ? <span>{p.detalhe}</span> : null}
        </li>
      ))}
    </ol>
  );
}
