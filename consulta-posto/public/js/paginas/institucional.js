import { AVISO_INFRACAO, caixaAviso, definirTitulo, formatarData, h, legendaAlertas, linhaFonte, linkExterno } from '../ui.js';

const secao = (titulo, ...conteudo) => h('section', { class: 'texto' }, h('h2', {}, titulo), conteudo);
const p = (...c) => h('p', {}, c);
const ul = (...itens) => h('ul', { class: 'lista-pontos' }, itens.map((i) => h('li', {}, i)));

export async function paginaSobre(raiz, ctx) {
  definirTitulo('Sobre os dados');
  const f = ctx.status?.fonte;
  raiz.append(
    h('h1', {}, 'Sobre os dados'),
    caixaAviso(),
    secao('Este app é independente',
      p('O Raio-X do Posto não é um serviço da ANP nem de qualquer órgão público. Ele organiza informações públicas para facilitar a consulta e sempre indica a fonte e a data de cada dado.'),
      p('A consulta oficial de postos é feita pela própria ANP: ', linkExterno(ctx.links.consultaPostos.url, ctx.links.consultaPostos.rotulo, 'link'), '.'),
    ),
    secao('Base em uso agora',
      !f
        ? p('Os dados não puderam ser carregados no momento.')
        : [
            p(h('strong', {}, f.nome), f.tipo === 'demo' ? ' — DEMO, não são dados reais.' : ` — ${f.totalPostos} postos.`),
            f.aviso ? p(f.aviso) : null,
            h('h3', {}, 'Cadastro dos postos'),
            linhaFonte(f.fontes?.cadastro, f.tipo),
            f.fontes?.coordenadas ? [h('h3', {}, 'Localização dos postos (mapa e “Perto de mim”)'), linhaFonte(f.fontes.coordenadas, f.tipo), f.fontes.coordenadas.observacao ? p(f.fontes.coordenadas.observacao) : null] : null,
            h('h3', {}, 'Histórico de fiscalizações'),
            f.fontes?.fiscalizacoes ? linhaFonte(f.fontes.fiscalizacoes, f.tipo) : p('Não incluído na base atual.'),
          ],
    ),
    secao('Como interpretar',
      ul(
        AVISO_INFRACAO,
        'Fiscalizações refletem a situação encontrada na data da ação. Problemas podem ter sido corrigidos depois.',
        'A falta de registros não significa que o posto nunca teve problemas: a base pode estar incompleta ou desatualizada.',
        'Um auto de infração pode ser contestado; consulte a situação do processo nos canais oficiais.',
        'O indicador colorido deste app não é uma nota nem um selo de “seguro”. A ANP publica sua própria avaliação na consulta oficial, com regras definidas por ela, que podem dar resultados diferentes.',
        'Relatos de usuários ficam em uma seção separada, não são verificados e não se misturam com os registros oficiais.',
      ),
    ),
    secao('Como funciona o indicador colorido',
      p('Cada posto recebe uma bola colorida calculada automaticamente a partir dos registros oficiais de fiscalização, comparando os textos do campo “Resultado” publicados pela ANP. A janela de tempo conta a partir da fiscalização mais recente da base, não da data de hoje.'),
      legendaAlertas(ctx.status?.alerta, { aberta: true }),
      p('Termos considerados no nível “Alerta”: amostra reprovada, combustível fora das especificações, teor de metanol, presença de marcador/solvente, dispositivos que induzam a erro quanto à qualidade, bomba medidora com aferição irregular, alteração do volume comercializado, medida-padrão de 20 litros, venda sem passar pela bomba e interdições (desinterdições não contam).'),
    ),
    secao('Fontes oficiais que podem ser importadas',
      p('O projeto inclui um importador de arquivos CSV/JSON. Antes de publicar dados como reais, a equipe deve conferir nos metadados oficiais a origem, a licença, a data de atualização e os nomes das colunas.'),
      ul(
        h('span', {}, linkExterno(ctx.links.dadosAbertos?.url ?? ctx.links.consultaPostos.url, 'Portal de dados abertos da ANP', 'link'), ' — conjuntos como o cadastro de revendedores e as ações de fiscalização.'),
        h('span', {}, linkExterno(ctx.links.denuncia?.url ?? ctx.links.consultaPostos.url, 'Denúncia de irregularidades em postos (gov.br)', 'link')),
      ),
    ),
  );
}

