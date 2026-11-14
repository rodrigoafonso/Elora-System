import { buscarPostos } from '../api.js';
import { bolaAlerta, caixaAviso, definirTitulo, enderecoEmLinha, estadoCarregando, estadoErro, formatarCnpj, formatarData, h, icone, legendaAlertas, resumoAlerta, selo, seloAlerta } from '../ui.js';
import { formularioBusca } from './busca.js';
import { estadoLocal, pedirLocalizacao } from '../localizacao.js';

let modoVisao = 'lista';

export function cartaoPosto(p) {
  const nivel = p.alerta?.nivel ?? 'sem_registro';
  const meta = [];
  if (p.cnpj) meta.push(formatarCnpj(p.cnpj));
  if (p.bandeira) meta.push(p.bandeira);
  meta.push(p.fiscalizacoesRegistradas ? `${p.fiscalizacoesRegistradas} fiscalização(ões) · última ${formatarData(p.ultimaFiscalizacao)}` : 'Sem fiscalizações na base');
  return h('li', {},
    h('a', { href: `/posto/${p.id}`, 'data-link': true, class: `cartao-posto cartao-posto--${nivel}` },
      h('span', { class: 'cartao-posto__topo' },
        seloAlerta(p.alerta),
        p.distanciaKm !== undefined ? h('span', { class: 'chip-distancia' }, icone('pino'), `${p.distanciaKm.toLocaleString('pt-BR')} km`) : null,
      ),
      h('span', { class: 'cartao-posto__nome' }, p.nome),
      h('span', { class: 'cartao-posto__endereco' }, `${enderecoEmLinha(p.endereco)} — ${p.endereco?.municipio ?? '?'}/${p.endereco?.uf ?? '?'}`),
      p.alerta && (nivel === 'alerta' || nivel === 'atencao') ? h('span', { class: 'cartao-posto__motivo' }, resumoAlerta(p.alerta)) : null,
      h('span', { class: 'cartao-posto__meta' }, meta.join(' · ')),
      h('span', { class: 'cartao-posto__seta', 'aria-hidden': 'true' }, icone('seta')),
    ),
  );
}

const COR_MAPA = { alerta: '#c62828', atencao: '#d97706', sem_alerta: '#7b8796', sem_registro: '#ffffff' };

let leafletPromessa = null;
function carregarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  leafletPromessa ??= new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = window.__LEAFLET_URL__ ?? '/vendor/leaflet/leaflet.js';
    s.onload = () => (window.L ? ok(window.L) : falha(new Error('Mapa indisponível')));
    s.onerror = () => {
      leafletPromessa = null;
      falha(new Error('Mapa indisponível'));
    };
    document.head.append(s);
  });
  return leafletPromessa;
}

export async function montarMapa(container, itens, avisoMapa, { raioKm } = {}) {
  const comCoord = itens.filter((p) => p.coordenadas);
  const semCoord = itens.length - comCoord.length;
  avisoMapa.replaceChildren();
  if (semCoord) avisoMapa.append(h('p', { class: 'ajuda' }, `${semCoord} posto(s) sem coordenadas não aparecem no mapa, mas estão na lista.`));
  if (!comCoord.length) {
    container.replaceChildren(h('p', { class: 'estado' }, 'Nenhum dos resultados carregados tem coordenadas. Use a lista.'));
    return;
  }
  let L;
  try {
    L = await carregarLeaflet();
  } catch {
    container.replaceChildren(h('p', { class: 'estado estado--erro' }, 'O mapa não pôde ser carregado. A lista de resultados continua disponível.'));
    return;
  }
  container.replaceChildren();
  const mapa = L.map(container, { scrollWheelZoom: false });
  let falhasTiles = 0;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; colaboradores do <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  })
    .on('tileerror', () => {
      if (++falhasTiles === 3) avisoMapa.append(h('p', { class: 'ajuda' }, 'O fundo do mapa não carregou, mas a posição dos postos continua correta. Use a lista se preferir.'));
    })
    .addTo(mapa);

  const limites = [];
  for (const p of comCoord) {
    const ll = [p.coordenadas.lat, p.coordenadas.lon];
    limites.push(ll);
    const popup = h('div', { class: 'popup' },
      h('strong', {}, p.nome), h('br'), bolaAlerta(p.alerta), h('br'), enderecoEmLinha(p.endereco), h('br'),
      h('a', { href: `/posto/${p.id}`, 'data-link': true, class: 'link' }, 'Ver detalhes'));
    // Cor = nível do indicador de alerta (regra explicada na legenda).
    L.circleMarker(ll, { radius: 9, color: p.alerta?.nivel === 'sem_registro' ? '#7b8796' : '#ffffff', weight: 2, fillColor: COR_MAPA[p.alerta?.nivel] ?? '#1d3a5f', fillOpacity: 1 })
      .bindPopup(popup)
      .bindTooltip(`${p.nome} — ${p.alerta?.rotulo ?? ''}`)
      .addTo(mapa);
  }
  if (estadoLocal.posicao) {
    L.circleMarker([estadoLocal.posicao.lat, estadoLocal.posicao.lon], { radius: 7, color: '#1d3a5f', weight: 3, fillColor: '#ffffff', fillOpacity: 1 })
      .bindTooltip('Sua localização aproximada')
      .addTo(mapa);
  }
  if (estadoLocal.posicao && raioKm) {
    const centro = L.latLng(estadoLocal.posicao.lat, estadoLocal.posicao.lon);
    mapa.fitBounds(centro.toBounds(raioKm * 2000), { padding: [10, 10] });
    L.circle(centro, { radius: raioKm * 1000, color: '#1d3a5f', weight: 1, fillOpacity: 0.04, interactive: false }).addTo(mapa);
  } else mapa.fitBounds(limites, { padding: [30, 30], maxZoom: 15 });
}

