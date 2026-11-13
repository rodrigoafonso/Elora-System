import { removerRelato, solicitarRemocao } from '../api.js';
import { definirTitulo, h } from '../ui.js';

function campo(id, rotulo, controle, ajuda) {
  return h('div', { class: 'campo' }, h('label', { for: id }, rotulo), controle, ajuda ? h('p', { class: 'ajuda' }, ajuda) : null);
}

export async function paginaRemover(raiz) {
  definirTitulo('Remover um relato');

  // 1) Autor do relato: protocolo + código
  const protocolo = h('input', { id: 'rm-protocolo', autocomplete: 'off', placeholder: 'R-XXXXXXXX', required: true });
  const codigo = h('input', { id: 'rm-codigo', autocomplete: 'off', required: true });
  const msg1 = h('div', { 'aria-live': 'polite' });
  const form1 = h('form', { class: 'formulario cartao', novalidate: true },
    h('h2', {}, 'Sou o autor do relato'),
    h('p', {}, 'Informe o protocolo e o código de remoção recebidos no envio. O relato e as imagens são apagados na hora.'),
    campo('rm-protocolo', 'Protocolo', protocolo),
    campo('rm-codigo', 'Código de remoção', codigo),
    h('button', { type: 'submit', class: 'botao botao--primario' }, 'Apagar meu relato'),
    msg1,
  );
  form1.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    if (!protocolo.value.trim() || !codigo.value.trim()) {
      msg1.replaceChildren(h('p', { class: 'estado estado--erro', role: 'alert' }, 'Preencha o protocolo e o código.'));
      return;
    }
    try {
      await removerRelato({ protocolo: protocolo.value.trim(), codigo: codigo.value.trim() });
      form1.reset();
      msg1.replaceChildren(h('p', { class: 'estado estado--ok', role: 'status' }, 'Relato apagado.'));
    } catch (e) {
      msg1.replaceChildren(h('p', { class: 'estado estado--erro', role: 'alert' }, e.message));
    }
  });

  // 2) Terceiros (ex.: responsável pelo posto ou pessoa citada)
  const referencia = h('input', { id: 'sr-ref', autocomplete: 'off', maxlength: 200 });
  const motivo = h('textarea', { id: 'sr-motivo', rows: 4, maxlength: 2000 });
  const contato = h('input', { id: 'sr-contato', type: 'email', autocomplete: 'email' });
  const aceite = h('input', { id: 'sr-aceite', type: 'checkbox' });
  const msg2 = h('div', { 'aria-live': 'polite' });
  const form2 = h('form', { class: 'formulario cartao', novalidate: true },
    h('h2', {}, 'Quero pedir a remoção de um relato de outra pessoa'),
    h('p', {}, 'Por exemplo: se você é responsável pelo posto, foi citado(a) ou identifica dados pessoais ou conteúdo impróprio. O pedido é analisado pela moderação.'),
    campo('sr-ref', 'Posto e/ou trecho do relato', referencia, 'Ex.: nome do posto, cidade e o início do texto do relato.'),
    campo('sr-motivo', 'Motivo do pedido', motivo),
    campo('sr-contato', 'E-mail para resposta', contato, 'Usado somente para responder a este pedido e apagado ao final da análise.'),
    h('div', { class: 'opcao' }, aceite, h('label', { for: 'sr-aceite' }, 'Concordo com o uso do e-mail apenas para a resposta a este pedido.')),
    h('button', { type: 'submit', class: 'botao botao--secundario' }, 'Enviar pedido de remoção'),
    msg2,
  );
  form2.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    try {
      const r = await solicitarRemocao({ referencia: referencia.value, motivo: motivo.value, contato: contato.value, aceitePrivacidade: aceite.checked });
      form2.reset();
      msg2.replaceChildren(h('p', { class: 'estado estado--ok', role: 'status' }, `Pedido registrado. Protocolo ${r.protocolo}.`));
    } catch (e) {
      const detalhes = e.corpo?.erros ? Object.values(e.corpo.erros) : [];
      msg2.replaceChildren(h('div', { class: 'estado estado--erro', role: 'alert' }, h('p', {}, e.message), detalhes.length ? h('ul', {}, detalhes.map((d) => h('li', {}, d))) : null));
    }
  });

  raiz.append(h('h1', {}, 'Remover um relato'), form1, form2);
}
