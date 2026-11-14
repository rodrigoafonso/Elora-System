// Pequenos utilitários de interface. Todo texto vindo da API entra via textContent (nunca innerHTML).

/** Cria um elemento: h('p', { class: 'x', onclick: fn }, 'texto', filho) */
export function h(tag, atributos = {}, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(atributos ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  anexar(el, filhos);
  return el;
}

export function anexar(el, filhos) {
  for (const f of filhos.flat(Infinity)) {
    if (f === null || f === undefined || f === false) continue;
    el.append(f instanceof Node ? f : document.createTextNode(String(f)));
  }
  return el;
}

const SVG = 'http://www.w3.org/2000/svg';
const ICONES = {
  busca: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z', 'M20 20l-4-4'],
  lista: ['M8 6h12', 'M8 12h12', 'M8 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
  mapa: ['M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z', 'M9 4v14', 'M15 6v14'],
  pino: ['M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z', 'M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z'],
  info: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z', 'M12 11v5', 'M12 8h.01'],
  alerta: ['M12 3l9.5 17h-19L12 3z', 'M12 10v4', 'M12 17h.01'],
  externo: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  documento: ['M7 3h7l5 5v13H7z', 'M14 3v5h5', 'M10 13h6', 'M10 17h6'],
  balao: ['M4 5h16v11H9l-5 4z'],
  alvo: ['M12 3v3', 'M12 18v3', 'M3 12h3', 'M18 12h3', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z'],
  escudo: ['M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z'],
  compartilhar: ['M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M8.6 13.5l6.8 4', 'M15.4 6.5l-6.8 4'],
  seta: ['M9 6l6 6-6 6'],
  raiox: ['M4 9V4h5', 'M15 4h5v5', 'M20 15v5h-5', 'M9 20H4v-5', 'M4 12h16'],
};

export function icone(nome, rotulo) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icone');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  if (rotulo) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', rotulo);
  } else svg.setAttribute('aria-hidden', 'true');
  for (const d of ICONES[nome] ?? []) {
    const p = document.createElementNS(SVG, 'path');
    p.setAttribute('d', d);
    svg.append(p);
  }
  return svg;
}

export function linkExterno(url, texto, classe = 'botao botao--secundario') {
  return h(
    'a',
    { href: url, class: classe, target: '_blank', rel: 'noopener noreferrer' },
    texto,
    ' ',
    icone('externo'),
    h('span', { class: 'sr' }, ' (abre em nova aba)'),
  );
}

export function formatarData(iso) {
  if (!iso) return '—';
  const [a, m, d] = String(iso).slice(0, 10).split('-');
  return d ? `${d}/${m}/${a}` : m ? `${m}/${a}` : a;
}

