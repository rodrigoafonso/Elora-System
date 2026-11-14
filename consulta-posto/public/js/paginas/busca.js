import { botaoCompartilhar, caixaAviso, definirTitulo, estadoErro, formatarData, h, icone, seloAlerta } from '../ui.js';

/** Formulário de busca. Reutilizado na tela de resultados (versão compacta). */
export function formularioBusca(ctx, valores = new URLSearchParams(), { compacto = false } = {}) {
  const filtros = ctx.status?.filtros ?? {};
  const campo = (id, rotulo, controle, ajuda) =>
    h('div', { class: 'campo' }, h('label', { for: id }, rotulo), controle, ajuda ? h('p', { class: 'ajuda', id: `${id}-ajuda` }, ajuda) : null);

  const selecao = (id, nome, opcoes, vazio) => {
    const s = h('select', { id, name: nome }, h('option', { value: '' }, vazio));
    for (const o of opcoes) s.append(h('option', { value: o, selected: valores.get(nome) === o }, o));
    return s;
  };

  const filtrosOpcionais = [];
  filtrosOpcionais.push(campo('f-uf', 'Estado (UF)', selecao('f-uf', 'uf', ctx.status?.ufs ?? [], 'Todos')));
  if (filtros.combustivel) {
    filtrosOpcionais.push(campo('f-comb', 'Combustível vendido', selecao('f-comb', 'combustivel', filtros.combustivel, 'Qualquer')));
  }
  if (filtros.situacaoCadastral) {
    filtrosOpcionais.push(campo('f-sit', 'Situação cadastral', selecao('f-sit', 'situacao', filtros.situacaoCadastral, 'Qualquer')));
  }
  if (filtros.periodoFiscalizacao) {
    const { min, max } = filtros.periodoFiscalizacao;
    filtrosOpcionais.push(
      h('fieldset', { class: 'campo campo--periodo' },
        h('legend', {}, 'Teve fiscalização registrada entre'),
        h('div', { class: 'linha' },
          h('label', { class: 'sr', for: 'f-desde' }, 'Data inicial'),
          h('input', { id: 'f-desde', name: 'desde', type: 'date', min, max, value: valores.get('desde') ?? '' }),
          h('span', { 'aria-hidden': 'true' }, 'e'),
          h('label', { class: 'sr', for: 'f-ate' }, 'Data final'),
          h('input', { id: 'f-ate', name: 'ate', type: 'date', min, max, value: valores.get('ate') ?? '' }),
        ),
        h('p', { class: 'ajuda' }, `Registros disponíveis nesta base: de ${formatarData(min)} a ${formatarData(max)}.`),
      ),
    );
  }
  const temFiltroAtivo = ['uf', 'combustivel', 'situacao', 'desde', 'ate'].some((k) => valores.get(k));

  const erro = h('p', { class: 'erro-campo', id: 'q-erro', role: 'alert', hidden: true });
  const entrada = h('input', {
    id: 'q', name: 'q', type: 'search', autocomplete: 'off', enterkeyhint: 'search',
    placeholder: 'Cidade, nome do posto ou CNPJ',
    value: valores.get('q') ?? '', 'aria-describedby': 'q-ajuda q-erro',
  });

  const form = h('form', { class: `busca ${compacto ? 'busca--compacta' : ''}`, role: 'search', novalidate: true },
    campo('q', 'Cidade, nome do posto ou CNPJ', entrada, 'A busca por CNPJ aceita números com ou sem pontuação.'),
    erro,
    h('details', { class: 'filtros', open: temFiltroAtivo },
      h('summary', {}, 'Filtros opcionais'),
      h('div', { class: 'filtros__grade' }, filtrosOpcionais),
      !filtros.combustivel || !filtros.situacaoCadastral
        ? h('p', { class: 'ajuda' }, 'Alguns filtros não aparecem porque a base atual não traz esses dados de forma confiável.')
        : null,
    ),
    h('button', { type: 'submit', class: 'botao botao--primario' }, icone('busca'), 'Buscar postos'),
  );

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const dados = new FormData(form);
    const params = new URLSearchParams();
    for (const [k, v] of dados) if (String(v).trim()) params.set(k, String(v).trim());
    if (!params.get('q') && !params.get('uf')) {
      erro.textContent = 'Digite uma cidade, nome do posto ou CNPJ (ou escolha um estado nos filtros).';
      erro.hidden = false;
      entrada.setAttribute('aria-invalid', 'true');
      entrada.focus();
      return;
    }
    ctx.navegar(`/resultados?${params}`);
  });
  return form;
}

