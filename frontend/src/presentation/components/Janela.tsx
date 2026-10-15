import { useEffect, useRef, type ReactNode } from 'react';
import { Icone } from './Icone';

/** Janela modal nativa (<dialog>), como no protótipo. largo = classe "wide". */
export function Janela({
  aberta,
  aoFechar,
  largo = false,
  children,
}: {
  aberta: boolean;
  aoFechar: () => void;
  largo?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberta && !d.open) d.showModal();
    if (!aberta && d.open) d.close();
  }, [aberta]);
  return (
    <dialog ref={ref} className={largo ? 'wide' : ''} onClose={aoFechar} onCancel={aoFechar}>
      {aberta ? (
        <div className="dlg">
          <button type="button" className="dlg-x" aria-label="Fechar a janela" title="Fechar" onClick={aoFechar}>
            <Icone nome="fechar" tamanho={18} traco={2} />
          </button>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
