import { obterPosto, obterRelatos } from '../api.js';
import {
  caixaAviso, definirTitulo, enderecoEmLinha, estadoErro, formatarCnpj, formatarData, h, icone, linhaFonte, linkExterno, selo,
} from '../ui.js';

function itemDl(rotulo, valor) {
  if (valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && !valor.length)) return null;
  return [h('dt', {}, rotulo), h('dd', {}, Array.isArray(valor) ? valor.join(', ') : valor)];
}

function blocoCadastro(posto, fonte) {
  const e = posto.endereco ?? {};
  return h('section', { class: 'cartao', 'aria-labelledby': 'cad-titulo' },
    h('h2', { id: 'cad-titulo' }, icone('documento'), 'Dados cadastrais'),
    h('dl', { class: 'dados' },
      itemDl('Nome fantasia', posto.nomeFantasia),
      itemDl('Razão social', posto.razaoSocial),
      itemDl('CNPJ', posto.cnpj ? formatarCnpj(posto.cnpj) : null),
      itemDl('Endereço', enderecoEmLinha(e)),
      itemDl('Município/UF', e.municipio ? `${e.municipio}/${e.uf ?? '?'}` : null),
      itemDl('CEP', e.cep),
      itemDl('Bandeira', posto.bandeira),
      itemDl('Situação cadastral', posto.situacaoCadastral),
      itemDl('Combustíveis informados', posto.combustiveis),
      itemDl('Autorização', posto.autorizacao?.numero
        ? `${posto.autorizacao.numero}${posto.autorizacao.data ? ` · publicada em ${formatarData(posto.autorizacao.data)}` : ''}` : null),
      itemDl('Coordenadas', posto.coordenadas ? `${posto.coordenadas.lat.toFixed(5)}, ${posto.coordenadas.lon.toFixed(5)}` : null),
    ),
    linhaFonte(fonte?.fontes?.cadastro, fonte?.tipo),
  );
}

function blocoFiscalizacoes(fiscalizacoes, fonte) {
  const corpo = [];
  const fonteFisc = fonte?.fontes?.fiscalizacoes;
  if (!fonteFisc) {
    corpo.push(h('p', { class: 'estado' }, 'A base atual não inclui o histórico de fiscalizações. Consulte a fonte oficial.'));
  } else if (!fiscalizacoes.length) {
    corpo.push(
      h('div', { class: 'estado' }, icone('info'),
        h('div', {},
          h('p', { class: 'estado__titulo' }, 'Nenhum registro de fiscalização encontrado nesta base.'),
          h('p', {}, 'Isso não significa que o posto nunca foi fiscalizado ou que nunca teve problemas: a base pode estar incompleta ou desatualizada. Confira na fonte oficial.'),
        ),
      ),
    );
  } else {
    corpo.push(h('p', { class: 'ajuda' }, `${fiscalizacoes.length} registro(s), do mais recente para o mais antigo. Os textos reproduzem a fonte.`));
    corpo.push(
      h('ol', { class: 'linha-tempo' },
        fiscalizacoes.map((f) =>
          h('li', { class: 'linha-tempo__item' },
            h('p', { class: 'linha-tempo__data' }, h('time', { datetime: f.data ?? '' }, formatarData(f.data))),
            h('dl', { class: 'dados dados--compacto' },
              itemDl('Tipo de ação', f.tipo ?? 'Não informado na fonte'),
              itemDl('Resultado', f.resultado ?? 'Não informado na fonte'),
              itemDl('Documento', f.documento),
            ),
            f.ocorrencias?.length
              ? h('div', { class: 'ocorrencias' },
                  h('p', { class: 'rotulo' }, 'Ocorrências registradas'),
                  h('ul', {}, f.ocorrencias.map((o) => h('li', {}, o.categoria ? h('strong', {}, `${o.categoria}: `) : null, o.descricao))))
              : null,
          ),
        ),
      ),
    );
  }
  return h('section', { class: 'cartao', 'aria-labelledby': 'fisc-titulo' },
    h('h2', { id: 'fisc-titulo' }, icone('escudo'), 'Histórico de fiscalizações (registros oficiais)'),
    corpo,
    fonteFisc ? linhaFonte(fonteFisc, fonte?.tipo) : null,
  );
}

