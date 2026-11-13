import { buscarPostos, enviarRelato, obterPosto } from '../api.js';
import { caixaAviso, definirTitulo, enderecoEmLinha, estadoErro, h, icone, linkExterno } from '../ui.js';

function lerComoBase64(arquivo) {
  return new Promise((ok, falha) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result).split(',')[1] ?? '');
    leitor.onerror = () => falha(new Error('Não foi possível ler o arquivo.'));
    leitor.readAsDataURL(arquivo);
  });
}

function mesAtual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Seletor de posto: busca na base e escolhe por botão de opção. */
function seletorPosto(ctx, postoInicial, aoEscolher) {
  const escolhido = h('div', { class: 'posto-escolhido', 'aria-live': 'polite' });
  const resultados = h('div', { class: 'seletor__resultados' });
  const termo = h('input', { id: 'busca-posto', type: 'search', autocomplete: 'off', placeholder: 'Cidade, nome ou CNPJ', 'aria-describedby': 'erro-postoId' });
  const botao = h('button', { type: 'button', class: 'botao botao--secundario' }, icone('busca'), 'Procurar');

  function mostrarEscolhido(p) {
    aoEscolher(p?.id ?? '');
    escolhido.replaceChildren(
      p ? h('p', {}, icone('pino'), h('span', {}, h('strong', {}, p.nome ?? p.nomeFantasia), ` — ${enderecoEmLinha(p.endereco)}, ${p.endereco?.municipio}/${p.endereco?.uf}`)) : '',
    );
  }

  async function procurar() {
    const q = termo.value.trim();
    if (!q) return termo.focus();
    resultados.replaceChildren(h('p', { class: 'ajuda', role: 'status' }, 'Procurando…'));
    try {
      const r = await buscarPostos({ q, porPagina: 10 });
      if (!r.itens.length) return resultados.replaceChildren(h('p', { class: 'ajuda', role: 'status' }, 'Nenhum posto encontrado.'));
      const grupo = h('fieldset', { class: 'opcoes' }, h('legend', {}, `Escolha o posto (${r.itens.length} de ${r.total})`));
      for (const p of r.itens) {
        const id = `op-${p.id}`;
        grupo.append(
          h('div', { class: 'opcao' },
            h('input', { type: 'radio', name: 'opcao-posto', id, value: p.id, onchange: () => mostrarEscolhido(p) }),
            h('label', { for: id }, h('strong', {}, p.nome), h('span', { class: 'secundario' }, ` ${enderecoEmLinha(p.endereco)} — ${p.endereco?.municipio}/${p.endereco?.uf}`)),
          ),
        );
      }
      resultados.replaceChildren(grupo);
    } catch (e) {
      resultados.replaceChildren(estadoErro(e.message, ctx.links));
    }
  }
  botao.addEventListener('click', procurar);
  termo.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') {
      ev.preventDefault();
      procurar();
    }
  });
  if (postoInicial) mostrarEscolhido({ ...postoInicial, nome: postoInicial.nomeFantasia || postoInicial.razaoSocial });

  return h('fieldset', { class: 'campo' },
    h('legend', {}, 'Posto ', h('span', { class: 'obrigatorio' }, '(obrigatório)')),
    escolhido,
    h('label', { for: 'busca-posto' }, postoInicial ? 'Trocar de posto' : 'Procure o posto'),
    h('div', { class: 'linha' }, termo, botao),
    resultados,
    h('p', { class: 'erro-campo', id: 'erro-postoId', hidden: true }),
  );
}

