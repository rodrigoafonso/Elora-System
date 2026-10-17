import { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router';
import { hojeISO } from '@/domain/shared/datas';
import { Icone } from '../components/Icone';
import {
  MENU,
  entradasVisiveis,
  perfilDaTela,
  telaMigrada,
  todasAsTelas,
  type EntradaMenu,
  type Perfil,
} from '../navigation/menu';
import { BuscaIrPara } from './BuscaIrPara';
import { lerPreferencia, gravarPreferencia } from '../navigation/preferencias';

/** Contexto que as telas recebem do layout (via useOutletContext). */
export interface ContextoDoLayout {
  /** Data de referência ("hoje" para as contas da tela). */
  readonly referencia: string;
}

const lerPastasFechadas = (): Set<string> => {
  try {
    const v: unknown = JSON.parse(lerPreferencia('pastas') ?? '[]');
    return new Set(Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
};

const ativa = (e: EntradaMenu, tela: string) => e.telas.some((t) => t.id === tela);

/** Marca da Elora (mesmo SVG do protótipo). */
const Marca = () => (
  <div className="brand">
    <svg
      viewBox="0 0 64 48"
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g stroke="#B9C9B4">
        <path d="M32 2 33 14h-2z" />
        <path d="M28 44V14h8v30M22 44V22h6M8 44a15 15 0 0 1 14-14M6 44h30" />
      </g>
      <g stroke="#CBB79C">
        <path d="M36 26a19 19 0 0 1 20 18M43 28v16M36 35h14M36 44h22" />
      </g>
    </svg>
    <div className="bt">
      <b>ELORA</b>
      <span>Inteligência Imobiliária</span>
      <i>imóveis do futuro, hoje</i>
      <em>
        Powered by <strong>Elora Core</strong>
      </em>
    </div>
  </div>
);

/**
 * Casca da aplicação: menu lateral por áreas (Hoje, Clientes, Imóveis...), busca Ctrl+K, barra de abas no celular e área principal.
 * Telas irmãs aparecem como uma linha do menu; as abas ficam no alto da tela.
 * Markup e classes idênticos ao protótipo (.app / .side / .nav / .tabbar).
 */
export function TeamLayout() {
  const { tela = 'central' } = useParams();
  const navegar = useNavigate();
  const perfil: Perfil = perfilDaTela(tela);
  const [fechadas, setFechadas] = useState(lerPastasFechadas);
  const [referencia, setReferencia] = useState(hojeISO);
  const [buscando, setBuscando] = useState(false);

  // Ctrl+K (⌘K) abre "Buscar ou ir para" em qualquer tela.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setBuscando(true);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  const alternarPasta = useCallback((titulo: string) => {
    setFechadas((atual) => {
      const nova = new Set(atual);
      if (nova.has(titulo)) nova.delete(titulo);
      else nova.add(titulo);
      gravarPreferencia('pastas', JSON.stringify([...nova]));
      return nova;
    });
  }, []);

  const ir = useCallback(
    (id: string) => {
      void navegar(`/${id}`);
      window.scrollTo(0, 0);
    },
    [navegar],
  );

  const trocarPerfil = (valor: string) => {
    if (valor === 'equipe' || valor === 'corretor') ir(todasAsTelas(valor)[0]!.id);
    else void navegar('/app');
  };

  const contexto = useMemo<ContextoDoLayout>(() => ({ referencia }), [referencia]);

  return (
    <div className="app" id="shell">
      <aside className="side">
        <Marca />
        <button type="button" className="btn-busca" onClick={() => setBuscando(true)}>
          <Icone nome="busca" />
          <span>Buscar ou ir para…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="nav" id="nav" aria-label="Setores">
          {MENU[perfil].map((area) => {
            const entradas = entradasVisiveis(area);
            const so = entradas.length === 1 && entradas[0]!.titulo === area.titulo;
            if (so)
              return (
                <button
                  key={area.titulo}
                  type="button"
                  className="nav-so"
                  aria-current={ativa(entradas[0]!, tela) ? 'page' : undefined}
                  onClick={() => ir(entradas[0]!.telas[0]!.id)}
                >
                  <Icone nome={area.icone} />
                  {area.titulo}
                </button>
              );
            const aberta = !fechadas.has(area.titulo) || entradas.some((e) => ativa(e, tela));
            return (
              <div className="nav-area" key={area.titulo}>
                <button type="button" className="grp" aria-expanded={aberta} onClick={() => alternarPasta(area.titulo)}>
                  <Icone nome={area.icone} />
                  <span>{area.titulo}</span>
                  <Icone nome="pasta" tamanho={11} />
                </button>
                {aberta
                  ? entradas.map((e) => (
                      <button
                        key={e.telas[0]!.id}
                        type="button"
                        aria-current={ativa(e, tela) ? 'page' : undefined}
                        onClick={() => ir(e.telas[0]!.id)}
                      >
                        {e.titulo}
                      </button>
                    ))
                  : null}
              </div>
            );
          })}
        </nav>
        <div className="ctl">
          <label htmlFor="sel-perfil">Ver como</label>
          <select id="sel-perfil" value={perfil} onChange={(e) => trocarPerfil(e.target.value)}>
            <option value="equipe">Equipe Elora</option>
            <option value="corretor">Corretor</option>
            <option value="proprietario">Proprietário</option>
            <option value="inquilino">Locatário</option>
          </select>
        </div>
        <button type="button" className="btn-app" onClick={() => void navegar('/app')}>
          <Icone nome="celular" tamanho={16} />
          App Elora
        </button>
        <div className="ctl ref">
          <label htmlFor="in-ref">Data de referência</label>
          <input
            type="date"
            id="in-ref"
            value={referencia}
            onChange={(e) => e.target.value && setReferencia(e.target.value)}
          />
        </div>
        <small id="modo">Dados de desenvolvimento. Em produção, os dados vêm da API da Elora.</small>
      </aside>
      <main id="main" className={telaMigrada(tela) ? undefined : 'embutida'}>
        <Outlet context={contexto} />
      </main>
      <nav className="tabbar" id="tabbar" aria-label="Setores">
        {MENU[perfil].flatMap(entradasVisiveis).map((e) => (
          <button
            key={e.telas[0]!.id}
            type="button"
            aria-current={ativa(e, tela) ? 'page' : undefined}
            onClick={() => ir(e.telas[0]!.id)}
          >
            {e.titulo}
          </button>
        ))}
      </nav>
      {buscando ? <BuscaIrPara perfil={perfil} aberta aoFechar={() => setBuscando(false)} ir={ir} /> : null}
    </div>
  );
}
