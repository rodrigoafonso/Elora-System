# Entrada e ritmo dos leads (protótipo v59–v61 + módulo `captacao` da plataforma)

Quatro recursos inspirados no DeskcommCRM (licença MIT), refeitos no padrão da Elora: nada é enviado sozinho,
toda regra nasce pausada e tudo vai ao histórico do lead.

## 1. Radar (Clientes → Atendimentos → Radar; corretor: Hoje → Radar)
Lista o que está esfriando, o mais grave primeiro, com WhatsApp pronto, "Liguei" e Atendimento.
- Sem primeiro contato: horas desde a chegada (padrão 2 h).
- Aguarda aceite do corretor: mais de 1 hora.
- Parado na etapa: dias sem contato por etapa (qualificado 2, visita 2, proposta 1).
- Próximo passo vencido ou ausente.
Gravidade 2 = passou do dobro do prazo. Prazos editáveis pelo gestor (`config.radarSla`).

## 2. Gatilhos por etapa (Sequências / Mensagens do dia)
Complementam a sequência por dias: disparam quando o lead fica parado numa etapa
(Qualificado 2 dias → convite para visita; Visita 1 dia → retorno da visita; Proposta 2 dias → retorno da proposta).
Uma vez por entrada na etapa (`lead.gatilhos[etapa|data]`). Textos editáveis (`config.gatilhos`).
As mensagens sugeridas pelas automações aparecem no mesmo painel.

## 3. Fontes de captação (Clientes → Entrada de leads → Fontes de captação)
- Protótipo: cadastro da fonte (tipo, canal, interesse, corretor ou rodízio, campanha) e "Receber leads":
  cole e-mail de portal ("Campo: valor"), planilha com cabeçalho ou JSON. Mesmo telefone ou e-mail de um lead
  existente não duplica: vira um registro "Entrada" no histórico dele.
- Plataforma (`backend/.../captacao`, migração V8):
  - `POST /api/v1/captacao/receber/{código}` público (JSON ou formulário; CORS aberto só nessa rota, sem cookies), 202.
  - Código de 32 caracteres (~158 bits); o banco guarda só o SHA-256; aparece uma vez na criação ou na troca.
  - Caixa de entrada `app.lead_recebido`: novo, duplicado (mesmo telefone/e-mail em 30 dias), descartado (campo
    escondido "website" preenchido = robô, mesma resposta) e importado. Teto de 120 envios por fonte por hora.
  - Gestão autenticada: `GET/POST /fontes`, `PUT /fontes/{id}`, `POST /fontes/{id}/codigo`, `GET /recebidos`,
    `POST /recebidos/{id}/importado`.
  - Sem IP nem navegador gravados (LGPD, necessidade).

## 4. Automações (Clientes → Entrada de leads → Automações)
Quando (lead novo, mudou de etapa, visita registrada, proposta registrada, ficou parado N dias) / se (etapa,
interesse, fonte) / então (tarefa para o corretor, mensagem sugerida, mudar etapa, prioridade alta, aviso no chat
da equipe, passar para um corretor se estiver sem). Quatro receitas prontas. Toda regra nasce pausada.
- Eventos: só das gravações feitas na própria tela (não das que chegam de outros computadores).
- "Ficou parado": varredura ao abrir e a cada 5 minutos, nas telas da equipe; uma vez por período parado.
- Idempotência: ids fixos por regra + lead + evento (`AX-…`); repetir não duplica tarefa, aviso nem mensagem.
- Atividade: coleção `autoexec`. Coleções novas: `fontes`, `automacoes`, `autoexec` (gravação de fontes e automações
  só para editores, regra do banco).

## Como testar no protótipo
1. Radar: abra Atendimentos → Radar; filtre por motivo e por corretor.
2. Fontes: crie "ZAP Imóveis", "Receber leads", cole dois blocos "Nome/Telefone/E-mail/Mensagem", Ler, Importar.
3. Automações: "Usar esta receita" → Salvar → Ligar. Importe um lead: aparece a tarefa e o aviso no chat; veja Atividade.
4. Registre uma visita num lead com a receita "Depois da visita" ligada: a mensagem aparece em Sequências.

## Na plataforma, depois
Migrar o funil (CRM) para consumir a caixa de entrada (`novo` → lead, marcar `importado`) e levar as automações
para o backend (fila de eventos), com o mesmo modelo de regras.
