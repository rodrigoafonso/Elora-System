import type { ReactNode } from 'react';

/**
 * Campos de formulário com o markup do protótipo (div.f > label + controle + small).
 * Formulários não controlados: os valores são lidos com FormData no envio.
 */
interface Base {
  readonly nome: string;
  readonly rotulo: string;
  readonly obrigatorio?: boolean;
  readonly largo?: boolean;
  readonly dica?: ReactNode;
}

const Moldura = ({ nome, rotulo, obrigatorio, largo, dica, children }: Base & { children: ReactNode }) => (
  <div className={largo ? 'f w' : 'f'}>
    <label htmlFor={`f-${nome}`}>
      {rotulo}
      {obrigatorio ? ' *' : ''}
    </label>
    {children}
    {dica ? <small>{dica}</small> : null}
  </div>
);

export function CampoTexto(p: Base & { valor?: string; tipo?: 'text' | 'date'; travado?: boolean }) {
  return (
    <Moldura {...p}>
      <input
        id={`f-${p.nome}`}
        name={p.nome}
        type={p.tipo ?? 'text'}
        defaultValue={p.valor ?? ''}
        disabled={p.travado}
      />
    </Moldura>
  );
}

export function CampoNumero(p: Base & { valor?: number }) {
  return (
    <Moldura {...p}>
      <input
        id={`f-${p.nome}`}
        name={p.nome}
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        defaultValue={p.valor ?? ''}
      />
    </Moldura>
  );
}

export function CampoLista(
  p: Base & { valor?: string; opcoes: readonly (readonly [string, string])[]; vazio?: string; travado?: boolean },
) {
  return (
    <Moldura {...p}>
      <select id={`f-${p.nome}`} name={p.nome} defaultValue={p.valor ?? ''} disabled={p.travado}>
        {p.vazio !== undefined ? <option value="">{p.vazio}</option> : null}
        {p.opcoes.map(([k, t]) => (
          <option key={k} value={k}>
            {t}
          </option>
        ))}
      </select>
    </Moldura>
  );
}

export function CampoAreaTexto(p: Base & { valor?: string }) {
  return (
    <Moldura {...p}>
      <textarea id={`f-${p.nome}`} name={p.nome} defaultValue={p.valor ?? ''} />
    </Moldura>
  );
}

export function CampoMarcar({
  nome,
  rotulo,
  valor,
  largo,
}: {
  nome: string;
  rotulo: string;
  valor?: boolean;
  largo?: boolean;
}) {
  return (
    <div className={largo ? 'f ck w' : 'f ck'}>
      <input type="checkbox" id={`f-${nome}`} name={nome} defaultChecked={valor} />
      <label htmlFor={`f-${nome}`}>{rotulo}</label>
    </div>
  );
}