export async function paginaRelatar(raiz, ctx) {
  definirTitulo('Relatar problema');
  const r = ctx.status?.relatos;
  const ret = r?.retencaoDias ?? {};
  raiz.append(
    h('h1', {}, 'Relatar um problema em um posto'),
    h('p', {}, 'Use este formulário para compartilhar sua experiência. O relato passa por moderação e, se publicado, aparece separado dos registros oficiais e marcado como ',
      h('strong', {}, '“não verificado”'), '.'),
    h('div', { class: 'caixa caixa--oficial', role: 'note' }, icone('escudo'),
      h('div', {},
        h('p', {}, h('strong', {}, 'Este envio não substitui a denúncia oficial. '),
          'Para que o caso seja apurado, registre também uma denúncia nos canais oficiais. Guarde a nota fiscal, anote data, hora, bomba e combustível, e, se possível, fotografe o painel de preços e a bomba.'),
        linkExterno(ctx.links.denuncia?.url ?? ctx.links.consultaPostos.url, 'Ir para a denúncia oficial (gov.br)'),
      ),
    ),
  );

  if (!ctx.status?.disponivel) {
    raiz.append(estadoErro('Os dados não puderam ser carregados no momento, então não é possível escolher o posto.', ctx.links));
    return;
  }

  let postoInicial = null;
  const idInicial = ctx.query.get('posto');
  if (idInicial) {
    try {
      postoInicial = (await obterPosto(idInicial)).posto;
    } catch {
      postoInicial = null;
    }
  }

  let postoId = postoInicial?.id ?? '';
  const erroDe = (campo) => h('p', { class: 'erro-campo', id: `erro-${campo}`, hidden: true });

  const tipos = h('select', { id: 'tipoProblema', name: 'tipoProblema', required: true, 'aria-describedby': 'erro-tipoProblema' },
    h('option', { value: '' }, 'Selecione…'),
    Object.entries(r?.tiposProblema ?? {}).map(([valor, rotulo]) => h('option', { value: valor }, rotulo)));
  const data = h('input', { id: 'dataAproximada', name: 'dataAproximada', type: 'month', max: mesAtual(), required: true, 'aria-describedby': 'ajuda-data erro-dataAproximada' });
  const max = r?.limites?.descricaoMax ?? 2000;
  const contador = h('p', { class: 'ajuda', id: 'contador', 'aria-live': 'polite' }, `0 de ${max} caracteres`);
  const descricao = h('textarea', { id: 'descricao', name: 'descricao', rows: 6, maxlength: max, required: true, 'aria-describedby': 'ajuda-desc contador erro-descricao' });
  descricao.addEventListener('input', () => (contador.textContent = `${descricao.value.length} de ${max} caracteres`));

  const consentImg = h('input', { type: 'checkbox', id: 'consentimentoImagens', name: 'consentimentoImagens' });
  const blocoConsentImg = h('div', { class: 'opcao', hidden: true }, consentImg,
    h('label', { for: 'consentimentoImagens' }, 'Autorizo o envio das imagens apenas para a moderação. Confirmo que elas não mostram rostos, placas de veículos ou documentos de outras pessoas.'));
  const listaArquivos = h('ul', { class: 'ajuda' });
  const anexos = h('input', { id: 'anexos', name: 'anexos', type: 'file', accept: 'image/jpeg,image/png', multiple: true, 'aria-describedby': 'ajuda-anexos erro-anexos' });
  anexos.addEventListener('change', () => {
    listaArquivos.replaceChildren(...[...anexos.files].map((f) => h('li', {}, `${f.name} (${Math.ceil(f.size / 1024)} KB)`)));
    blocoConsentImg.hidden = anexos.files.length === 0;
  });

  const contato = h('input', { id: 'contato', name: 'contato', type: 'email', autocomplete: 'email', 'aria-describedby': 'ajuda-contato erro-contato' });
  const consentContato = h('input', { type: 'checkbox', id: 'consentimentoContato', name: 'consentimentoContato' });
  const blocoConsentContato = h('div', { class: 'opcao', hidden: true }, consentContato,
    h('label', { for: 'consentimentoContato' }, `Autorizo o uso deste e-mail apenas para a moderação entrar em contato sobre este relato. Ele não será publicado e será apagado após a análise (no máximo ${ret.contato ?? 90} dias).`));
  contato.addEventListener('input', () => (blocoConsentContato.hidden = contato.value.trim() === ''));

  const aceite = h('input', { type: 'checkbox', id: 'aceiteTermos', name: 'aceiteTermos', 'aria-describedby': 'erro-aceiteTermos' });
  const mensagem = h('div', { 'aria-live': 'assertive' });
  const enviar = h('button', { type: 'submit', class: 'botao botao--primario' }, 'Enviar relato para moderação');

  const form = h('form', { class: 'formulario cartao', novalidate: true },
    seletorPosto(ctx, postoInicial, (id) => (postoId = id)),
    h('div', { class: 'campo' }, h('label', { for: 'dataAproximada' }, 'Quando aconteceu (mês e ano) ', h('span', { class: 'obrigatorio' }, '(obrigatório)')), data,
      h('p', { class: 'ajuda', id: 'ajuda-data' }, 'Uma data aproximada basta. Aceitamos fatos dos últimos 5 anos.'), erroDe('dataAproximada')),
    h('div', { class: 'campo' }, h('label', { for: 'tipoProblema' }, 'Tipo de problema ', h('span', { class: 'obrigatorio' }, '(obrigatório)')), tipos, erroDe('tipoProblema')),
    h('div', { class: 'campo' }, h('label', { for: 'descricao' }, 'O que aconteceu ', h('span', { class: 'obrigatorio' }, '(obrigatório)')), descricao,
      h('p', { class: 'ajuda', id: 'ajuda-desc' }, 'Descreva os fatos com objetividade (o que, quando, qual bomba/combustível). Não inclua nome, CPF, telefone, placa ou outros dados pessoais — eles serão ocultados automaticamente se aparecerem. Evite acusações: relate o que você observou.'),
      contador, erroDe('descricao')),
    h('fieldset', { class: 'campo' }, h('legend', {}, 'Imagens (opcional)'),
      h('label', { for: 'anexos' }, 'Fotos da nota fiscal, da bomba ou do painel de preços'), anexos,
      h('p', { class: 'ajuda', id: 'ajuda-anexos' }, `Até ${r?.limites?.anexosMax ?? 3} imagens JPEG ou PNG de até 2 MB cada. As imagens não são publicadas: servem só para a moderação e são apagadas em até ${ret.anexos ?? 90} dias. Removemos automaticamente os metadados (como localização GPS).`),
      listaArquivos, blocoConsentImg, erroDe('anexos')),
    h('fieldset', { class: 'campo' }, h('legend', {}, 'Contato (opcional)'),
      h('label', { for: 'contato' }, 'E-mail'), contato,
      h('p', { class: 'ajuda', id: 'ajuda-contato' }, 'Deixe em branco para enviar de forma anônima.'),
      blocoConsentContato, erroDe('contato')),
    h('div', { class: 'opcao' }, aceite,
      h('label', { for: 'aceiteTermos' }, 'Li e aceito os ', h('a', { href: '/termos', 'data-link': true, class: 'link' }, 'termos de uso'), ' e a ',
        h('a', { href: '/privacidade', 'data-link': true, class: 'link' }, 'política de privacidade'), '. Declaro que o relato é verdadeiro, de acordo com a minha experiência.')),
    erroDe('aceiteTermos'),
    caixaAviso('Relatos são opiniões e experiências individuais. Eles não comprovam irregularidades e não substituem a fiscalização da ANP.'),
    enviar,
    mensagem,
  );

  function limparErros() {
    for (const el of form.querySelectorAll('.erro-campo')) {
      el.hidden = true;
      el.textContent = '';
    }
    for (const el of form.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  }
  function mostrarErros(erros) {
    let primeiro = null;
    for (const [campo, texto] of Object.entries(erros)) {
      const el = form.querySelector(`#erro-${campo}`);
      if (el) {
        el.textContent = texto;
        el.hidden = false;
      }
      const controle = campo === 'postoId' ? form.querySelector('#busca-posto') : form.querySelector(`#${campo}`);
      controle?.setAttribute('aria-invalid', 'true');
      primeiro ??= controle;
    }
    mensagem.replaceChildren(h('p', { class: 'estado estado--erro', role: 'alert' }, 'Confira os campos destacados.'));
    primeiro?.focus();
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    limparErros();
    const erros = {};
    if (!postoId) erros.postoId = 'Procure e escolha o posto.';
    if (!data.value) erros.dataAproximada = 'Informe o mês e o ano.';
    if (!tipos.value) erros.tipoProblema = 'Escolha o tipo de problema.';
    if (descricao.value.trim().length < (r?.limites?.descricaoMin ?? 20)) erros.descricao = `Descreva com pelo menos ${r?.limites?.descricaoMin ?? 20} caracteres.`;
    const arquivos = [...anexos.files];
    if (arquivos.length > (r?.limites?.anexosMax ?? 3)) erros.anexos = `Envie no máximo ${r?.limites?.anexosMax ?? 3} imagens.`;
    else if (arquivos.some((f) => !['image/jpeg', 'image/png'].includes(f.type))) erros.anexos = 'Envie apenas imagens JPEG ou PNG.';
    else if (arquivos.some((f) => f.size > (r?.limites?.anexoBytesMax ?? 2097152))) erros.anexos = 'Cada imagem deve ter no máximo 2 MB.';
    else if (arquivos.length && !consentImg.checked) erros.anexos = 'Marque o consentimento para enviar imagens, ou remova-as.';
    if (contato.value.trim() && !consentContato.checked) erros.contato = 'Autorize o uso do e-mail ou deixe o campo em branco.';
    if (!aceite.checked) erros.aceiteTermos = 'É preciso aceitar os termos e a política de privacidade.';
    if (Object.keys(erros).length) return mostrarErros(erros);

    enviar.disabled = true;
    enviar.textContent = 'Enviando…';
    try {
      const resposta = await enviarRelato({
        postoId,
        dataAproximada: data.value,
        tipoProblema: tipos.value,
        descricao: descricao.value,
        contato: contato.value.trim() || null,
        consentimentoContato: consentContato.checked,
        consentimentoImagens: consentImg.checked,
        aceiteTermos: aceite.checked,
        anexos: await Promise.all(arquivos.map(async (f) => ({ nome: f.name, tipo: f.type, base64: await lerComoBase64(f) }))),
      });
      raiz.replaceChildren(
        h('h1', { tabindex: '-1' }, 'Relato recebido'),
        h('div', { class: 'cartao' },
          h('p', {}, 'Obrigado. Seu relato foi enviado para moderação e só aparecerá depois de analisado, sempre marcado como “não verificado”.'),
          h('dl', { class: 'dados' },
            h('dt', {}, 'Protocolo'), h('dd', {}, h('code', {}, resposta.protocolo)),
            h('dt', {}, 'Código de remoção'), h('dd', {}, h('code', {}, resposta.codigoRemocao)),
          ),
          caixaAviso('Guarde o protocolo e o código de remoção: eles são mostrados só agora e permitem apagar o relato a qualquer momento na página “Remover um relato”.', 'alerta'),
          h('p', {}, h('strong', {}, 'Lembre-se: '), 'este envio não substitui a denúncia oficial.'),
          h('div', { class: 'acoes' },
            linkExterno(ctx.links.denuncia?.url ?? ctx.links.consultaPostos.url, 'Fazer a denúncia oficial', 'botao botao--primario'),
            h('a', { href: '/remover', 'data-link': true, class: 'botao botao--secundario' }, 'Remover um relato'),
          ),
        ),
      );
      raiz.querySelector('h1')?.focus();
    } catch (e) {
      enviar.disabled = false;
      enviar.textContent = 'Enviar relato para moderação';
      if (e.corpo?.erros) mostrarErros(e.corpo.erros);
      else mensagem.replaceChildren(h('p', { class: 'estado estado--erro', role: 'alert' }, e.message));
    }
  });

  raiz.append(form);
}