async function blocoRelatos(posto, ctx) {
  const secao = h('section', { class: 'cartao cartao--relatos', 'aria-labelledby': 'rel-titulo' },
    h('h2', { id: 'rel-titulo' }, icone('balao'), 'Relatos de usuários ', selo('Não verificados', 'alerta')),
    h('p', {}, 'Esta seção é separada dos registros oficiais. Relatos são enviados por pessoas usuárias deste app, passam por moderação de conteúdo antes de aparecer e ',
      h('strong', {}, 'não são verificados'), ' pela ANP nem por este projeto. Não os trate como fatos comprovados.'),
  );
  try {
    const r = await obterRelatos(posto.id);
    if (!r.itens.length) {
      secao.append(h('p', { class: 'estado' }, 'Nenhum relato publicado para este posto.'));
    } else {
      secao.append(
        h('ul', { class: 'relatos' },
          r.itens.map((x) =>
            h('li', { class: 'relato' },
              h('p', { class: 'relato__topo' }, selo('Não verificado', 'alerta'), ' ', h('strong', {}, x.tipoProblema)),
              h('p', { class: 'relato__texto' }, x.descricao),
              h('p', { class: 'ajuda' }, `Ocorrido em ${formatarData(x.dataAproximada)} (data aproximada informada) · enviado em ${formatarData(x.enviadoEm)}`),
            ),
          ),
        ),
      );
    }
    if (r.aguardandoModeracao) secao.append(h('p', { class: 'ajuda' }, `${r.aguardandoModeracao} relato(s) aguardando moderação (não exibidos).`));
  } catch {
    secao.append(h('p', { class: 'estado estado--erro' }, 'Não foi possível carregar os relatos agora.'));
  }
  secao.append(
    h('div', { class: 'acoes' },
      h('a', { href: `/relatar?posto=${encodeURIComponent(posto.id)}`, 'data-link': true, class: 'botao botao--secundario' }, 'Relatar um problema neste posto'),
    ),
    h('p', { class: 'ajuda' }, 'Enviar um relato aqui não substitui a denúncia oficial. Para que a ANP analise o caso, use também o ',
      h('a', { href: ctx.links.denuncia?.url, target: '_blank', rel: 'noopener noreferrer', class: 'link' }, 'canal oficial de denúncia'), '.'),
  );
  return secao;
}

export async function paginaPosto(raiz, ctx) {
  const [id] = ctx.params;
  let dados;
  try {
    dados = await obterPosto(id);
  } catch (e) {
    definirTitulo('Posto');
    raiz.append(h('h1', {}, e.status === 404 ? 'Posto não encontrado' : 'Não foi possível carregar o posto'), estadoErro(e.message, e.corpo?.linksOficiais ?? ctx.links));
    return;
  }
  const { posto, fiscalizacoes, fonte, linksOficiais } = dados;
  const nome = posto.nomeFantasia || posto.razaoSocial || 'Posto sem nome informado';
  definirTitulo(nome);

  raiz.append(
    h('p', {}, h('button', { type: 'button', class: 'link link--botao', onclick: () => ctx.voltar() }, '← Voltar')),
    h('header', { class: 'cabecalho-posto' },
      h('h1', {}, nome, fonte?.tipo === 'demo' ? [' ', selo('DEMO — não são dados reais', 'demo')] : null),
      h('p', { class: 'endereco' }, icone('pino'), `${enderecoEmLinha(posto.endereco)} — ${posto.endereco?.municipio ?? '?'}/${posto.endereco?.uf ?? '?'}`),
      h('div', { class: 'acoes' },
        linkExterno(linksOficiais.consultaPostos.url, 'Consultar na fonte oficial', 'botao botao--primario'),
      ),
      h('p', { class: 'ajuda' }, 'A consulta oficial é da ANP e pode ter dados mais recentes que os exibidos aqui. Para localizar o posto lá, use o CNPJ ',
        posto.cnpj ? h('strong', {}, formatarCnpj(posto.cnpj)) : '(não informado)', '.'),
    ),
    caixaAviso(),
    blocoCadastro(posto, fonte),
    blocoFiscalizacoes(fiscalizacoes, fonte),
    await blocoRelatos(posto, { ...ctx, links: linksOficiais }),
  );
}
