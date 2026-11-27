# Central de aprovações, Meu dia, Revisão semanal e Integrações

Inspirado no conceito de "empresa operada por agentes": funções especializadas (automações, Elora AI, tarefas agendadas)
preparam o trabalho, e uma pessoa aprova o que sai da empresa.

## Regra central

Nenhuma ação externa (mensagem a cliente, publicação, pagamento, alteração de campanha) acontece sem aprovação.
Cada decisão guarda **quem**, **quando** e o **texto exato** aprovado. Quem pediu não aprova o próprio pedido.
Recusa exige motivo.

## Fluxo completo (testado)

1. Lead entra (Fontes de captação, cadastro ou App Elora) e vai para o CRM.
2. Uma automação com a ação "Sugerir mensagem" cria um **pedido de aprovação** (não libera a mensagem).
3. O gestor abre a **Central de aprovações**, ajusta o texto se quiser, informa o nome e aprova (ou recusa com motivo).
4. A mensagem aprovada aparece em Sequências para quem atende. O botão abre o WhatsApp com o texto; a pessoa envia.
5. O envio fica registrado no pedido (quem, quando, como) e no histórico do lead.

Publicações do Marketing seguem o mesmo caminho: "Pedir aprovação" → aprovação → "Marcar publicado". Se o texto do post
mudar depois de aprovado, a aprovação cai e é preciso pedir de novo. Lotes de repasse continuam com a dupla aprovação
própria e aparecem na Central.

## Telas no protótipo

- **Meu dia** (Hoje): compromissos, leads que pedem ação (Radar), tarefas atrasadas e o que espera aprovação.
- **Aprovações** (Hoje): fila e registro de decisões e envios.
- **Reuniões**: Revisão da semana (o que funcionou, o que pede atenção, sugestões), calculada por regras fixas e incluída
  na pauta de cada nova reunião semanal.
- **Integrações** (Configurações): cada conexão marcada como Conectada, Manual ou Não conectada, com o que falta.

## Plataforma (back-end)

- `POST /api/v1/aprovacoes` cria o pedido; `POST /{id}/aprovar`, `/{id}/recusar`, `/{id}/executar`; `GET /{id}/historico`.
- `GET /api/v1/integracoes` mostra a situação de cada canal e os **nomes** das variáveis que faltam (nunca os valores).
- Canais: WhatsApp, e-mail, Instagram/Facebook, agenda, anúncios e CRM externo. Hoje todos usam o adaptador
  `CanalNaoConectado`: "executar" devolve **demonstração** e o pedido continua aprovado, não enviado. Com as variáveis
  preenchidas, a situação vira `CREDENCIAIS_SEM_ADAPTADOR` (ainda sem envio): o envio real de cada canal precisa ser
  construído e testado com a conta verdadeira antes de virar `CONECTADO`.
- Banco: migração `V9__aprovacoes.sql` (`app.aprovacao` com travas de coerência e `app.aprovacao_evento` para auditoria).

## O que falta para conectar cada canal

| Canal | Variáveis | Além das variáveis |
|---|---|---|
| WhatsApp | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Conta na API oficial (Meta), número verificado, modelos de mensagem aprovados |
| E-mail | `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Domínio da Elora com e-mail próprio |
| Instagram/Facebook | `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_TOKEN` | Conta comercial ligada à página; app aprovado pela Meta |
| Anúncios | `META_ADS_TOKEN`, `META_ADS_ACCOUNT_ID` | Conta de anúncios |
| Agenda | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Projeto Google Cloud com OAuth |
| CRM externo | `CRM_API_URL`, `CRM_API_TOKEN` | Só se a Elora decidir usar um CRM de fora |

## Testes

- Protótipo: `testes/aprov.cjs` (Playwright), 26 verificações: fluxo completo, bloqueios, persistência após recarregar,
  celular sem rolagem lateral, nenhum erro de página.
- Back-end: `AprovacaoTest` (5) e `AprovacoesCasosDeUsoTest` (5). Migrações V1–V9 aplicadas em PostgreSQL 16, com as
  travas do banco conferidas (aprovado sem texto, quem pediu aprovando e enviado sem data são recusados).