export function legendaMapa() {
  return h('div', { class: 'legenda', 'aria-label': 'Legenda do mapa' },
    h('p', {}, 'A cor de cada ponto segue o indicador de alerta (veja “O que significam as cores”).'),
    estadoLocal.posicao ? h('p', {}, h('span', { class: 'legenda__ponto legenda__ponto--voce', 'aria-hidden': 'true' }), 'Sua localização aproximada') : null,
    h('p', { class: 'ajuda' }, 'Clique em um ponto para ver o nome, o indicador e abrir os detalhes.'),
  );
}

export async function paginaResultados(raiz, ctx) {
  const q = ctx.query;
  const termo = q.get('q') ?? '';
  definirTitulo(termo ? `Resultados para "${termo}"` : 'Resultados');
  raiz.append(h('div', { class: 'cartao' }, formularioBusca(ctx, q, { compacto: true })));

  const titulo = h('h1', { class: 'titulo-resultados' }, 'Resultados');
  raiz.append(titulo);
  if (!ctx.status?.disponivel) {
    raiz.append(estadoErro('Os dados não puderam ser carregados no momento.', ctx.links));
    return;
  }

  const params = Object.fromEntries(q);
  delete params.lat;
  delete params.lon;
  if (estadoLocal.posicao) Object.assign(params, { lat: estadoLocal.posicao.lat, lon: estadoLocal.posicao.lon });
  if (params.ordenar === 'distancia' && !estadoLocal.posicao) delete params.ordenar;

  let resposta;
  try {
    resposta = await buscarPostos({ ...params, pagina: 1, porPagina: 20 });
  } catch (e) {
    raiz.append(estadoErro(e.message, e.corpo?.linksOficiais ?? ctx.links));
    return;
  }
  const itens = [...resposta.itens];
  let pagina = 1;

  titulo.textContent = `${resposta.total} posto(s) encontrado(s)${termo ? ` para “${termo}”` : ''}`;
  if (resposta.fonte?.tipo === 'demo') titulo.append(' ', selo('DEMO — não são dados reais', 'demo'));

  if (resposta.total === 0) {
    raiz.append(
      h('div', { class: 'estado' },
        icone('busca'),
        h('div', {},
          h('p', { class: 'estado__titulo' }, 'Nenhum posto encontrado com esses critérios.'),
          h('ul', { class: 'lista-pontos' },
            h('li', {}, 'Confira a grafia da cidade ou do nome (acentos não são obrigatórios).'),
            h('li', {}, 'Para CNPJ, digite ao menos os 8 primeiros números.'),
            h('li', {}, 'Remova filtros opcionais.'),
          ),
          h('p', {}, 'Não encontrou aqui? A consulta oficial pode ter dados mais recentes: ',
            h('a', { href: ctx.links.consultaPostos.url, target: '_blank', rel: 'noopener noreferrer', class: 'link' }, ctx.links.consultaPostos.rotulo)),
        ),
      ),
    );
    return;
  }

  // Barra de ferramentas: lista/mapa + ordenação + localização.
  // Mapa e distância só existem quando a base traz coordenadas (a base oficial da ANP não traz).
  const comMapa = ctx.status?.filtros?.coordenadas !== false;
  if (!comMapa) modoVisao = 'lista';
  const lista = h('ul', { class: 'lista-postos', 'aria-live': 'polite' });
  const regiaoMapa = h('div', { class: 'mapa', role: 'region', 'aria-label': 'Mapa dos resultados' });
  const avisoMapa = h('div', { class: 'aviso-mapa' });
  const blocoMapa = h('div', { class: 'bloco-mapa', hidden: modoVisao !== 'mapa' }, legendaMapa(), regiaoMapa, avisoMapa);
  const blocoLista = h('div', { hidden: modoVisao !== 'lista' }, lista);
  const msgLocal = h('p', { class: 'ajuda', role: 'status' });

  const botaoVisao = (modo, rotulo, nomeIcone) =>
    h('button', { type: 'button', class: 'alternador__botao', 'aria-pressed': String(modoVisao === modo), 'data-modo': modo, onclick: () => trocarVisao(modo) }, icone(nomeIcone), rotulo);
  const alternador = h('div', { class: 'alternador', role: 'group', 'aria-label': 'Forma de exibição' }, botaoVisao('lista', 'Lista', 'lista'), botaoVisao('mapa', 'Mapa', 'mapa'));

  let mapaDesatualizado = true;
  function trocarVisao(modo) {
    modoVisao = modo;
    for (const b of alternador.querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.modo === modo));
    blocoLista.hidden = modo !== 'lista';
    blocoMapa.hidden = modo !== 'mapa';
    if (modo === 'mapa' && mapaDesatualizado) {
      mapaDesatualizado = false;
      regiaoMapa.replaceChildren(estadoCarregando('Carregando mapa…'));
      montarMapa(regiaoMapa, itens, avisoMapa);
    }
  }

  const ordenar = h('select', { id: 'ordenar', name: 'ordenar' },
    h('option', { value: 'relevancia' }, 'Relevância'),
    h('option', { value: 'nome' }, 'Nome (A–Z)'),
    comMapa ? h('option', { value: 'distancia', disabled: !estadoLocal.posicao }, estadoLocal.posicao ? 'Distância' : 'Distância (autorize a localização)') : null,
  );
  ordenar.value = q.get('ordenar') && (q.get('ordenar') !== 'distancia' || estadoLocal.posicao) ? q.get('ordenar') : 'relevancia';
  ordenar.addEventListener('change', () => {
    const novo = new URLSearchParams(q);
    novo.set('ordenar', ordenar.value);
    ctx.navegar(`/resultados?${novo}`, { substituir: true });
  });

  const botaoLocal = h('button', { type: 'button', class: 'botao botao--secundario' }, icone('alvo'), estadoLocal.posicao ? 'Atualizar minha localização' : 'Usar minha localização');
  botaoLocal.addEventListener('click', async () => {
    botaoLocal.disabled = true;
    msgLocal.textContent = 'Solicitando permissão de localização…';
    try {
      estadoLocal.posicao = await pedirLocalizacao();
      estadoLocal.origem = 'gps';
      const novo = new URLSearchParams(q);
      novo.set('ordenar', 'distancia');
      ctx.navegar(`/resultados?${novo}`, { substituir: true });
    } catch (e) {
      msgLocal.textContent = e.message;
      botaoLocal.disabled = false;
    }
  });

  raiz.append(
    h('div', { class: 'ferramentas' },
      comMapa ? alternador : null,
      h('div', { class: 'campo campo--inline' }, h('label', { for: 'ordenar' }, 'Ordenar por'), ordenar),
      comMapa ? botaoLocal : null,
    ),
    comMapa
      ? h('p', { class: 'ajuda' }, 'A localização é opcional, usada só para calcular distâncias e não é armazenada. Para ver tudo ao redor de você, use “Perto de mim”.')
      : h('p', { class: 'ajuda' }, 'A base oficial da ANP não informa a localização geográfica (coordenadas) dos postos, por isso o mapa e a ordenação por distância não estão disponíveis. Use o endereço de cada posto.'),
    msgLocal,
    legendaAlertas(ctx.status?.alerta),
    caixaAviso(),
    blocoLista,
    blocoMapa,
  );

  lista.append(...itens.map(cartaoPosto));
  const botaoMais = h('button', { type: 'button', class: 'botao botao--secundario botao--largo' }, 'Carregar mais resultados');
  const atualizarMais = () => {
    botaoMais.hidden = itens.length >= resposta.total;
    botaoMais.textContent = `Carregar mais resultados (${itens.length} de ${resposta.total})`;
  };
  botaoMais.addEventListener('click', async () => {
    botaoMais.disabled = true;
    try {
      const prox = await buscarPostos({ ...params, pagina: pagina + 1, porPagina: 20 });
      pagina++;
      itens.push(...prox.itens);
      lista.append(...prox.itens.map(cartaoPosto));
      mapaDesatualizado = true;
      if (modoVisao === 'mapa') trocarVisao('mapa');
    } catch (e) {
      botaoMais.after(estadoErro(e.message, ctx.links));
    } finally {
      botaoMais.disabled = false;
      atualizarMais();
    }
  });
  blocoLista.append(botaoMais);
  atualizarMais();
  // Espera a página entrar no documento antes de medir o contêiner do mapa.
  if (modoVisao === 'mapa') setTimeout(() => trocarVisao('mapa'), 0);
}