export async function paginaPrivacidade(raiz, ctx) {
  definirTitulo('Política de privacidade');
  const ret = ctx.status?.relatos?.retencaoDias ?? {};
  raiz.append(
    h('h1', {}, 'Política de privacidade'),
    p(h('em', {}, `Versão do MVP · ${formatarData('2026-11-13')}. Revise com assessoria jurídica antes de lançar ao público (LGPD — Lei 13.709/2018).`)),
    secao('Consultar postos',
      p('A busca não exige cadastro. Não usamos cookies de rastreamento nem ferramentas de publicidade.'),
      p('Se você autorizar a localização, ela é arredondada (cerca de 100 m), usada apenas para encontrar os postos ao redor naquela busca e não é armazenada. O CEP digitado em “Perto de mim” também não é guardado. Na versão publicada sem servidor, esse cálculo acontece no seu próprio navegador. Você pode negar a permissão e usar o CEP ou a busca por cidade.'),
      p('O mapa de fundo é carregado do OpenStreetMap; seu navegador se conecta aos servidores deles para baixar as imagens do mapa.'),
    ),
    secao('Enviar um relato',
      ul(
        h('span', {}, h('strong', {}, 'O que coletamos: '), 'posto, data aproximada, tipo de problema, descrição e, se você quiser, imagens e um e-mail. O envio pode ser anônimo.'),
        h('span', {}, h('strong', {}, 'Para que serve: '), 'moderar o relato e, se publicado, exibi-lo como “não verificado”. O e-mail só é usado para a moderação falar com você sobre aquele relato.'),
        h('span', {}, h('strong', {}, 'O que nunca é publicado: '), 'e-mail, imagens e endereço IP. E-mails, CPFs, telefones e placas digitados na descrição são ocultados automaticamente na exibição.'),
        h('span', {}, h('strong', {}, 'Imagens: '), 'removemos metadados (como localização GPS) ao receber. Elas servem só para moderação.'),
        h('span', {}, h('strong', {}, 'IP: '), 'usado apenas em memória para limitar envios repetidos; não é gravado.'),
      ),
    ),
    secao('Por quanto tempo guardamos',
      ul(
        `Relato aguardando moderação: até ${ret.emModeracao ?? 90} dias.`,
        `Relato rejeitado: até ${ret.rejeitado ?? 30} dias.`,
        `Relato publicado: até ${ret.publicado ?? 730} dias (cerca de 24 meses).`,
        `Imagens: apagadas na decisão da moderação ou em até ${ret.anexos ?? 90} dias.`,
        `E-mail: apagado na decisão da moderação ou em até ${ret.contato ?? 90} dias.`,
        `Pedidos de remoção: até ${ret.solicitacaoRemocao ?? 180} dias.`,
      ),
    ),
    secao('Seus direitos',
      p('Você pode apagar seu relato a qualquer momento com o protocolo e o código de remoção, ou pedir a remoção de um relato que cite você na página ',
        h('a', { href: '/remover', 'data-link': true, class: 'link' }, 'Remover um relato'), '. Também pode pedir acesso, correção ou exclusão de dados pelo mesmo formulário.'),
    ),
  );
}

export async function paginaTermos(raiz, ctx) {
  definirTitulo('Termos de uso');
  raiz.append(
    h('h1', {}, 'Termos de uso'),
    p(h('em', {}, 'Versão do MVP. Revise com assessoria jurídica antes de lançar ao público.')),
    secao('O serviço',
      p('O Raio-X do Posto é um projeto independente que facilita a consulta de informações públicas sobre postos de combustíveis. Não é um serviço oficial e não tem vínculo com a ANP.'),
      p('As informações podem estar incompletas ou desatualizadas. A referência é sempre a fonte oficial: ', linkExterno(ctx.links.consultaPostos.url, ctx.links.consultaPostos.rotulo, 'link'), '.'),
    ),
    secao('O que o app não faz',
      ul(
        'Não afirma que um posto é seguro, confiável, adulterado ou fraudulento.',
        'O indicador colorido resume registros oficiais segundo uma regra publicada no app; não é uma nota de qualidade nem uma garantia.',
        AVISO_INFRACAO,
        'Não recebe denúncias oficiais: o envio de relato aqui não substitui a denúncia aos órgãos competentes.',
      ),
    ),
    secao('Relatos de usuários',
      ul(
        'Relate apenas fatos que você presenciou, com objetividade e sem ofensas.',
        'Não inclua dados pessoais de terceiros (nomes, CPFs, placas, rostos).',
        'A moderação pode recusar ou remover relatos que violem estes termos, contenham acusações sem relação com a experiência relatada ou dados pessoais.',
        'Relatos publicados aparecem sempre como “não verificados” e separados dos registros oficiais.',
        'Você é responsável pelo conteúdo que enviar.',
      ),
    ),
  );
}
