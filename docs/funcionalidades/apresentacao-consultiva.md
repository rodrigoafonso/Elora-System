# Apresentação consultiva de imóveis (protótipo v55, fase 1)

Do lead a até 3 imóveis da carteira, com o porquê de cada um, comparação verificada, envio aprovado pelo corretor,
resposta do cliente por imóvel e funil de resultado.

## Onde aparece
- Atendimento do lead: seção "Apresentações" com "Nova apresentação consultiva" e as anteriores.
- App do corretor, aba Clientes: botão "Apresentação" em cada cliente e o funil das suas apresentações (90 dias).
- Resultados e OKRs: funil geral das apresentações (90 dias).

## Regras
- Candidatos: `semelhanca` (já existente), só imóveis com autorização escrita, aceitos no recebimento e em oferta.
  Motivos separados em "Combina" e "Diferente do pedido" (`apSepara`).
- Critérios (região, valor máximo, dormitórios) podem ser ajustados só para a apresentação. Gravar no lead é um passo
  separado: "Salvar no lead (confirmado com o cliente)", com registro no histórico.
- Comparação com dados do cadastro: preço total, condomínio, IPTU por mês, custo mensal (marcado "parcial" quando falta
  condomínio ou IPTU), localização, área, dormitórios, vagas, disponibilidade e características. O que falta aparece como
  "não informado".
- Simulação de financiamento (compra): só com a taxa que o corretor digitar; entrada e prazo editáveis; Price e SAC;
  texto de premissas e aviso de que não é proposta nem aprovação de crédito.
- Opção mais de 10% acima do orçamento gera alerta (sem "opção isca"). Sem urgência, desconto ou reserva inventados.
- Aprovação obrigatória: sem marcar "Revisei…", não sai PDF, imagens nem a conversa do WhatsApp. Editar a mensagem
  desmarca a aprovação.
- Saída: imagens 4:5 (1080×1350) para o WhatsApp e PDF com as mesmas páginas (capa, uma página por imóvel, lado a lado
  com simulação e contato). Só o primeiro nome do cliente; nada do proprietário.
- Envio: grava a apresentação (coleção `apresentacoes`), o histórico do lead (`apresentacao` e `enviado` por imóvel) e o
  token de envio de cada imóvel (aviso de abertura do link, quando o site estiver configurado).
- Respostas: gostei, não gostei, quero saber mais, quero visitar. O corretor registra com um toque ou cola a resposta
  ("A4 B2"), que só é proposta até ele confirmar. "Quero visitar" leva ao agendamento da visita. Próximo passo vai para
  o lead (`ia`/`prazo`).
- Permissão: corretor só abre apresentação de lead dele; equipe abre todas.
- Funil (`funilApresentacoes`): enviadas, respondidas, pediram visita, visitas feitas, propostas e negócios, pelo
  histórico do lead depois do envio. Cliques não contam.

## Coleção `apresentacoes`
`leadId, corretorId, negocio (compra|locacao), criterios, imoveis[{id, letra, pct, combina, difere, preco}], fin,
mensagem, status (rascunho|enviada|respondida), criadaEm, aprovadaEm, aprovadaPor, enviadaEm, respostas{imId: {fb, em, por}},
respondidaEm, proximo, prazo`.

## Fase 2 (plataforma)
Página pública `/a/{token}` (mesmo esquema do link do imóvel, ADR 0006) com os botões de resposta, gravando direto nas
respostas da apresentação e avisando o corretor. Tabela `apresentacao` e `apresentacao_resposta` com isolamento por
imobiliária (tenant). Testes do cálculo de aderência, do funil e das permissões no domínio.

## Como testar no protótipo
1. Atendimentos → abra o lead "Eduardo Brandão" (locação) ou "Henrique Sales" (compra) → "Nova apresentação consultiva".
2. Ajuste os critérios, troque ou inclua imóveis, preencha a taxa (compra), marque "Revisei…" e baixe o PDF ou as imagens.
3. "Enviar no WhatsApp" ou "Registrar que enviei"; na tela de respostas, registre o retorno e o próximo passo.
4. Confira o histórico do lead e o funil em Resultados e no app do corretor.

## Limitações conhecidas
- Na fase 1, a resposta do cliente é registrada pelo corretor (não há página pública).
- Poucos imóveis em oferta nos dados de exemplo: a maioria dos leads mostra 1 ou 2 opções.
- O funil conta visitas e propostas registradas no histórico do lead; o que não for registrado não entra.