export function formatarCnpj(cnpj) {
  const d = String(cnpj ?? '').replace(/\D/g, '');
  if (d.length !== 14) return cnpj ?? '—';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function enderecoEmLinha(e) {
  if (!e) return 'Endereço não informado';
  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
  return [rua, e.complemento, e.bairro].filter(Boolean).join(' · ') || 'Endereço não informado';
}

export const AVISO_INFRACAO =
  'Uma infração registrada no histórico não significa, por si só, que o combustível esteja adulterado atualmente. Consulte as informações e datas na fonte oficial.';

export function caixaAviso(texto = AVISO_INFRACAO, tipo = 'aviso') {
  return h('div', { class: `caixa caixa--${tipo}`, role: 'note' }, icone(tipo === 'aviso' ? 'info' : 'alerta'), h('p', {}, texto));
}

export function estadoCarregando(texto = 'Carregando…') {
  return h('div', { class: 'estado', role: 'status', 'aria-live': 'polite' }, h('span', { class: 'giro', 'aria-hidden': 'true' }), texto);
}

/** Estado de erro com link para a consulta oficial — a pessoa nunca fica sem saída. */
export function estadoErro(mensagem, links) {
  const oficial = links?.consultaPostos;
  return h(
    'div',
    { class: 'estado estado--erro', role: 'alert' },
    icone('alerta'),
    h('div', {}, h('p', { class: 'estado__titulo' }, mensagem),
      oficial ? h('p', {}, 'Você pode consultar diretamente a ferramenta oficial: ', linkExterno(oficial.url, oficial.rotulo, 'link')) : null),
  );
}

/** Linha "Fonte: … · obtido em … · licença …" exibida junto de cada bloco de dados. */
export function linhaFonte(fonte, tipoBase) {
  if (!fonte) return h('p', { class: 'fonte' }, 'Fonte não informada.');
  return h(
    'p',
    { class: 'fonte' },
    icone('documento'),
    h('span', {},
      h('strong', {}, tipoBase === 'demo' ? 'Fonte (DEMO): ' : 'Fonte: '),
      fonte.nome, ' · obtido em ', formatarData(fonte.obtidoEm),
      fonte.atualizadoEm ? ` · atualizado em ${formatarData(fonte.atualizadoEm)}` : '',
      ' · ', fonte.licenca, ' · ',
      h('a', { href: fonte.url, target: '_blank', rel: 'noopener noreferrer', class: 'link' }, 'ver origem'),
    ),
  );
}

export function selo(texto, tipo = 'neutro') {
  return h('span', { class: `selo selo--${tipo}` }, texto);
}

export function definirTitulo(texto) {
  document.title = texto ? `${texto} · Raio-X do Posto` : 'Raio-X do Posto — veja o histórico do posto antes de abastecer';
}

// --- Indicador de alerta ao consumidor ------------------------------------------------------------
// A cor sempre vem acompanhada do rótulo em texto (não depende só da cor).

export function bolaAlerta(alerta, { grande = false } = {}) {
  if (!alerta) return null;
  return h('span', { class: `indicador indicador--${alerta.nivel}${grande ? ' indicador--grande' : ''}` },
    h('span', { class: 'bola', 'aria-hidden': 'true' }),
    h('strong', {}, alerta.rotulo),
  );
}

/** Frase curta com o motivo, para listas e cabeçalhos. */
export function resumoAlerta(alerta) {
  if (!alerta) return '';
  if (alerta.nivel === 'alerta' || alerta.nivel === 'atencao') {
    return `${alerta.motivo ?? 'Registro oficial'} — ${formatarData(alerta.data)}`;
  }
  if (alerta.nivel === 'sem_alerta') return `Última fiscalização em ${formatarData(alerta.data)}, sem os registros que geram alerta`;
  return 'Nenhuma fiscalização registrada nos últimos 24 meses';
}

/** Legenda recolhível com a regra de cada cor. */
export function legendaAlertas(config, { aberta = false } = {}) {
  if (!config?.niveis) return null;
  return h('details', { class: 'legenda-alertas', open: aberta },
    h('summary', {}, 'O que significam as cores'),
    h('ul', {},
      Object.entries(config.niveis).map(([nivel, n]) =>
        h('li', {}, bolaAlerta({ nivel, rotulo: n.rotulo }), h('span', {}, n.regra)),
      ),
    ),
    h('p', { class: 'ajuda' },
      `Regra deste app, calculada só com os registros oficiais de fiscalização da ANP (dados até ${formatarData(config.referencia)}). `,
      'Não é a nota oficial da ANP, não indica que o combustível esteja adulterado agora e não substitui a consulta à fonte oficial. Autuações ainda podem ser contestadas pelo posto.'),
  );
}

// --- Selo de status, compartilhar e avisos rápidos -------------------------------------------------

/** Selo (pílula) com a bola e o rótulo do nível — usado nos cartões e na ficha. */
export function seloAlerta(alerta) {
  if (!alerta) return null;
  return h('span', { class: `selo-status selo-status--${alerta.nivel}` }, h('span', { class: 'bola', 'aria-hidden': 'true' }), alerta.rotulo);
}

let toastAtual = null;
export function avisoRapido(texto) {
  toastAtual?.remove();
  toastAtual = h('div', { class: 'toast', role: 'status' }, texto);
  document.body.append(toastAtual);
  const este = toastAtual;
  setTimeout(() => este.classList.add('toast--saindo'), 2600);
  setTimeout(() => este.remove(), 3100);
}

/**
 * Botão "Compartilhar": usa o compartilhamento do aparelho quando existe; senão copia o texto.
 * O texto descreve só o que os registros oficiais mostram, com a data.
 */
export function botaoCompartilhar(texto, rotulo = 'Compartilhar') {
  const b = h('button', { type: 'button', class: 'botao botao--secundario' }, icone('compartilhar'), rotulo);
  b.addEventListener('click', async () => {
    const url = /^https?:/.test(location.href) && !window.__CONSULTA_POSTO_ESTATICO__ ? location.href : undefined;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Raio-X do Posto', text: texto, url });
        return;
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(url ? `${texto}\n${url}` : texto);
      avisoRapido('Texto copiado. É só colar no WhatsApp ou nas redes.');
    } catch {
      avisoRapido('Não foi possível copiar automaticamente neste navegador.');
    }
  });
  return b;
}
