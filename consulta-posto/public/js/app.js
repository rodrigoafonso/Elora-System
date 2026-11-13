// Roteador simples (History API) e inicialização.
import { obterStatus } from './api.js';
import { estadoCarregando, estadoErro, h } from './ui.js';
import { paginaBusca } from './paginas/busca.js';
import { paginaResultados } from './paginas/resultados.js';
import { paginaPosto } from './paginas/posto.js';
import { paginaRelatar } from './paginas/relatar.js';
import { paginaRemover } from './paginas/remover.js';
import { paginaPrivacidade, paginaSobre, paginaTermos } from './paginas/institucional.js';

const LINKS_RESERVA = {
  consultaPostos: {
    rotulo: 'ANP com VC – Postos (consulta oficial da ANP)',
    url: 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/aplicativos/anp-com-vc-postos',
  },
};

const ROTAS = [
  [/^\/$/, paginaBusca],
  [/^\/resultados$/, paginaResultados],
  [/^\/posto\/([\w-]{1,80})$/, paginaPosto],
  [/^\/relatar$/, paginaRelatar],
  [/^\/remover$/, paginaRemover],
  [/^\/sobre$/, paginaSobre],
  [/^\/privacidade$/, paginaPrivacidade],
  [/^\/termos$/, paginaTermos],
];

const main = document.getElementById('conteudo');
let geracao = 0;

export function navegar(url, { substituir = false } = {}) {
  if (substituir) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  renderizar();
}

function marcarMenu(caminho) {
  for (const a of document.querySelectorAll('.menu a')) {
    const ativo = a.getAttribute('href') === caminho || (caminho === '/resultados' && a.getAttribute('href') === '/');
    if (ativo) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

function mostrarFaixaDemo(status) {
  const faixa = document.getElementById('faixa-demo');
  if (status?.fonte?.tipo === 'demo') {
    faixa.replaceChildren(h('strong', {}, 'DEMO — não são dados reais. '), 'Esta versão usa dados fictícios para demonstrar a interface. Para informações oficiais, consulte a ANP.');
    faixa.hidden = false;
  } else faixa.hidden = true;
}

async function renderizar() {
  const minha = ++geracao;
  const { pathname, searchParams } = new URL(location.href);
  marcarMenu(pathname);
  main.replaceChildren(estadoCarregando());

  let status = null;
  try {
    status = await obterStatus();
  } catch {
    status = null;
  }
  if (minha !== geracao) return;
  mostrarFaixaDemo(status);

  const rota = ROTAS.find(([re]) => re.test(pathname));
  const conteudo = h('div', { class: 'pagina' });
  try {
    if (!rota) {
      conteudo.append(h('h1', {}, 'Página não encontrada'), h('p', {}, h('a', { href: '/', 'data-link': true, class: 'link' }, 'Voltar para a busca')));
    } else {
      const [re, pagina] = rota;
      await pagina(conteudo, {
        params: pathname.match(re).slice(1),
        query: searchParams,
        status,
        links: status?.linksOficiais ?? LINKS_RESERVA,
        navegar,
        atual: () => minha === geracao,
      });
    }
  } catch (e) {
    console.error(e);
    conteudo.replaceChildren(estadoErro(e.message || 'Algo deu errado.', status?.linksOficiais ?? LINKS_RESERVA));
  }
  if (minha !== geracao) return;
  main.replaceChildren(conteudo);
  // Move o foco para o título da página nova (leitores de tela e teclado).
  const titulo = main.querySelector('h1');
  if (titulo) {
    titulo.setAttribute('tabindex', '-1');
    if (document.readyState === 'complete' && history.state?.focar !== false) titulo.focus({ preventScroll: true });
  }
  window.scrollTo(0, 0);
}

document.addEventListener('click', (ev) => {
  const a = ev.target.closest('a[data-link]');
  if (!a || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
  ev.preventDefault();
  navegar(a.getAttribute('href'));
});
window.addEventListener('popstate', renderizar);
renderizar();
