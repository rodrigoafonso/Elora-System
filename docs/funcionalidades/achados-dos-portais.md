# Achados dos portais (versão 69)

- **Agente diário** (tarefa agendada "Agente de captação Elora (portais)", 7h13 de São Paulo): escolhe até 6 bairros onde
  a procura dos leads supera a oferta, busca anúncios recentes (Viva Real, ZAP, OLX, Imovelweb, QuintoAndar, Chaves na Mão)
  e lançamentos da região, e grava até 20 achados por dia em `prospects` (`achado: true`, link, portal, preço, dias
  anunciado, particular ou imobiliária, preço reduzido). Resumo em `config.captacaoAgente`.
- **Captação > Achados dos portais**: ordenados pelos mais quentes (particular, 30+ e 60+ dias, preço caiu, bairro com
  procura). O corretor abre o anúncio, pega o contato no botão do portal e cola no cartão; o imóvel entra na fila de
  ligação e WhatsApp com a cadência de 6 tentativas. Também dá para registrar "Chamei pelo chat do portal", copiar a
  mensagem pronta ou descartar.
- **Botão "Enviar para a Elora"** (favorito do navegador): no anúncio aberto, copia título, preço, link e descrição;
  em Captação, "Colar anúncio" cria o cartão.
- Contatos de pessoas físicas não são coletados pelo agente: o contato vem do botão do próprio anúncio.
- Testes: `docs/testes/achados.cjs` (11 verificações).
