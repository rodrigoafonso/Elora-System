import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icone } from './Icone';

/**
 * Componentes básicos com o MESMO markup e as MESMAS classes do protótipo (elora.css),
 * para que a interface seja idêntica. Não troque as classes sem atualizar o protótipo de referência.
 */

type Variante = 'ghost' | '' | 'danger' | 'elora' | 'zap';

export function Botao({
  variante = 'ghost',
  children,
  className,
  ...resto
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button type="button" className={['btn sm', variante, className].filter(Boolean).join(' ')} {...resto}>
      {children}
    </button>
  );
}

export function BotaoPrincipal({ children, ...resto }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="btn" {...resto}>
      {children}
    </button>
  );
}

/** Etiqueta (pill). classe: '' | 'ok' | 'gold' | 'warn' | 'bad' */
export const Etiqueta = ({ classe = '', children }: { classe?: string; children: ReactNode }) => (
  <span className={`pill ${classe}`}>{children}</span>
);

export const Vazio = ({ children }: { children: ReactNode }) => <p className="empty">{children}</p>;

export const Painel = ({ titulo, children, id }: { titulo?: ReactNode; children: ReactNode; id?: string }) => (
  <section className="panel" id={id}>
    {titulo ? <h2>{titulo}</h2> : null}
    {children}
  </section>
);

export const Aviso = ({ children }: { children: ReactNode }) => (
  <div className="banner">
    <span>{children}</span>
  </div>
);

export interface Indicador {
  readonly rotulo: string;
  readonly valor: ReactNode;
  readonly nota: ReactNode;
}

export const Indicadores = ({ itens }: { itens: readonly Indicador[] }) => (
  <div className="kpis">
    {itens.map((k) => (
      <div key={k.rotulo}>
        <span>{k.rotulo}</span>
        <b className="num">{k.valor}</b>
        <em>{k.nota}</em>
      </div>
    ))}
  </div>
);

/** Grupo de botões alternáveis (abas e filtros). */
export function Chips<T extends string>({
  opcoes,
  atual,
  aoEscolher,
  rotulo,
}: {
  opcoes: readonly (readonly [T, string])[];
  atual: T;
  aoEscolher: (v: T) => void;
  rotulo?: string;
}) {
  return (
    <div className="chips" role="group" aria-label={rotulo}>
      {opcoes.map(([k, t]) => (
        <button key={k} type="button" aria-pressed={k === atual} onClick={() => aoEscolher(k)}>
          {t}
        </button>
      ))}
    </div>
  );
}

/** Link do WhatsApp com mensagem pronta (DDI 55). Some quando não há telefone válido. */
export function BotaoWhatsApp({
  telefone,
  texto,
  rotulo = 'WhatsApp',
}: {
  telefone?: string;
  texto: string;
  rotulo?: string;
}) {
  const d = (telefone ?? '').replace(/\D/g, '');
  if (d.length < 10) return null;
  const url = `https://wa.me/${d.length <= 11 ? `55${d}` : d}?text=${encodeURIComponent(texto)}`;
  return (
    <a className="btn sm zap" href={url} target="_blank" rel="noopener" title="Abrir no WhatsApp">
      <Icone nome="zap" tamanho={14} traco={1.9} />
      {rotulo}
    </a>
  );
}

/** Cabeçalho de tela (equivale ao cab() do protótipo): título, subtítulo, ações, manuais, sino e Elora AI. */
export function Cabecalho({
  titulo,
  subtitulo,
  acoes,
  avisos = 0,
}: {
  titulo: ReactNode;
  subtitulo: ReactNode;
  acoes?: ReactNode;
  avisos?: number;
}) {
  return (
    <div className="head">
      <div>
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
      </div>
      <div className="acts">
        {acoes}
        <button type="button" className="btn sm ghost sino" aria-label="Manuais em PDF" title="Manuais em PDF">
          <Icone nome="livro" />
        </button>
        <button type="button" className="btn sm ghost sino" aria-label={`Avisos: ${avisos}`} data-n={avisos}>
          <Icone nome="sino" />
          {avisos ? <b>{avisos > 99 ? '99+' : avisos}</b> : null}
        </button>
        <Botao variante="elora">Pergunte à Elora AI</Botao>
      </div>
    </div>
  );
}