export async function paginaBusca(raiz, ctx) {
  definirTitulo('');
  const st = ctx.status;
  const meta = st?.fonte;
  const num = st?.numeros;
  const fmt = (n) => Number(n ?? 0).toLocaleString('pt-BR');

  const hero = h('section', { class: 'hero', 'aria-labelledby': 'hero-titulo' },
    h('p', { class: 'hero__eyebrow' }, icone('raiox'),
      meta?.tipo === 'demo' ? 'Versão de demonstração · dados fictícios'
        : st?.alerta?.referencia ? `Dados oficiais da ANP · fiscalizações até ${formatarData(st.alerta.referencia)}` : 'Dados oficiais da ANP'),
    h('h1', { id: 'hero-titulo', class: 'hero__titulo' }, 'Faça o raio-x do posto ', h('span', {}, 'antes de abastecer.')),
    h('p', { class: 'hero__texto' }, 'Histórico oficial de fiscalizações de cada posto do Brasil, com um alerta simples de entender. Grátis, sem cadastro.'),
  );
  raiz.append(hero);
  if (!st?.disponivel) {
    raiz.append(estadoErro('Os dados não puderam ser carregados no momento.', ctx.links));
    return;
  }
  hero.append(h('div', { class: 'hero__busca' }, formularioBusca(ctx)));
  if (st.filtros?.coordenadas) {
    hero.append(
      h('a', { href: '/perto', 'data-link': true, class: 'hero__perto' },
        h('span', { class: 'hero__perto-icone', 'aria-hidden': 'true' }, icone('alvo')),
        h('span', {}, h('strong', {}, 'Postos perto de mim'), h('span', {}, 'Pela localização ou pelo CEP')),
        icone('seta'),
      ),
    );
  }
  hero.append(
    h('div', { class: 'hero__compartilhar' },
      botaoCompartilhar('Antes de abastecer, faça o raio-x do posto: o Raio-X do Posto mostra o histórico oficial de fiscalizações da ANP de cada posto do Brasil, com um alerta simples. Grátis e sem cadastro.', 'Mandar para a família'),
    ),
  );
  if (num) {
    hero.append(
      h('dl', { class: 'numeros' },
        h('div', {}, h('dt', {}, 'postos em operação'), h('dd', {}, fmt(num.postos))),
        h('div', {}, h('dt', {}, 'fiscalizações analisadas'), h('dd', {}, fmt(num.fiscalizacoes))),
        h('div', {}, h('dt', {}, 'com alerta (últimos 12 meses)'), h('dd', { class: 'numeros__alerta' }, fmt(num.porNivel?.alerta))),
      ),
    );
  }

  // O que as cores dizem
  const niveis = st.alerta?.niveis;
  if (niveis) {
    raiz.append(
      h('section', { class: 'secao', 'aria-labelledby': 'cores-titulo' },
        h('div', { class: 'secao__cabecalho' },
          h('h2', { id: 'cores-titulo' }, 'O que cada cor quer dizer'),
          h('p', { class: 'secundario' }, 'Calculado só com os registros oficiais de fiscalização da ANP. Não é a nota da ANP nem um selo de “posto seguro”.'),
        ),
        h('ul', { class: 'grade-niveis' },
          Object.entries(niveis).map(([nivel, n]) =>
            h('li', { class: `nivel nivel--${nivel}` },
              h('div', { class: 'nivel__topo' }, seloAlerta({ nivel, rotulo: n.rotulo }), num ? h('span', { class: 'nivel__total' }, fmt(num.porNivel?.[nivel])) : null),
              h('p', {}, n.regra),
            ),
          ),
        ),
      ),
    );
  }

  raiz.append(
    h('section', { class: 'secao secao--dados', 'aria-labelledby': 'origem-titulo' },
      h('h2', { id: 'origem-titulo' }, 'De onde vêm os dados'),
      h('ul', { class: 'lista-check' },
        meta.tipo === 'demo'
          ? h('li', {}, h('strong', {}, 'Esta versão usa dados de DEMONSTRAÇÃO, que não são reais. '), 'Nenhum posto, CNPJ ou fiscalização mostrado aqui existe de verdade.')
          : h('li', {}, 'Arquivos públicos da ANP: cadastro dos postos em operação, ações de fiscalização e localização registrada no programa de qualidade (PMQC).'),
        h('li', {}, 'Cada tela mostra a fonte e a data dos dados. Confira as datas: a fonte oficial pode estar mais atualizada.'),
        h('li', {}, 'Não ter registros não significa que o posto nunca teve problemas.'),
        meta.tipo !== 'demo' && meta.fontes?.fiscalizacoes?.observacao ? h('li', {}, meta.fontes.fiscalizacoes.observacao) : null,
      ),
      h('p', {}, h('a', { href: '/sobre', 'data-link': true, class: 'link link--seta' }, 'Saiba mais sobre os dados')),
    ),
    caixaAviso(),
  );
}
