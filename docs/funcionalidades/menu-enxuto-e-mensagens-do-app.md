# Menu enxuto e mensagens do App Elora (versão 68)

## Menu da equipe: 7 entradas + Configurações

| Entrada | Abas |
|---|---|
| Hoje (tela inicial) | Meu dia, Aprovações, Agenda |
| Clientes | Funil, Radar, Compradores, Sequências, Pessoas |
| Imóveis | Para locação, À venda, Recebimento e manutenção, Captação |
| Dinheiro | Contratos de locação, Financeiro, Elora Casa+ |
| Marketing | Marketing, Campanhas |
| Empresa | Mapa da empresa, Reuniões, Tickets, Corretores, Rodízio, Boa Ideia |
| Análises | Dashboard, Comercial, Resultados e OKRs, Inteligência, Sala de guerra |
| Configurações | Robôs (automações), Fontes de captação, Integrações, Empresa e jurídico, Acessos, Dados |

Os endereços das telas não mudaram. As pastas de acesso também não: "Dinheiro" é a pasta `operacoes` e "Empresa"
é a pasta `equipe` (`PASTA_ALIAS`), então os acessos gravados continuam valendo. O corretor tem 5 entradas: Hoje,
Clientes, Imóveis, Meus ganhos e Elora.

## Mensagens no App Elora

Aba "Mensagens" em todos os perfis do app (corretor, proprietário, locatário, comprador), no estilo de uma conversa do
WhatsApp com a Elora. Para o corretor:

- 🔔 lead novo distribuído para ele (com o que procura, canal e valor; botão Aceitar ou Abrir o cliente);
- 💬 recados do chat (canais Geral e Corretores, e a conversa interna dos clientes dele);
- ⏰ lembretes das tarefas de hoje e de amanhã;
- ✅ mensagens aprovadas na Central de aprovações, prontas para enviar;
- 📌 o que precisa dele e 📣 avisos (imóvel novo, preço reduzido...).

Clientes recebem os avisos que já existiam no app (pagamentos, repasses, solicitações, propostas) no mesmo formato.
Com o app aberto, cada mensagem nova desce do alto como uma notificação (toque abre a conversa) e a aba mostra o
número de não lidas. O app lê o mesmo banco do sistema ao vivo: qualquer alteração feita pela equipe aparece na hora.

Limite: a notificação aparece com o app aberto. Notificação com o celular bloqueado depende do app instalado
(plataforma no ar com push) ou do WhatsApp Business oficial.

Testes: `docs/testes/menuapp.cjs` (18 verificações).
