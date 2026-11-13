import { caixaAviso, definirTitulo, estadoErro, formatarData, h, icone } from '../ui.js';

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
    placeholder: 'Ex.: Curitiba, Posto Demonstração 05 ou 99.123.456/0001-00',
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
  raiz.append(
    h('section', { class: 'abertura' },
      h('h1', {}, 'Consulte informações públicas sobre postos de combustíveis'),
      h('p', { class: 'abertura__texto' }, 'Encontre um posto pela cidade, pelo nome ou pelo CNPJ e veja os dados cadastrais e o histórico de fiscalizações disponível, sempre com a fonte e a data.'),
    ),
  );
  if (!ctx.status?.disponivel) {
    raiz.append(estadoErro('Os dados não puderam ser carregados no momento.', ctx.links));
    return;
  }
  raiz.append(h('div', { class: 'cartao' }, formularioBusca(ctx)));

  const meta = ctx.status.fonte;
  raiz.append(
    h('section', { class: 'cartao cartao--suave', 'aria-labelledby': 'origem-titulo' },
      h('h2', { id: 'origem-titulo' }, icone('info'), 'De onde vêm os dados e quais os limites'),
      h('ul', { class: 'lista-pontos' },
        meta.tipo === 'demo'
          ? h('li', {}, h('strong', {}, 'Esta versão usa dados de DEMONSTRAÇÃO, que não são reais. '), 'Nenhum posto, CNPJ ou fiscalização mostrado aqui existe de verdade.')
          : h('li', {}, `Os dados vêm de arquivos públicos da ANP (${meta.totalPostos.toLocaleString('pt-BR')} postos em operação), importados por este projeto. Cada tela informa a fonte e a data de obtenção.`),
        meta.tipo !== 'demo' && meta.fontes?.fiscalizacoes?.observacao ? h('li', {}, meta.fontes.fiscalizacoes.observacao) : null,
        h('li', {}, 'Os registros podem estar desatualizados em relação à fonte oficial. Confira sempre as datas.'),
        h('li', {}, 'A ausência de registros não significa que o posto nunca teve problemas.'),
        h('li', {}, 'Este app é independente e não classifica postos como “bons”, “ruins” ou “seguros”.'),
      ),
      h('p', {}, h('a', { href: '/sobre', 'data-link': true, class: 'link' }, 'Saiba mais sobre os dados')),
    ),
  );
  raiz.append(caixaAviso());
}
