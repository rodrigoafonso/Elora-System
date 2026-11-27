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

## Nota do achado e agente casamenteiro (versão 70)

- **Nota 0–100 de cada achado** (`achadoScore`): procura real (12 pontos por lead aberto da Elora com o bairro e orçamento
  compatível, até 35), particular 20, tempo anunciado até 15, preço reduzido 10, preço frente ao bairro até 20.
  Faixas: Captar já (75+), Quente (55+), Morno (35+), Frio. Filtros: Nota 35+ (padrão), Nota 55+, Com clientes
  procurando, Particulares, Todos. A mensagem pronta cita quantos clientes procuram aquele perfil.
- O agente diário aplica a mesma nota antes de gravar e descarta abaixo de 35.
- **Agente casamenteiro** (Clientes > Melhores opções): para cada cliente qualificado com telefone, pega as 3 melhores
  opções da carteira que cabem no orçamento e na renda, com a nota de compatibilidade, e manda a mensagem para a
  Central de aprovações. Roda ao abrir o sistema, a cada 5 minutos e quando um lead é salvo; a mesma combinação não se
  repete. Pode ser pausado pelos gestores. Aparece no Mapa como robô "Casamenteiro".
- Testes: `docs/testes/casa.cjs` (10 verificações).
