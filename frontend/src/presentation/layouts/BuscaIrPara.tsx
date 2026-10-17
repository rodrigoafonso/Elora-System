import { useMemo, useState } from 'react';
import { Janela } from '../components/Janela';
import { telasParaBusca, type Perfil } from '../navigation/menu';

const semAcento = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * "Buscar ou ir para" (Ctrl+K): vai direto a qualquer tela. Nas telas ainda embutidas, o Ctrl+K dentro do
 * protótipo busca também imóveis, clientes e contratos; aqui entram quando os módulos forem migrados.
 * Montada só enquanto aberta (o texto digitado começa vazio a cada vez).
 */
export function BuscaIrPara({
  perfil,
  aberta,
  aoFechar,
  ir,
}: {
  perfil: Perfil;
  aberta: boolean;
  aoFechar: () => void;
  ir: (id: string) => void;
}) {
  const [q, setQ] = useState('');
  const resultados = useMemo(() => {
    const n = semAcento(q.trim());
    return telasParaBusca(perfil).filter((t) => !n || semAcento(`${t.nome} ${t.area}`).includes(n));
  }, [perfil, q]);
  const abrir = (id: string) => {
    aoFechar();
    ir(id);
  };
  return (
    <Janela aberta={aberta} aoFechar={aoFechar}>
      <h2>Buscar ou ir para</h2>
      <input
        id="bx-q"
        className="inp"
        type="search"
        autoComplete="off"
        spellCheck={false}
        autoFocus
        placeholder="Nome da tela ou da área"
        aria-label="Buscar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && resultados[0]) {
            e.preventDefault();
            abrir(resultados[0].id);
          }
        }}
      />
      <div className="bx-res">
        {resultados.length ? (
          resultados.map((t) => (
            <button key={t.id} type="button" className="bx-it" onClick={() => abrir(t.id)}>
              <span>Tela</span>
              <b>{t.nome}</b>
              <small>{t.area}</small>
            </button>
          ))
        ) : (
          <p className="sub">Nada encontrado para "{q}".</p>
        )}
      </div>
      <p className="sub">Atalho: Ctrl+K (⌘K no Mac). Enter abre o primeiro resultado.</p>
    </Janela>
  );
}
