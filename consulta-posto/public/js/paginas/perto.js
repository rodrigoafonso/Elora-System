import { buscarProximos } from '../api.js';
import { bolaAlerta, caixaAviso, definirTitulo, estadoCarregando, estadoErro, h, icone, legendaAlertas, linhaFonte } from '../ui.js';
import { estadoLocal, pedirLocalizacao } from '../localizacao.js';
import { cartaoPosto, legendaMapa, montarMapa } from './resultados.js';

let raioAtual = 5;
let ultimoCep = '';
let modoVisao = 'lista';

function formatarCepDigitado(v) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export async function paginaPerto(raiz, ctx) {
  definirTitulo('Postos perto de mim');
  const status = ctx.status;
  raiz.append(
    h('h1', {}, 'Postos perto de mim'),
    h('p', {}, 'Veja os postos ao redor de você, do mais perto para o mais longe, com o indicador de alerta de cada um.'),
  );
  if (!status?.disponivel) {
    raiz.append(estadoErro('Os dados não puderam ser carregados no momento.', ctx.links));
    return;
  }
  if (!status.filtros?.coordenadas) {
    raiz.append(estadoErro('A base em uso não traz a localização dos postos, então não é possível mostrar os postos ao redor. Use a busca por cidade.', ctx.links));
    return;
  }

  const resultado = h('div', { class: 'pagina', 'aria-live': 'polite' });
  const msg = h('p', { class: 'ajuda', role: 'status' });

  // Raio
  const raio = h('select', { id: 'raio' }, (status.raiosKm ?? [1, 2, 5, 10, 20]).map((r) => h('option', { value: r, selected: r === raioAtual }, `${r} km`)));
  raio.addEventListener('change', () => {
    raioAtual = Number(raio.value);
    if (estadoLocal.posicao || ultimoCep) consultar();
  });

  // Opção 1: GPS
  const botaoGps = h('button', { type: 'button', class: 'botao botao--primario' }, icone('alvo'), 'Usar minha localização');
  botaoGps.addEventListener('click', async () => {
    botaoGps.disabled = true;
    msg.textContent = 'Pedindo permissão de localização ao navegador…';
    try {
      estadoLocal.posicao = await pedirLocalizacao();
      estadoLocal.origem = 'gps';
      ultimoCep = '';
      msg.textContent = '';
      await consultar();
    } catch (e) {
      msg.textContent = e.message;
      cep.focus();
    } finally {
      botaoGps.disabled = false;
    }
  });

  // Opção 2: CEP
  const cep = h('input', { id: 'cep', inputmode: 'numeric', autocomplete: 'postal-code', placeholder: '00000-000', maxlength: 9, value: ultimoCep, 'aria-describedby': 'cep-ajuda' });
  cep.addEventListener('input', () => (cep.value = formatarCepDigitado(cep.value)));
  const formCep = h('form', { class: 'linha', novalidate: true },
    cep, h('button', { type: 'submit', class: 'botao botao--secundario' }, icone('busca'), 'Ver postos'));
  formCep.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (cep.value.replace(/\D/g, '').length !== 8) {
      msg.textContent = 'Digite os 8 números do CEP.';
      cep.setAttribute('aria-invalid', 'true');
      cep.focus();
      return;
    }
    cep.removeAttribute('aria-invalid');
    ultimoCep = cep.value;
    estadoLocal.origem = 'cep';
    msg.textContent = '';
    await consultar();
  });

  raiz.append(
    h('div', { class: 'cartao perto-opcoes' },
      h('div', { class: 'perto-opcao' },
        h('h2', {}, icone('alvo'), 'Pela localização do aparelho'),
        h('p', { class: 'ajuda' }, 'Mais preciso. O navegador pede sua permissão; a posição fica só nesta aba e não é gravada.'),
        botaoGps,
      ),
      h('div', { class: 'perto-opcao' },
        h('h2', {}, icone('pino'), 'Pelo CEP'),
        h('label', { for: 'cep' }, 'Seu CEP'),
        formCep,
        h('p', { class: 'ajuda', id: 'cep-ajuda' }, 'Posição aproximada: usamos a média da localização dos postos com CEP parecido. Funciona mesmo quando o navegador não libera a localização.'),
      ),
      h('div', { class: 'campo campo--inline' }, h('label', { for: 'raio' }, 'Raio de busca'), raio),
      msg,
    ),
    resultado,
  );

  async function consultar() {
    resultado.replaceChildren(estadoCarregando('Procurando postos ao redor…'));
    const params = { raio: raioAtual };
    if (estadoLocal.origem === 'cep' && ultimoCep) params.cep = ultimoCep.replace(/\D/g, '');
    else if (estadoLocal.posicao) Object.assign(params, estadoLocal.posicao);
    else return resultado.replaceChildren();
    let r;
    try {
      r = await buscarProximos(params);
    } catch (e) {
      resultado.replaceChildren(estadoErro(e.message, e.corpo?.linksOficiais ?? ctx.links));
      return;
    }
    if (r.porCep) estadoLocal.posicao = { lat: r.origem.lat, lon: r.origem.lon };
    if (!ctx.atual()) return;
    mostrar(r);
  }

  function mostrar(r) {
    const origemTexto = r.porCep
      ? `perto do CEP ${ultimoCep} (posição aproximada pelos ${r.porCep.digitos} primeiros dígitos do CEP, a partir de ${r.porCep.postosUsados} posto(s))`
      : 'perto de você (localização do aparelho, arredondada em cerca de 100 m)';
    const n = r.porNivel ?? {};
    const partes = [
      h('h2', { class: 'titulo-resultados' }, `${r.totalNoRaio} posto(s) num raio de ${r.raioKm} km`),
      h('p', { class: 'secundario' }, origemTexto, '.'),
    ];
    if (r.totalNoRaio) {
      partes.push(
        h('p', { class: 'resumo-niveis' },
          ['alerta', 'atencao', 'sem_alerta', 'sem_registro'].map((k) =>
            h('span', {}, bolaAlerta({ nivel: k, rotulo: `${n[k] ?? 0} ${status.alerta?.niveis?.[k]?.rotulo ?? k}` })))),
      );
    }
    if (r.municipio?.semLocalizacao) {
      partes.push(
        h('div', { class: 'caixa caixa--alerta', role: 'note' }, icone('info'),
          h('p', {},
            `A lista pode estar incompleta: ${r.municipio.semLocalizacao} dos ${r.municipio.total} postos de ${r.municipio.municipio}/${r.municipio.uf} não têm localização nos dados oficiais. `,
            h('a', { href: `/resultados?${new URLSearchParams({ q: r.municipio.municipio, uf: r.municipio.uf })}`, 'data-link': true, class: 'link' }, `Ver todos os postos de ${r.municipio.municipio}`),
            '.')),
      );
    }
    if (!r.totalNoRaio) {
      partes.push(h('div', { class: 'estado' }, icone('busca'),
        h('div', {},
          h('p', { class: 'estado__titulo' }, `Nenhum posto com localização num raio de ${r.raioKm} km.`),
          h('p', {}, r.maisProximoKm ? `O posto com localização mais próximo está a ${r.maisProximoKm.toLocaleString('pt-BR')} km. Aumente o raio.` : 'Aumente o raio ou use a busca por cidade.'))));
      resultado.replaceChildren(...partes);
      return;
    }

    const lista = h('ul', { class: 'lista-postos' }, r.itens.map(cartaoPosto));
    const regiaoMapa = h('div', { class: 'mapa', role: 'region', 'aria-label': 'Mapa dos postos ao redor' });
    const avisoMapa = h('div', { class: 'aviso-mapa' });
    const blocoMapa = h('div', { hidden: modoVisao !== 'mapa' }, legendaMapa(), regiaoMapa, avisoMapa);
    const blocoLista = h('div', { hidden: modoVisao !== 'lista' }, lista,
      r.totalNoRaio > r.itens.length ? h('p', { class: 'ajuda' }, `Mostrando os ${r.itens.length} mais próximos. Diminua o raio para ver uma área menor.`) : null);
    let mapaPronto = false;
    const trocar = (modo) => {
      modoVisao = modo;
      for (const b of alternador.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.modo === modo));
      blocoLista.hidden = modo !== 'lista';
      blocoMapa.hidden = modo !== 'mapa';
      if (modo === 'mapa' && !mapaPronto) {
        mapaPronto = true;
        montarMapa(regiaoMapa, r.itens, avisoMapa, { raioKm: r.raioKm });
      }
    };
    const botao = (modo, rotulo, ic) =>
      h('button', { type: 'button', class: 'alternador__botao', 'data-modo': modo, 'aria-pressed': String(modoVisao === modo), onclick: () => trocar(modo) }, icone(ic), rotulo);
    const alternador = h('div', { class: 'alternador', role: 'group', 'aria-label': 'Forma de exibição' }, botao('lista', 'Lista', 'lista'), botao('mapa', 'Mapa', 'mapa'));

    partes.push(
      h('div', { class: 'ferramentas' }, alternador),
      legendaAlertas(status.alerta),
      caixaAviso(),
      blocoLista,
      blocoMapa,
      linhaFonte(r.fonte?.fontes?.coordenadas, r.fonte?.tipo),
      r.fonte?.fontes?.coordenadas?.observacao ? h('p', { class: 'ajuda' }, r.fonte.fontes.coordenadas.observacao) : null,
    );
    resultado.replaceChildren(...partes);
    if (modoVisao === 'mapa') setTimeout(() => {
      mapaPronto = true;
      montarMapa(regiaoMapa, r.itens, avisoMapa, { raioKm: r.raioKm });
    }, 0);
  }

  // Ao voltar para esta página, refaz a última consulta.
  if (estadoLocal.origem) setTimeout(consultar, 0);
}

