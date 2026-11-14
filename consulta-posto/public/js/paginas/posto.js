import { obterPosto, obterRelatos } from '../api.js';
import {
  botaoCompartilhar, legendaAlertas, seloAlerta,
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
      itemDl('Bandeira', posto.bandeira ? `${posto.bandeira}${posto.bandeiraDesde ? ` (desde ${formatarData(posto.bandeiraDesde)})` : ''}` : null),
      itemDl('Situação cadastral', posto.situacaoCadastral),
      itemDl('Combustíveis informados', posto.combustiveis),
      itemDl('Autorização', posto.autorizacao?.numero
        ? `${posto.autorizacao.numero}${posto.autorizacao.data ? ` · publicada em ${formatarData(posto.autorizacao.data)}` : ''}` : null),
      itemDl('Localização', posto.coordenadas
        ? `${posto.coordenadas.lat.toFixed(5)}, ${posto.coordenadas.lon.toFixed(5)}${posto.coordenadasData ? ` (registrada pela ANP no PMQC em ${formatarData(posto.coordenadasData)})` : ''}`
        : 'Não informada nos dados oficiais'),
    ),
    fonte?.fontes?.cadastro?.observacao ? h('p', { class: 'ajuda' }, fonte.fontes.cadastro.observacao) : null,
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
    corpo.push(h('p', { class: 'ajuda' }, `${fiscalizacoes.length} registro(s), do mais recente para o mais antigo. Os textos reproduzem a fonte. “Sem Registro de Ocorrência” é o resultado usado pela ANP quando a ação não apontou irregularidade.`));
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
    fonteFisc?.observacao ? caixaAviso(fonteFisc.observacao) : null,
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

function mesesAntes(iso, meses) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - meses);
  return d.toISOString().slice(0, 10);
}

/** Painel principal: o "raio-x" do posto — status, motivo e números do histórico oficial. */
function painelRaioX(alerta, fiscalizacoes, ctx) {
  const regra = ctx.status?.alerta?.niveis?.[alerta.nivel]?.regra;
  const ref = alerta.referencia ?? ctx.status?.alerta?.referencia;
  const corte = ref ? mesesAntes(ref, 24) : null;
  const n = (filtro) => fiscalizacoes.filter(filtro).length.toLocaleString('pt-BR');
  const tipo = (t) => (f) => String(f.tipo ?? '').toLowerCase() === t;
  return h('section', { class: `raiox raiox--${alerta.nivel}`, 'aria-labelledby': 'raiox-titulo' },
    h('div', { class: 'raiox__status' },
      h('span', { class: 'raiox__bola', 'aria-hidden': 'true' }),
      h('div', {},
        h('h2', { id: 'raiox-titulo', class: 'raiox__rotulo' }, alerta.rotulo),
        regra ? h('p', { class: 'raiox__regra' }, regra) : null,
      ),
    ),
    alerta.nivel === 'alerta' || alerta.nivel === 'atencao'
      ? h('div', { class: 'raiox__motivo' },
          h('span', { class: 'rotulo' }, 'Registro que acendeu o alerta'),
          h('strong', {}, alerta.motivo ?? 'Registro oficial'),
          h('span', {}, `em ${formatarData(alerta.data)} · veja o histórico abaixo`))
      : null,
    h('dl', { class: 'raiox__numeros' },
      h('div', {}, h('dt', {}, 'Fiscalizações na base'), h('dd', {}, n(() => true))),
      h('div', {}, h('dt', {}, 'Nos últimos 24 meses'), h('dd', {}, corte ? n((f) => f.data >= corte) : '—')),
      h('div', {}, h('dt', {}, 'Autos de infração'), h('dd', {}, n(tipo('auto de infração')))),
      h('div', {}, h('dt', {}, 'Interdições'), h('dd', {}, n(tipo('auto de interdição')))),
    ),
    h('p', { class: 'raiox__rodape' }, `Regra deste app com registros oficiais da ANP até ${formatarData(ref)}. Não é a nota da ANP e não prova adulteração agora.`),
    legendaAlertas(ctx.status?.alerta),
  );
}

function textoCompartilhar(nome, posto, alerta) {
  const local = `${posto.endereco?.municipio ?? ''}/${posto.endereco?.uf ?? ''}`;
  const ref = formatarData(alerta?.referencia);
  if (alerta?.nivel === 'alerta' || alerta?.nivel === 'atencao') {
    return `Raio-X do Posto: ${nome} (${local}) aparece como "${alerta.rotulo}" — ${alerta.motivo ?? 'registro oficial'} em ${formatarData(alerta.data)}, segundo registros de fiscalização da ANP. Confira o histórico antes de abastecer.`;
  }
  return `Raio-X do Posto: ${nome} (${local}) aparece como "${alerta?.rotulo ?? 'sem dados'}" nos registros de fiscalização da ANP até ${ref}. Faça o raio-x do seu posto antes de abastecer.`;
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
  const { posto, fiscalizacoes, fonte, linksOficiais, alerta } = dados;
  const nome = posto.nomeFantasia || posto.razaoSocial || 'Posto sem nome informado';
  definirTitulo(nome);

  raiz.append(
    h('header', { class: 'ficha' },
      h('button', { type: 'button', class: 'voltar', onclick: () => ctx.voltar() }, '← Voltar'),
      h('div', { class: 'ficha__selos' }, seloAlerta(alerta), fonte?.tipo === 'demo' ? selo('DEMO — não são dados reais', 'demo') : null),
      h('h1', { class: 'ficha__nome' }, nome),
      h('p', { class: 'ficha__endereco' }, icone('pino'), h('span', {}, `${enderecoEmLinha(posto.endereco)} — ${posto.endereco?.municipio ?? '?'}/${posto.endereco?.uf ?? '?'}`)),
      posto.cnpj ? h('p', { class: 'ficha__cnpj' }, 'CNPJ ', h('strong', {}, formatarCnpj(posto.cnpj))) : null,
      h('div', { class: 'acoes' },
        linkExterno(linksOficiais.consultaPostos.url, 'Consultar na fonte oficial', 'botao botao--primario'),
        alerta ? botaoCompartilhar(textoCompartilhar(nome, posto, alerta)) : null,
      ),
      h('p', { class: 'ajuda' }, 'A consulta oficial é da ANP e pode ter dados mais recentes. Para achar o posto lá, use o CNPJ.'),
    ),
    alerta ? painelRaioX(alerta, fiscalizacoes, ctx) : null,
    caixaAviso(),
    blocoCadastro(posto, fonte),
    blocoFiscalizacoes(fiscalizacoes, fonte),
    await blocoRelatos(posto, { ...ctx, links: linksOficiais }),
  );
}
