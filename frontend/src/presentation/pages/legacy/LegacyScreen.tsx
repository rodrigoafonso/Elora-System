import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';

const ORIGEM_LEGADO = '/legacy/elora-partner-os.html';

/**
 * Ponte de migração (padrão Strangler Fig): telas ainda não reescritas em React abrem a versão
 * de referência (protótipo) embutida, sem o menu dela.
 * - Navegação lá dentro → a rota do React acompanha (e telas já migradas abrem a versão nova).
 * - Clique no menu do React → só troca o "#tela" do quadro, sem recarregar o protótipo.
 */
export function LegacyScreen({
  tela,
  telaCheia = false,
  parametros = '',
}: {
  tela: string;
  telaCheia?: boolean;
  parametros?: string;
}) {
  const navegar = useNavigate();
  const ref = useRef<HTMLIFrameElement>(null);
  const [src] = useState(
    () => `${ORIGEM_LEGADO}?embed=1${parametros ? `&${parametros}` : ''}#${encodeURIComponent(tela)}`,
  );

  useEffect(() => {
    const janela = ref.current?.contentWindow;
    try {
      if (janela && janela.location.hash.slice(1) !== tela) janela.location.hash = tela;
    } catch {
      /* quadro ainda carregando */
    }
  }, [tela]);

  useEffect(() => {
    const aoReceber = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      const dados = e.data as { type?: string; view?: string } | null;
      if (dados?.type !== 'elora-legacy-nav' || !dados.view || dados.view === tela) return;
      if (dados.view === 'app' && telaCheia) return;
      void navegar(`/${dados.view}`);
    };
    window.addEventListener('message', aoReceber);
    return () => window.removeEventListener('message', aoReceber);
  }, [navegar, tela, telaCheia]);

  return (
    <iframe
      ref={ref}
      className={telaCheia ? 'legacy-frame cheia' : 'legacy-frame'}
      title="Elora (tela em migração)"
      src={src}
    />
  );
}
