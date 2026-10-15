import type { ProblemaContrato } from '@/domain/locacao/regras';

/** Caixa de problemas do formulário (#frm-erros do protótipo): título, mensagem e a lei de origem. */
export function Problemas({ itens }: { itens: readonly ProblemaContrato[] }) {
  if (!itens.length) return null;
  return (
    <div id="frm-erros" className="erros" role="alert" style={{ marginTop: 14 }}>
      {itens.map((x) => (
        <div key={x.titulo + x.msg}>
          <b>{x.titulo}.</b> {x.msg}
          {x.art ? (
            <>
              {' '}
              <span className="law">{x.art}</span>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
