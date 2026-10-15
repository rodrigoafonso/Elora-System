# Elora Partner OS — estado do sistema

Atualizado em 09/10/2026 (última mudança: Sala de guerra (concorrência), só para gestores; as seções de versão mais recentes estão no fim do documento).

## O que existe

- **Sistema em uso** (artefato "Elora Partner OS", versão 18): página única com banco próprio na conta do Claude do Rodrigo.
  Link: https://claude.ai/artifact/8y1KQezi6GccwFpXSbwcmK
- **Modelo de dados de produção** (`claude/schema.sql`): PostgreSQL/Supabase, com RLS e travas legais. Testado (32 testes), ainda não instalado em servidor. Cobre só locação e participação: falta tudo o que entrou nas versões 5 a 13.
- **Regras legais** (`claude/regras-legais.md`): Lei 8.245/91 e Lei 6.530/78 mapeadas para regras de sistema.

Em 07/10/2026 uma publicação duplicada foi criada por engano (https://claude.ai/artifact/WbasjNtMFWa9PcnA5jdnuu, privada, sem banco). Não é o sistema; pode ser apagada.

## Decisões do Rodrigo já tomadas

- **A Elora não trabalha com imóveis de temporada.** O módulo foi retirado na versão 10. Não reconstruir.
- O programa de sugestões se chama **Projeto Boa Ideia**.
- Abaixo do logo, à direita, em letra pequena: **"Powered by Elora Core"**.
- **Todo imóvel passa por um processo rigoroso de recebimento (aceite)** antes de entrar em oferta.
- O imóvel é tratado como aeronave: programa de manutenção com intervalos, diário de bordo e selo.
- Recompensa e pontos do Projeto Boa Ideia só saem quando a ideia praticada atinge o resultado.
- **Toda ideia enviada no Projeto Boa Ideia é analisada automaticamente pela IA, e a avaliação segue aos gestores conforme a validação do sistema** (pedido de 07/10/2026, versão 13).
- O "Resumo do dia pela IA" é só para gestores.
- As comissões dos corretores terão regras próprias, ainda não detalhadas pelo Rodrigo.

## Referências indicadas pelo Rodrigo

- **Formato**: planejador de manutenção da THC (barra lateral por setor, formulários, tabelas, exportação e backup).
- **Funcionalidades**: vídeo do sistema da MC Soluções Imobiliárias (https://youtu.be/EKDlE-MBXKE), com transcrição completa e 34 telas do vídeo enviadas em 07/10/2026. Cinco rodadas de construção a partir dele: versões 8 a 12. A identidade visual continua a da Elora.

## Menu

1. Dashboard (antes chamado Central)
2. Agenda
3. **CRM de Atendimento** (pasta): Atendimentos, Campanhas, Relatórios, Rodízio e funil (antes era a tela Comercial)
4. **Originação**: Corretores Elora, Imóveis
5. **Execução e recorrência**: Locação, Financeiro, Pós-venda
6. **Gestão**: Tickets e Kanban, Resultados e OKRs, Jurídico, Projeto Boa Ideia, Pessoas, Dados

Os grupos do menu são pastas que abrem e fecham. Portal do corretor: Início; pasta CRM de Atendimento (Atendimentos, Meus leads, Imóveis, Agenda); pasta Meus ganhos (Carteira, Extrato); pasta Elora (Projeto Boa Ideia, Elora AI). Outros portais, proprietário, locatário. App Elora: visão do proprietário, do locatário e do comprador, com PIX. No alto de cada tela da equipe e do corretor há o sino de avisos.

## O que cada setor faz

- **Dashboard** (antes Central): busca rápida, indicadores, avaliações do Projeto Boa Ideia para decisão dos gestores, taxa recebida, funil, ocupação, resumo dos imóveis em oferta, negócios por mês, captações por corretor, caixa do mês, últimos atendimentos, últimos imóveis publicados, monitoramento por regras, Elora AI, agenda de hoje, movimentações.
- **Agenda**: tarefas da equipe e dos corretores e prazos legais da locação.
- **Corretores**: rede, CRECI, regiões, especialidades, folga, captações por mês, regra de participação, percentuais de comissão.
- **Imóveis**: abas de locação, de venda e de recebimento e manutenção. Lista com filtros e ordenação; resumo do imóvel ao clicar no nome; cadastro em cinco blocos; ficha com QR Code; relatório ao proprietário; Montar oferta; duplicar; venda fechada; CUB; confirmação de 30 dias; lista de características; apresentação para TV.
- **Comercial**: funil em quadro ou em lista, atendimento do lead, campanhas, desempenho, rodízio e etapas.
- **Locação**: contratos, agenda legal, documentos, reajuste anual.
- **Financeiro**: cobrança, repasses por proprietário com prazo e confirmação (data, gastos e créditos), comissões, fluxo de caixa, receita por etapa, DIMOB, App e pagamentos.
- **Pós-venda**: entrada de contratos novos, solicitações, renovação e saída.
- **Jurídico**: conformidade, dados da empresa, política de só seguro-fiança.
- **Projeto Boa Ideia**: programa de sugestões, com validação do sistema e análise automática da Elora AI em cada ideia.
- **Pessoas**: proprietários e locatários, com a análise de documentos e atalho para o portal.
- **Dados**: relatórios para imprimir, CSV, backup, restauração, registro de alterações, limpeza dos exemplos.

## Versão 18 (08/10/2026)

Pedido do Rodrigo, com imagens de referência (menu "CRM de Atendimento" do sistema MC e um quadro de CRM com cartões): "Corretores" vira **Corretores Elora**; criar a pasta **CRM DE ATENDIMENTO**; o corretor deve ter todas as informações dos leads que trouxe e dos sorteados, um botão da Elora AI para dúvidas da empresa e da imobiliária, e tudo o que precisa para trabalhar os imóveis.

- **Pasta CRM de Atendimento** (equipe): Atendimentos, Campanhas, Relatórios, Rodízio e funil. Os grupos do menu abrem e fecham.
- **Quadro de atendimento** no estilo da referência: colunas por etapa com quantidade e valor em negociação; cartão com iniciais, nome, imóvel, bairro, próxima tarefa e data (atrasada em vermelho), valor, prioridade (Alta, Média, Baixa), origem do lead e parte do corretor. Busca, filtro por corretor e por especialidade do corretor.
- **Portal do corretor, CRM de Atendimento**: o mesmo quadro só com os leads dele (da imobiliária e os que trouxe), filtros por origem e interesse, indicadores, "Novo lead meu".
- **Atendimento do lead** mostra também: onde procura, dormitórios, valor máximo, prioridade, imóvel de interesse, comissão, tarefas pendentes e "Próximo passo (IA)".
- **Imóveis do corretor**: imóveis em oferta e os captados por ele, com foto, valores, medidas, condomínio e IPTU, características, selos, sua parte na comissão e leads dele que combinam. "Tudo sobre o imóvel": valores e comissão, localização, chave, ocupação, documentação, preferência do locatário, procura e leads. Telefone do proprietário só nos imóveis captados por ele (nos demais, a visita é combinada pela Elora).
- **Elora AI do corretor**: botão fixo em todas as telas do corretor e painel com perguntas prontas. Ela recebe um manual da Elora gerado das configurações (comissões, rodízio, regras dos imóveis, garantias) e o catálogo de imóveis em oferta, e pode responder dúvidas gerais do mercado imobiliário, avisando que é orientação geral.

## Versão 17 (08/10/2026)

Pedido do Rodrigo: lead que vem do corretor fica no nome dele; lead do marketing passa pela imobiliária e o corretor vê o que chega; comissão 60% Elora / 40% corretor no lead sorteado, e 45% "se ele fez a venda"; ajudar o cliente a escolher (investimento ou moradia) com comparação feita pela IA. Também pediu para renomear a tela Central para **Dashboard**.

- **Origem do lead** (campo novo): "imobiliária" (marketing, site, portais; entra no rodízio) ou "corretor" (lead próprio; fica no nome dele, fora do rodízio; o sistema recusa distribuir).
- **Comissão por origem**, editável em Corretores:
  - lead da imobiliária, sorteado: corretor 40% da comissão, Elora 60%;
  - lead próprio do corretor: corretor 45%. **Interpretação adotada** de "se ele fez a venda aumenta em 45%": a confirmar pelo Rodrigo.
  - vale para a comissão de venda e para a taxa de intermediação do primeiro aluguel; negócio sem lead segue os percentuais padrão.
- **Meus leads** (portal do corretor): os leads dele por origem, cadastro de lead próprio (recusa telefone já existente) e a entrada de leads da imobiliária na rede nos últimos 7 dias, sem telefone.
- **Objetivo do cliente** no lead: investimento ou moradia.
- **Comparar imóveis** no Atendimento: marca 2 a 4 imóveis; o sistema calcula (investimento: rendimento bruto e líquido estimados, anos de retorno; moradia: aderência ao pedido, preço por m², custo mensal) e a Elora AI explica e recomenda. Aluguel estimado: pedido, ou "aluguel de mercado" do cadastro, ou mediana por m² dos 3 imóveis mais parecidos.
- Exemplos novos: EL-0118 (casa 4 dorm., Jardim Aquarius) e EL-0119 (apto 3 dorm., Urbanova).
- **Junção com outra sessão**: outra conversa publicou antes o App Elora (proprietário, locatário, comprador), PIX com QR Code, cobranças avulsas (coleção `cobrancas`) e pagamentos avisados pelo app. A versão 17 foi aplicada por cima, sem perder nada.

## Versão 16 (08/10/2026)

O Rodrigo enviou uma avaliação externa do produto (CRM, SaaS, UX e prontidão para produção) e pediu "faça suas recomendações". O avaliador abriu a página sem login (viu o modo "só neste navegador" e telas vazias); várias lacunas apontadas já existiam. Pontos certos e só resolvidos no servidor: login por pessoa e permissões, separação por imobiliária, backup automático, auditoria por usuário, LGPD, integrações. Feito dentro da página:

- **Indicadores da Central clicáveis**: abrem os registros que formam o número (taxa, atraso, ocupação, leads, solicitações, ocorrências).
- **"Como cada número é calculado"**: 14 definições com fórmula, início do relógio e o que não entra (Central, Comercial, Resultados).
- **Lead e pessoa repetidos**: aviso por telefone (últimos 8 dígitos) ou e-mail (pessoa sem contato: nome), com botão para abrir o lead existente; salvar de novo grava mesmo assim. Interesse pela ficha com telefone conhecido entra no histórico do lead existente.
- **Tempo até o primeiro contato**: hora de entrada do lead (`criadoQ`) e do primeiro contato (`respostaEm`); mediana, 90% e aguardando; lead sem contato há mais de 4 horas vira ocorrência e ticket do Comercial.
- **Registro rápido**: Liguei, Mandei mensagem, Não atendeu, Visita feita no atendimento; "Liguei" no cartão do funil.
- **Conversão por origem, corretor, bairro e tipo de negócio** (Comercial > Desempenho).
- **Histórico de preço do imóvel** (`precos`), no resumo do imóvel.
- **Revisão jurídica das 16 regras embutidas** (data, quem revisou); sem revisão ou com mais de 12 meses vira ocorrência e ticket do Jurídico.
- **Satisfação do pós-venda**: nota de 0 a 10 pelo portal do locatário ou pela equipe; média e NPS; nota de 0 a 6 vira ocorrência até registrar o retorno ao cliente.
- **Importar planilha (CSV)** de imóveis, pessoas e leads em Dados: liga as colunas pelo nome, prévia linha a linha, erros e repetidos, pular repetidos, desfazer a importação.
- Ficaram para o servidor: dupla aprovação de pagamentos, conciliação bancária, métricas de SaaS, menu por perfil com login.

## Versão 15 (08/10/2026)

Pedido do Rodrigo: "no sino de notificações, todas as transações da empresa são alertadas. Por assunto, cada head do departamento recebe o ticket para ser trabalhado com um clock para solução do problema e contador de horas de trabalho com resultado feito por setor. Inclua também a cultura Google, Kanban, Kaizen etc."

- **Departamentos** (8): Comercial, Imóveis, Locação, Financeiro, Pós-venda, Corretores, Jurídico, Gestão (Agenda, Projeto Boa Ideia e Dados vão para a Gestão). Head de cada um cadastrado em Resultados e OKRs (ainda vazios).
- **Tickets automáticos**: cada ocorrência do monitoramento vira um ticket do departamento (37 com os dados de exemplo). Corrigido o dado, o sistema conclui o ticket; se o problema volta, reabre e marca reincidência. Quem grava é a página aberta por um gestor (no máximo a cada 15 s, só quando algo mudou).
- **Tickets à mão**: por assunto (11 assuntos, cada um ligado a um departamento), com prioridade urgente, alta ou normal.
- **Relógio do prazo (SLA)**: 24 h urgente, 72 h alta, 120 h normal (valores de partida, editáveis). **Relógio de trabalho**: liga ao começar, pausa, para em "Aguardando terceiros" e na conclusão; soma as horas.
- **Kanban**: A fazer, Fazendo, Aguardando terceiros, Feito; limite de 3 em Fazendo por departamento (aviso, não bloqueio).
- **Kaizen**: ao concluir, 5 porquês e melhoria; a melhoria pode ir ao Projeto Boa Ideia com um clique (a Elora AI analisa). **Revisão sem culpados** obrigatória quando o prazo estourou.
- **Resultados e OKRs**: por departamento, abertos, estourados, concluídos no mês, % no prazo, tempo médio, horas no mês; OKRs trimestrais com até 3 resultados-chave (manual ou automático pelos tickets), nota de 0 a 1 (0,7 é bom).
- **Sino da equipe** com três abas: Tickets do meu departamento (escolha guardada no navegador), Movimentações (todas as transações do registro, com as novas marcadas) e Vencimentos.
- **Tarefa agendada** atualizada: lê também tickets e OKRs e traz os tickets por departamento no resumo diário.
- Tickets e OKRs de exemplo: TK-M01, TK-M02, TK-M03, OK-01, OK-02, OK-03 (gravados no banco da página).

## Correção de 08/10/2026 (publicação 14)

O Rodrigo relatou que a janela do sino abria e não fechava. Causa: o botão "Fechar" ficava no fim da lista (17 avisos), fora da tela, e não havia outro jeito de fechar no celular. Correção para todas as janelas: botão X fixo no alto (continua visível ao rolar), Esc fecha, clique fora fecha as janelas sem formulário (formulários só fecham pelo X ou por Cancelar, para não perder o que foi digitado). Na apresentação para TV o X fica escondido e o botão Sair continua.

## Versão 13 (07/10/2026)

Pedido do Rodrigo: "no campo Projeto Boa Ideia, quando derem a sugestão, automaticamente a AI analise a ideia e envia aos gestores a avaliação conforme validação do sistema".

- **Validação do sistema** (regras fixas, sem IA, roda em toda ideia): cinco itens. Essenciais: ideia explicada (80 caracteres ou mais) e não repete ideia já enviada (comparação de palavras do título e da descrição com as ideias anteriores). Complementares: resultado esperado informado, resultado que se pode medir (número ou prazo), setor definido. Marca também temas que precisam passar pelo Jurídico antes de praticar: comissão ou participação (Lei 6.530/78), contrato de locação (Lei 8.245/91), dados pessoais (Lei 13.709/2018), anúncio (Lei 6.530/78, art. 20, III e IV), cobrança ou repasse (Lei 8.245/91, art. 22).
- **Análise automática da Elora AI**: dispara sozinha quando a pessoa clica em "Enviar aos gestores" (uma chamada por ideia, nunca em laço nem por tempo). Devolve recomendação (aprovar, pedir mais detalhes, não aprovar), motivo, benefício provável, risco ou custo, indicador mensurável, prazo em dias, impacto e esforço. A resposta é conferida antes de gravar; fora do formato, é descartada.
- **A validação do sistema manda**: se um item essencial falha ou há ideia parecida, o encaminhamento nunca é "aprovar", mesmo que a IA recomende. Passa a ser "pedir mais detalhes ao autor" ou "comparar com a ideia parecida".
- **Entrega aos gestores**: quadro na Central ("avaliações para decisão dos gestores"), caixa dos gestores na tela do Projeto Boa Ideia, ocorrência no monitoramento, registro no histórico e colunas novas na planilha exportada.
- **Ao aprovar**, a meta e o prazo já vêm preenchidos com o indicador e o prazo sugeridos pela IA quando o autor não deu número. O gestor ajusta. Ao não aprovar, vê o motivo da IA.
- **O autor** vê a validação da própria ideia e que a análise foi enviada; o conteúdo da análise fica na tela da equipe.
- **Sem a IA** (página aberta fora do Claude, permissão negada ou erro): a ideia segue com a validação do sistema e a análise fica pendente, com botão "Analisar com a Elora AI" em cada ideia. Gestor pode refazer uma análise.
- A decisão continua sendo dos gestores. O botão antigo "Parecer (IA)" saiu; pareceres antigos gravados continuam visíveis.

## Versão 12 (07/10/2026)

O Rodrigo enviou 29 telas do sistema de referência e pediu "adicione tudo" sobre dez ideias que o Claude listou.

- **Filtros e ordenação na lista de imóveis**: texto (código, rua, chave, proprietário), bairro, uso, dormitórios, situação, anúncio, característica; ordenar por código, mais recentes, menor ou maior valor, há mais tempo em oferta.
- **Mais de um proprietário por imóvel**: o principal mais até três coproprietários, cada um com percentual; o que sobra é do principal. O repasse, o demonstrativo, o portal do proprietário, os avisos do sino e a DIMOB são divididos nessa proporção. As minutas trazem "LOCADOR 1 (60%)", "LOCADOR 2 (40%)".
- **Confirmação do repasse com data, outros gastos e outros créditos**: até três gastos e dois créditos por repasse; o sistema sugere os custos registrados no diário de bordo dos imóveis do proprietário nos últimos 60 dias. Gasto maior que o repasse é recusado. Esses valores aparecem no demonstrativo e não entram no resultado da Elora.
- **Documentação detalhada**: matrícula, cartório, inscrição do IPTU, códigos de luz e de água, escritura, apto a financiamento. A matrícula entra nas minutas.
- **Dados do imóvel**: área privativa e total, banheiros, salas, andar, terreno (frente e fundo), mobília, ocupação, condomínio, IPTU por ano, ponto de referência, posição da fachada.
- **Características em caixas de marcar**, com lista editável pela imobiliária no fim da tela Imóveis (16 opções de partida, inclusive para galpões).
- **Condições de venda**: entrada, parcelas, aceita permuta, "valor sob consulta" (esconde o preço na vitrine, nas peças, na TV e na oferta; por dentro continua visível).
- **Taxa de administração e comissão de venda combinadas por imóvel**: viram o padrão do contrato e do registro da venda daquele imóvel, e entram na previsão do corretor.
- **Ver no mapa**: abre o Google Maps no endereço. O mapa dentro da tela e o CEP automático continuam dependendo de servidor.
- **Resumo rápido do imóvel**: responsáveis com telefone e e-mail, valores, medidas, documentação e controle, sem abrir o cadastro.
- **E-mail padrão da confirmação de 30 dias**, ao lado do WhatsApp.

## Versão 11 (07/10/2026)

- **Recebimento do imóvel (aceite)**: lista de verificação por tipo (24 itens no residencial, 25 no comercial e no industrial, 7 no terreno), itens impeditivos que recusam o imóvel, resultado calculado pelo sistema, rascunho, correção de não conformidades. Sem o aceite, o imóvel não é anunciado, ofertado nem alugado. Depois da saída do locatário, o recebimento é refeito (meta de 72 horas). Base citada: Lei 8.245/91, art. 22, I e V; o bloqueio de anúncio é regra da Elora.
- **Programa de manutenção, diário de bordo e Selo Elora**: itens com intervalo por tipo de imóvel, registro de execução, diário que junta inspeções, manutenções, reparos e locações, selo para imóvel aceito e com o programa em dia. O selo diz que não substitui habite-se, AVCB nem laudo de engenheiro. Sensores não foram feitos.
- **Sino de avisos**, **repasse pago ao proprietário** com prazo, **contas da empresa** marcadas como pagas, **Central** com resumo de imóveis, últimos atendimentos, últimos publicados e caixa realizado × previsto, campo **suítes**.

## Versões 8 a 10 (07/10/2026)

- **10**: retirada da temporada; Projeto Boa Ideia; Montar oferta; favorito e proposta com valor no atendimento; funil em lista; etapa por tipo de negócio; lead fora do rodízio; procura pelo imóvel e relatório ao proprietário; cadastro rápido de pessoa; campanha por mês; forma de pagamento nas minutas; registro de alterações.
- **9**: cadastro completo do imóvel; CUB; funil personalizável; motivo de perda; rodízio com horário e folga; encargo e desconto mensais no contrato; minuta de compra e venda; imagens para feed e story; apresentação para TV; simulador de financiamento; análise de documentação; fotos com marca-d'água (código pronto, **desligado**).
- **8**: venda fechada e comissões; documentos em Word; reajuste anual; atendimento com sugestões; aceite do lead; agenda; ficha e QR Code; confirmação de 30 dias; campanhas; fluxo de caixa; apoio à DIMOB.

## Valores provisórios (a confirmar pelo Rodrigo)

| Regra | Valor provisório |
|---|---|
| Custos diretos sobre a taxa de administração | 37,5% |
| Participação recorrente do corretor | 50% da receita elegível |
| Comissão de venda | 6% do preço |
| Parte do corretor na comissão de venda | 40% |
| Parte do corretor na intermediação de locação | 50% |
| Dia de pagamento ao corretor | 10 |
| Prazo de aceite do lead | 15 minutos |
| Prazo padrão do repasse ao proprietário | 5 dias depois do recebimento |
| Intervalos do programa de manutenção | 6 a 36 meses, conforme o item |
| Itens e impeditivos da lista de recebimento | lista do Claude |
| Lista de características de partida | 16 opções do Claude |
| Prazos dos tickets | 24 h urgente, 72 h alta, 120 h normal |
| Limite em Fazendo por departamento | 3 |
| Itens da validação das ideias, mínimo de 80 caracteres e temas marcados para o Jurídico | critérios do Claude |

Os dois primeiros vêm do exemplo do documento de estratégia. Os demais foram postos pelo Claude para o sistema funcionar; não são decisão da Elora.

Atenção: no banco da página, a regra de participação está gravada como **0% de custos diretos e 0% de participação** desde 07/10/2026 (alteração feita na tela Corretores). O Rodrigo foi avisado duas vezes e ainda não respondeu.

## Elora AI

Botão "Pergunte à Elora AI" em todas as telas; a conversa abre no assunto da tela. Recebe também os vencimentos próximos e a situação de recebimento e manutenção dos imóveis. Nos portais do proprietário e do locatário, recebe só os dados daquela pessoa.

É o Claude. Funciona só com a página aberta pelo Claude, na conta de quem abre. Lê e redige; não executa ações. Não foi testada ao vivo pelo Claude que construiu o sistema.

## Monitoramento agendado (criado em 07/10/2026)

Tarefa agendada "Monitor Elora Partner OS", na conta do Rodrigo, no horário comercial do Brasil escolhido por ele em 08/10/2026: segunda a sexta, de hora em hora, das 8h32 às 18h32 (horário de São Paulo), na nuvem, sem pedir aprovação. Só lê. Baixa a página e o banco do artefato, aplica as mesmas regras fixas da página (todos os setores) e:
- às 8h32, entrega o resumo diário completo, incluindo o que mudou fora do horário comercial;
- nas outras horas, relata só se houve alteração registrada no sistema na última hora;
- sem novidade, termina sem aviso.
Na primeira versão (de hora em hora, 24 horas), as execuções da madrugada de 08/10 terminaram com sucesso.

Limites: intervalo mínimo de uma hora (não cobre o prazo de 15 minutos de aceite do lead); cada execução consome uso do plano do Rodrigo; depende de o artefato e o banco continuarem acessíveis à conta dele. Ainda não confirmado em execução real: o caminho foi testado à mão na conversa (39 ocorrências em 9 setores, igual à página).

## Projeto Boa Ideia

Adaptação do programa da Embraer. Qualquer pessoa escreve a ideia; no envio, o sistema valida e a Elora AI analisa; a avaliação vai aos gestores junto com a ideia; eles aprovam com meta, prazo, pontos e recompensa, ou respondem por que não. A recompensa e os pontos só saem quando a ideia praticada atinge o resultado. Pendente: regulamento e validação tributária e trabalhista das recompensas.

## Ideias de negócio discutidas em 07/10/2026

- Tratar o imóvel como aeronave (construída na versão 11, exceto os sensores).
- Publicar ao vivo os números da operação: não construída.
- Taxa por resultado: não construída; precisa de simulação.
- Nichos sugeridos para buscar liderança no Vale do Paraíba: locação industrial e corporativa; profissionais da aviação que se mudam para a região.
- Conta de equilíbrio com os números de exemplo: sobram R$ 75,00 por contrato de R$ 3.000,00 por mês depois dos custos diretos e da participação do corretor.

## Coleções do banco do artefato

`corretores`, `pessoas`, `imoveis` (com `venda`, `fotosIds`, `caracteristicas`, `suites`, `publicadoEm`, `aceite`, `manut`, `diario`, `coproprietarios`, e os campos de documentação, medidas e condições de venda), `contratos` (com `pag`; cada pagamento guarda `rep` por proprietário, com data, gastos e créditos; o campo antigo `repasseEm` ainda é lido e vale para todos os donos), `leads`, `chamados`, `ideias` (com `analise`: recomendação, motivo, benefício, riscos, indicador, prazo em dias, impacto, esforço e data; gravada pela sessão de quem envia a ideia), `avaliacoes` (escrita só de gestores), `tarefas`, `campanhas`, `lancamentos` (com `pagos`), leads com `criadoQ` e `respostaEm`, imóveis com `precos` e `importacao`, chamados com `satisfacao`, `tickets` (origem monitor ou manual, chave do assunto, depto, sev, abertoEm, prazoEm, status, sessoes de trabalho, hist, reaberto, solucao, porques, melhoria, atrasoMotivo), `okrs` (depto, tri, objetivo, krs), `sistema/config` (inclui `funil`, `repasseDias`, `caracteristicas`, `heads`, `slaH`, `wip`, `revisoes`), `sistema/log`.
Registros fictícios têm `exemplo: true` e podem ser apagados na tela Dados.

## Testes feitos na versão 13

Motor de cálculo: 164 testes. Telas: 442 verificações em navegador de teste (computador e celular), com dados de exemplo. A análise automática das ideias foi testada com uma IA simulada (resposta boa, resposta fora do formato, erro, texto malicioso). Não testado: Elora AI ao vivo (inclusive a análise das ideias), gravação, downloads, links de mapa, WhatsApp e e-mail abertos de dentro da conta do Rodrigo, e envio de fotos.

## Compartilhamento

A página consta como compartilhada com "qualquer pessoa com o link". Quem tiver o link e estiver logado lê todos os dados, agora inclusive matrícula, códigos de luz e água e telefones. Antes de cadastrar dados reais de clientes, restringir a pessoas convidadas. A restrição também é condição para ligar o envio de fotos.

## O que continua faltando em relação ao sistema de referência

Depende da versão em servidor (domínio, hospedagem, banco com login):
- Site público com busca e mapa, página pública de cada imóvel com formulário "Estou interessado", aplicativo.
- Login por usuário com níveis de acesso; "meus imóveis" por usuário; registro de quem fez cada alteração pelo nome.
- Envio automático de e-mail e WhatsApp, boleto e PIX com baixa automática.
- Exportação para portais (OLX, Zap, Viva Real).
- Estatísticas de visualização por imóvel no site.
- Mapa dentro da tela e preenchimento do endereço pelo CEP.
- Rodízio e avisos rodando sem ninguém com a página aberta.
- Sensores de vazamento, umidade e energia nos imóveis.

Cabe na página e ainda não foi feito:
- Fotos normais e panorâmicas e anexos de documentos (o recurso está desligado, aguardando a decisão sobre o compartilhamento).
- Transporte automático do saldo negativo de repasse.
- Mais de um encargo ou desconto mensal fixo por contrato.
- Regras de comissão por nível, tempo de casa e saída do corretor (aguarda o Rodrigo detalhar).
- Painel de ponto de equilíbrio (oferecido, sem resposta).

## Requisitos do Rodrigo ainda não atendidos

1. **Acesso por website próprio**: aplicação web + banco do `schema.sql` + login. Depende de domínio, hospedagem e banco contratados por ele.
2. **Chatbot de WhatsApp ligado ao sistema e à IA**: API oficial do WhatsApp, servidor e chave de API da Anthropic.

## Decisões pendentes do Rodrigo

1. Corretor responsável e inscrição da Elora no CRECI-SP.
2. Percentuais reais e regras das comissões.
3. Se a participação deve ficar retida quando falta o registro do contrato de associação no sindicato.
4. Validação jurídica das travas e das minutas.
5. A Elora já tem CNPJ?
6. Regulamento do Projeto Boa Ideia.
7. A Elora aceitará só seguro-fiança como garantia?
8. WhatsApp comercial da Elora.
9. Guardar CPF e CNPJ no sistema?
10. Restringir o compartilhamento e ligar o envio de fotos?
11. Apagar a publicação duplicada?
12. Revisar a lista de recebimento, os itens impeditivos e os intervalos de manutenção.
13. Prazo real do repasse ao proprietário.
14. Regra de participação gravada como 0% e 0%: foi teste?
17. Restringir o compartilhamento da página antes de importar dados reais (a importação já existe).
16. Nomes dos heads de cada departamento e prazos reais dos tickets.
15. Revisar os cinco itens da validação das ideias e decidir se o autor também deve ver a análise completa da IA.
18. Confirmar a regra dos 45% (lead próprio do corretor) e se 40/45 também valem para a intermediação da locação.

## Versão 19 (2026-10-08): fotos, anúncio estilo portal e menu de imóveis
- Menu da equipe: Dashboard, Agenda, Imóveis à venda, Imóveis para locação, pasta CRM DE ATENDIMENTO; "Recebimento e manutenção" foi para Originação, ao lado de Corretores Elora.
- Cadastro do imóvel ganhou a seção "Fotos e anúncio": upload de até 20 fotos (capa, reordenar, girar, recortar 4:3/16:9/1:1, brilho, contraste, cômodo e legenda). Marca-d'água Elora na cópia exibida; o original fica guardado para reeditar. Fotos não salvas são apagadas ao cancelar.
- Campos de anúncio: título, destaques, descrição completa, botão "Escrever com a Elora AI" (título, destaques e texto só com os dados do cadastro), visitas.
- Seção "Fatos e características do anúncio": ano de construção, conservação, andares, elevadores, piso, climatização, armários, varanda, vista, pets, lazer, segurança, arredores.
- "Prévia do anúncio" no estilo das páginas de imóvel dos grandes portais: galeria, preço, números, destaques, custo mensal, descrição, fatos agrupados, histórico de preço.
- Capacidade `assets` declarada (armazenamento das fotos). Envio de fotos só para quem pode editar a página, aberta pelo Claude.
- Mesclada a versão de outra sessão: App Elora com perfil Corretor (catálogo, raio-X de venda, clientes) e botão "Raio-X de venda" no portal do corretor.

## Versão 20 (2026-10-08): Programa Elora Associados, contratos e vistorias
- Regras do anexo do Rodrigo, com a mudança dele: a indicação deixou de ser % da comissão líquida; quem indica recebe no máximo 25% da participação do corretor, tirados da parte dele (nunca da Elora).
- Locação: base = Receita Líquida Distribuível (taxa de administração recebida − 25% de custos diretos). Origem 40% da RLD; gestão mensal aprovada no imóvel +5 pontos (45%); Elora com no mínimo 55%.
- Recorrência suspensa quando falta contrato assinado arquivado ou a apólice do seguro-fiança venceu; pagamento parcial = proporcional. Cada recebimento guarda a regra do dia (inclusive gestão e indicação).
- Venda: sobre a comissão líquida (comissão − impostos/taxas configuráveis). Só captação ou só condução 40%; captação + condução até o fechamento 50%; dois corretores dividem os 50% (60% para quem captou); operação especial com % aprovado e motivo. A divisão fica guardada na venda (vendas antigas mantêm a regra antiga).
- Primeiro aluguel (taxa de intermediação) continua pela origem do lead: 40% / 45%.
- Cadastro do imóvel: corretor que indicou + % (até 25%) e gestão mensal aprovada.
- Corretores Elora: painel de ideias que gira a cada 5 s (calculadas da carteira + lote da Elora AI pedido por botão; IA nunca no relógio), rede com recorrência estimada, simulador com gráfico dos próximos 12 meses (carteira de hoje + novas locações + vendas) e escada 1/2/4/6 captações, regras completas, exemplo 3.000 → 240 → 180 → 72 + 9 = 81 / Elora 99, formulário para ajustar a regra com validação de margem.
- Portal do corretor: mesmo painel de ideias e simulador no Início; carteira e extrato mostram RLD, origem, gestão, indicação, suspensão e seguro-fiança.
- Imóveis à venda e para locação: seções "Contratos" (locação: tabela de contratos com documentos; venda: vendas registradas com divisão e minuta) e "Vistorias" (recebimento, última vistoria, pendência, registro de vistoria de entrada/periódica/saída/pré-venda/entrega das chaves; a de entrada marca o laudo no contrato; tudo vai ao diário de bordo).
- Config da nuvem atualizada para o padrão do programa (antes estava com custos e participação em 0%).

## Versão 21 (2026-10-08): registro de captação pelo corretor
- Simulação de um corretor (3 locações e 1 venda) achou um erro, já corrigido: contrato que começa depois do dia de vencimento gerava aluguel "em atraso" inexistente no primeiro mês. Agora o primeiro aluguel vence no mês seguinte.
- "Primeiro aluguel sem lead do funil" (locCorretorPct, hoje 50%) passou a aparecer nas regras e no ajuste; decisão pendente do Rodrigo (40% ou 50%).
- Portal do corretor: menu "Minhas captações" e botão "Registrar captação" (também em Imóveis). Formulário: imóvel, proprietário (cria pessoa, PJ reconhecida), como chegou ao proprietário, autorização escrita (obrigatória), exclusividade, link de documentos, fotos com marca-d'água, observações, indicação de outro corretor (até 25%) e declaração.
- Registro guarda data e hora; mesmo endereço (ou mesmo telefone de proprietário no mesmo bairro e tipo) já registrado é recusado na hora: a origem é de quem registrou primeiro. A tentativa vai ao histórico.
- Captação nasce "aguardando validação": aparece em "Captações para validar" (Imóveis à venda/locação e Corretores Elora) e como ocorrência do monitoramento. Gestor valida (diário de bordo) ou recusa com motivo (a origem sai do corretor; ele vê o motivo).
- Sem validação: recorrência suspensa ("origem da captação ainda não validada") e venda bloqueada.
- "Minhas captações" mostra o caminho de cada imóvel: registro, validação, autorização, fotos, recebimento, oferta/alugado/vendido.

## Versão 22 (2026-10-08): tela Inteligência
- Menu Gestão > Inteligência. Filtros por uso do imóvel e período (90 dias, 12 meses, todo o histórico).
- Topo: tempo para alugar e para vender (medianas), desconto sobre o preço pedido, rentabilidade bruta mediana; aviso de base pequena com menos de 10 negócios.
- Painéis: bairros (preço do m² de aluguel e venda, renda bruta ao ano, dias para alugar/vender, em oferta agora), procura × oferta por bairro ("Captar aqui" quando a procura é o dobro da oferta), tempo com e sem redução de preço, rentabilidade por imóvel, perfil dos clientes (interesse, objetivo, orçamento, canal, bairros pedidos, motivos de perda), comportamento dos proprietários (confirmação em dia, propostas respondidas e tempo, reduções de preço, orçamentos aprovados, retiradas) e qualidade dos dados.
- Leitura do mês pela Elora AI: pedida pelo gestor, com os números da tela, salva em config.intelLeitura para toda a equipe.
- Bairros com grafias diferentes (Jd./Jardim, Vl./Vila, Pq./Parque) contam juntos; o cadastro do imóvel e a captação sugerem os bairros já usados.
- Contrato novo guarda o aluguel pedido do dia (pedidoImovel), para medir o desconto da locação daqui em diante.

## Versão 23 (2026-10-09): Receita por etapa no Financeiro
Pedido do Rodrigo depois da conversa sobre linhas extras de receita e fundo de prêmios ("Como monetizar em cada passo neste projeto?" e "Sim" ao painel).
- Financeiro ganhou a aba **Receita por etapa**, entre Fluxo de caixa e DIMOB. Mostra as dez etapas do imóvel (captação, recebimento e Selo, oferta, fechamento da locação, fechamento da venda, administração mensal, manutenção e reparos, durante o contrato, renovação, saída).
- **Recebido em 12 meses**: taxa de administração, intermediação da locação e comissão de venda, com a parte dos corretores. É a mesma conta do Fluxo de caixa realizado (conferido por teste).
- **Simulação por ano** de cada linha, com a conta escrita embaixo do valor. Linhas de hoje usam a taxa média dos contratos e a comissão de venda da regra. Linhas novas: garantia sem fiador, seguro incêndio, crédito imobiliário, taxa de gestão de reparos, plano de cuidado do imóvel, antecipação de aluguel, taxa de renovação.
- **Cenário**: nove campos (contratos, aluguel médio, taxa de administração, locações novas, intermediação, vendas, valor médio de venda, orçamentos de reparo, contratos que vencem). Em branco, vale o número do sistema; digitado, a conta se refaz na hora. Só gestores alteram e salvam.
- **Fundo de prêmios dos corretores**: percentual só sobre a receita paga por parceiros (garantia, seguro, crédito, antecipação). Não mexe na corretagem nem na participação do Programa Associados.
- Premissas guardadas em `sistema/config`, campo `receitaExtra` (`cen`, `linhas.<linha>.adesao` e `.taxa`, `fundoPct`). Nada mais é gravado.
- A Elora AI da equipe recebe o resumo (`receita_por_etapa`) e sabe que as premissas são provisórias.
- Avisos na tela: nenhuma taxa de administração ou intermediação ao locatário (Lei 8.245/91, art. 22, VII); taxa nova só com cláusula no contrato de administração; produto de parceiro é oferta, nunca condição (CDC, art. 39, I); prêmio só sobre receita recebida.
- Consórcio e outros seguros ficaram fora da conta: o sistema não tem base para estimar.
- O painel só simula. Não foi construído: registrar o produto de parceiro em cada negócio, lançar a comissão do parceiro e o prêmio no extrato do corretor, cobrar a taxa de gestão de reparos, o plano de cuidado e a taxa de renovação.

**Premissas provisórias das linhas novas** (postas pelo Claude para a conta funcionar; não são dado de mercado nem decisão da Elora; trocar pelo que cada parceiro confirmar por escrito):

| Linha | Adesão | Ganho da Elora |
|---|---|---|
| Garantia sem fiador | 30% dos contratos | 1% do aluguel garantido |
| Seguro incêndio | 80% dos contratos | R$ 40 por apólice por ano |
| Crédito imobiliário | 30% do valor vendido | 1% do crédito |
| Taxa de gestão de reparos | 100% dos reparos | 10% do orçamento |
| Plano de cuidado do imóvel | 20% dos imóveis administrados | R$ 50 por mês |
| Antecipação de aluguel | 5% dos aluguéis da carteira | 2% do valor antecipado |
| Taxa de renovação | 70% dos contratos que vencem | 30% de um aluguel |
| Fundo de prêmios | | 30% da receita paga por parceiros |

Testes desta versão: 58 verificações do cálculo e 51 em navegador de teste (computador e celular, claro e escuro, gestor e não gestor, banco sem contratos e banco vazio); as outras telas saíram idênticas à versão anterior (60 telas e contextos comparados). Em 09/10/2026 o banco da página só tinha registros de exemplo (10 contratos e 19 imóveis fictícios), então o "recebido" que aparece é dos exemplos. Não testado dentro da conta do Rodrigo: gravação das premissas e a Elora AI ao vivo.

Decisões pendentes novas: 25. Percentuais e valores reais de cada parceiro (garantia, seguro, crédito, antecipação). 26. Quais taxas novas entram no contrato de administração (gestão de reparos, plano de cuidado, renovação) e com que valor. 27. Percentual do fundo de prêmios e, com o contador, como pagar o prêmio aos corretores. 28. Construir o módulo que registra o produto de parceiro em cada negócio e lança o prêmio no extrato do corretor?

## Versão 24 (2026-10-09): Banco de compradores e Treinamento
- Publicada como versão 28 do artefato (id 1791526806-3888), sobre a versão 23 (Receita por etapa), mesclada sem perdas.
- Banco de compradores (CRM, e "Compradores" no portal do corretor): comprador = lead de Compra com bloco `comprador` (renda familiar, cidade, bairros, quartos, FGTS, recursos próprios, subsídio, consentimento LGPD, crédito com status, banco/correspondente, valor aprovado e validade).
- Documentos só como checklist (os arquivos ficam com o banco ou correspondente).
- Faixa MCMV e capacidade de compra (parcela de até 30% da renda, tabela Price, teto da faixa); faixas e juros configuráveis em "Configurar faixas" (referência; quem aprova é o banco).
- Fila de avisos: compradores com crédito aprovado ou em análise e consentimento, contra imóveis à venda que cabem; texto do aviso pela Elora AI ou modelo, envio por WhatsApp e registro no histórico ("Aviso ao comprador").
- Alertas: aprovação de crédito vencida, perto de vencer (30 dias), compradores para avisar. Inteligência ganhou o painel "Demanda qualificada" (faixa x cidade x imóveis que cabem).
- Treinamento: aba em Corretores Elora (matriz de progresso da equipe, módulos, opção de exigir a trilha para o rodízio) e item "Treinamento" no portal do corretor.
- 9 módulos (6 obrigatórios: programa, captação, atendimento, locação, LGPD, ética); teste de 4 perguntas, aprova com 70%; números do programa vêm da regra em vigor. Gestores criam módulos próprios ("li e entendi").
- Pendente: revisão do jurídico nos módulos com citação de lei.

Decisões pendentes novas: 29. Primeiro aluguel sem lead do funil: 40% ou 50%? 30. A Elora será correspondente Caixa ou trabalhará com um correspondente parceiro? 31. Exigir a trilha do treinamento para o rodízio (hoje desligado)?

## Versão 25 (2026-10-09): Sala de guerra
Pedido do Rodrigo: aba de acesso restrito para monitorar concorrentes (o que fazem, novidades, benchmark), dores dos clientes deles (ex.: Google reviews), banner com sugestões da IA. Publicada como versão 29 do artefato.
- Menu da equipe: "Sala de guerra" logo abaixo do Dashboard; só aparece para gestores (dono ou editor da página). A trava é da tela: quem tem o link e lê o banco ainda vê os dados (limite já conhecido do compartilhamento).
- Radar da Elora AI no alto: gira a cada 6 s entre sugestões calculadas (dor mais citada, onde estamos atrás e à frente, queda de nota de concorrente, nossa nota abaixo da média, fichas desatualizadas, última novidade) e as escritas pela IA a pedido do gestor (config.guerra.sugestoesIA).
- Coleção nova `concorrentes`: nome, cidade, site, Instagram, segmentos, nota e nº de avaliações do Google com histórico, taxa de administração, garantias, diferenciais, pontos fracos, ameaça, `bench`, `dores` (texto sem nome/e-mail/telefone, fonte, data, estrelas, categoria) e `novidades`.
- Abas: Visão geral (mapa de dores com "Nossa resposta" e botão para o recurso do sistema; onde estamos atrás e à frente; últimas novidades), Concorrentes (fichas e links públicos: Google Maps, Reclame Aqui, Biblioteca de anúncios da Meta, notícias, ZAP, Instagram, site), Dores dos clientes (colar avaliações, classificação por palavras-chave em 8 categorias, correção manual), Comparativo (15 itens, coluna da Elora automática pelo sistema), Novidades (concorrente ou mercado) e Comandos da Elora AI (plano de ataque, plano contra um concorrente, campanha sobre a dor, abordagem a proprietário insatisfeito, cliente oculto, o que copiar, forças e fraquezas, leitura das dores).
- A IA não pesquisa a internet: usa só o que a equipe registrou. Regras no prompt: sem avaliação falsa, sem citar ou denegrir concorrente em anúncio, sem abordar autor de avaliação, sem taxa ao locatário.
- Regras do jogo na tela: CONAR art. 32, Lei 9.279/96 art. 195, Resolução COFECI 326/92, CDC art. 37, LGPD; cliente oculto sem documento falso e sem gravar. Coleta automática do Google não é permitida pelos termos dele.
- Dados de mercado já gravados (config.guerra.mercado): pesquisa CRECI-SP Vale do Paraíba jan/2026, garantia digital Creditas+OLX (jun/2025), FipeZap inadimplência e seguro-fiança (out/2025), padrão de reclamações no Reclame Aqui na região.
- Nenhum concorrente cadastrado ainda.

Decisões pendentes novas: 32. Quais são os 5 concorrentes a monitorar? 33. Criar a tarefa agendada semanal "Radar de concorrentes" (pesquisa na web e grava novidades e avaliações na sala de guerra)? 34. Nota atual da Elora no Google.

## Versão 26 (2026-10-09): monitoramento automático dos concorrentes
- 11 concorrentes cadastrados na Sala de guerra a partir de pesquisa pública (09/10/2026): Grupo Intervale (pedido do Rodrigo), Grupo Kaza, Amagai, i9vale, Imóveis Aquarius, Riccio, Realiza Vale, Danelli, Consiglio, Didols e Ferreirinha. Critério das "10 maiores": número de anúncios no Imovelweb por cidade (não há ranking oficial); quem não anuncia no Imovelweb ficou de fora (ex.: Ademir Imóveis, 1.302 no ZAP).
- Fichas trazem porte com fonte, CRECI, Reclame Aqui (Intervale 8,1 "Ótima"; Kaza 4,7 "Não Recomendada", com CNPJ diferente do site, a confirmar). Nota no Google não foi encontrada em fonte pública.
- Tarefa agendada "Radar de concorrentes Elora": todo dia às 8h50 (São Paulo), na nuvem, aprovação automática, aviso no celular. Pesquisa na web cada concorrente e o mercado, grava novidades, dores, Reclame Aqui e notas, e escreve o resumo em config.guerra.radarDia, que aparece no painel "Monitoramento diário" da Visão geral.
- A tela mostra porte, Reclame Aqui e marca "Monitoramento automático" nas novidades gravadas pela tarefa. Publicada como versão 30 do artefato.

## Versão 27 (2026-10-09): decisões do Rodrigo
- Primeiro aluguel sem lead do funil: corretor de origem 20% (locCorretorPct = 20).
- Crédito dos compradores: correspondente bancário parceiro (config.correspondente = "parceiro"); a Elora não será correspondente Caixa.
- Rodízio exige a trilha obrigatória do treinamento (treinoExige = true).
- A Elora ainda não tem perfil no Google; a nota 5,0 gravada na Sala de guerra foi apagada e o radar sugere criar o perfil.
- Heads: Operações - Pedro (Imóveis, Locação e Pós-venda); Corretores - Fabiana; AI/Tech - Guilherme (departamento novo "Tecnologia", que recebe os tickets do setor Dados). Comercial, Financeiro, Jurídico e Gestão sem head.
- Rodrigo disse "sim" a informar CRECI, WhatsApp, PIX e os valores dos parceiros, mas os dados ainda não foram enviados.
- Cópias antigas do sistema (VvbovZHdiviRUw3fgFi2n5 e WbasjNtMFWa9PcnA5jdnuu) apagadas a pedido; a do 08/10 era uma versão anterior, tudo dela já estava na atual. Publicada como versão 31.
- E-book "De 100 a 1000 locações" (Matheus Penna, UP Estate) analisado; proposta: funil de captação com cadência e painel semanal de métricas da locação.

## Versão 28 (2026-10-09): botões de WhatsApp
- Botão verde "WhatsApp" (abre wa.me com DDI 55 e mensagem pronta) em: cartões do quadro de leads (equipe e corretor), Atendimento do lead (contato e "Enviar no WhatsApp" em cada imóvel sugerido), tarefas da Agenda ligadas a lead, Banco de compradores, Pessoas, aluguéis do mês ("Cobrar no WhatsApp" quando em atraso, com mês, valor, vencimento e PIX pelo app), repasse pago ("Avisar no WhatsApp" ao proprietário), solicitações do Pós-venda abertas e Corretores Elora.
- Clique em botão de lead grava "Mensagem" (ou "Imóvel enviado") no histórico do lead, com "pelo WhatsApp".
- Cadastro do corretor ganhou o campo WhatsApp. Botão só aparece quando há telefone com DDD. Publicada como versão 32.

## Versões 29 e 30 (2026-10-10): qualificação, prospecção, sequências, chat e reuniões
- **Qualificação do lead** (no Atendimento): roteiro por tipo (locação 9 perguntas, compra 10), essenciais marcados; temperatura (quente, morno, frio) e "pronto para o corretor"; mensagem pronta com as próximas perguntas (lead de anúncio começa pelo imóvel do anúncio) e botão "Perguntar no WhatsApp"; "Colar conversa do WhatsApp": a Elora AI preenche e a pessoa confere; aviso quando o imóvel do anúncio não cabe; "Imóveis que cabem no bolso dele" (locação: renda ≥ 3× aluguel + condomínio; compra: entrada + financiamento com parcela até 30% da renda). Dados em lead.qualif. Cartão do quadro mostra a qualificação.
- **Prospecção** (Originação; e no portal do corretor): coleção `prospects` (descrição, negócio, endereço, bairro, fonte, link, proprietário, telefone, responsável, etapa mapeado/prospecção/conversou/captado/perdido, tentativas com canal e resultado, retorno combinado, motivo da perda). Cadência de 6 tentativas (dias 0, 1, 3, 7, 14, 21) alternando ligação e WhatsApp; fila de hoje; metas diárias configuráveis (mapear 20, contatos 5); aviso de duplicado; mensagem de abordagem por fonte com saída LGPD; "Captado" abre o cadastro do imóvel preenchido.
- **Sequências** (CRM; "Mensagens do dia" no portal do corretor): passos por dia para locação e compra, editáveis pelos gestores (config.flows), com {nome}, {quem}, {opcoes}, {qualif}; botão envia pelo WhatsApp, marca o passo (lead.flow) e grava no histórico; pausar/retomar por lead.
- **Chat da equipe**: coleção `chat` (canal geral e um por departamento; corretor vê Geral e Corretores); conversa interna de cada cliente no Atendimento (canal lead:<id>). Nome do autor informado no navegador (sem login). Carrega as 400 mensagens mais recentes.
- **Reuniões** (Gestão): painel da semana (novas captações e locações por tipo, ativas, rescisões, funis de captação e locação, giro da oferta, retorno de rescisões à oferta, perdidas para o mercado, custo por locação); "Nova reunião semanal" com pauta automática; ata e ações pela Elora AI; ação vira tarefa na Agenda. Coleção `reunioes`.
- Publicadas como versões 33 e 34 do artefato.

## Versão 31 (2026-10-10): menu em pastas e acesso por gestor
- Equipe: Rodrigo (dono, vê tudo), Pedro (Operações), Fabiana (corretores, venda e locação), Guilherme (informática/AI-Tech).
- Menu da equipe: Dashboard, Agenda e Chat da equipe (todos) + pastas Comercial (Atendimentos, Sequências, Campanhas, Banco de compradores, Prospecção, Corretores Elora, Relatórios, Rodízio e funil), Imóveis (à venda, para locação, Recebimento e manutenção), Operações (Locação, Financeiro, Pós-venda, Pessoas), Gestão (Reuniões, Tickets e Kanban, Resultados e OKRs, Projeto Boa Ideia), Diretoria (Sala de guerra, Inteligência, Jurídico, Acessos; só o dono) e Tecnologia (Dados).
- Acessos padrão: Pedro = Imóveis, Operações, Gestão; Fabiana = Comercial, Imóveis, Gestão; Guilherme = Tecnologia, Gestão. Editável na tela Acessos (config.acessos).
- Quem não é o dono da página escolhe "Quem está usando?" (guardado no navegador); o menu e o acesso pelo endereço respeitam as pastas. O dono é reconhecido pela conta (isOwner). Limite: sem login, a pessoa pode trocar de nome e quem tem o link lê os dados; a trava completa depende do login no servidor. Publicada como versão 35.

## Versão 32 (2026-10-10): Mapa de oportunidades na Inteligência
- Painel "Mapa de oportunidades" (locação e venda): placar de 0 a 100 por bairro e tipo de imóvel (apartamento, casa, galpão, sala ou loja, terreno). Pesos: procura × oferta até 50 (leads e compradores abertos que pedem o bairro, contra imóveis em oferta), dias para alugar ou vender até 20, rentabilidade até 10, notícias de obra, empresa ou empreendimento no bairro até 10, captações perdidas para o mercado e compradores com crédito aprovado até 10. Ação: Captar já (70+), Captar (50+), Observar (30+), Sem urgência. Frase de explicação em cada linha; "base pequena" quando há pouco dado. Botão "Mapear imóveis aqui" abre a Prospecção com o bairro. Nome de cidade no pedido do lead não conta como bairro.
- Painel "Indicadores públicos": FipeZap da cidade (aluguel e venda por m², variação em 12 meses, rentabilidade) e pesquisa CRECI-SP do Vale, comparados ao preço pedido na carteira; lista de obras, empresas e empreendimentos por bairro. Dados em config.mercadoExt e guerra.mercado (itens com "bairros").
- A leitura do mês pela Elora AI recebe o mapa e os indicadores.
- Tarefa agendada renomeada para "Radar de concorrentes e mercado Elora" (mesmo horário, 8h50 de São Paulo, diária): agora também busca FipeZap, CRECI-SP e notícias de infraestrutura por bairro e grava em mercadoExt e guerra.mercado. Publicada como versão 36.
- Limite: preço de fechamento por bairro de fora da carteira não é público e gratuito (cartório/DataZAP são pagos); o mapa é indicação, não previsão, e ganha força com o volume de registros.

## Simulação de operação completa (2026-10-10) e versão 33
- Simulação do zero (base limpa): corretora, proprietário, prospecção → captação, cadastro do imóvel (105 campos), recebimento (24 itens), lead do Instagram → rodízio → aceite no portal, qualificação por conversa colada (100%, quente), visita e proposta, contrato (35 campos), vistoria, recebimento do 1º aluguel (taxa 8% = R$ 172) e repasse (R$ 1.978), extrato da corretora, App Elora (PIX e chamado), triagem, comprador MCMV → fila de avisos → venda registrada e comissão, reunião semanal, dashboard, mapa, celular. Todos os passos concluídos.
- Erro corrigido: contrato que começa no próprio dia do vencimento cobrava o 1º aluguel na assinatura (cobrança antecipada, vedada com garantia pela Lei 8.245/91, art. 20) e já aparecia "em atraso". Agora o 1º aluguel vence no mês seguinte, salvo contrato marcado como antecipado.
- Padrão do 1º aluguel sem lead do funil ajustado para 20% (decisão do Rodrigo) também no valor de fábrica.
- Pontos fracos registrados: cadastro de imóvel longo; sem login; integrações dependem de servidor; cada coleção carrega no máximo 1.000 registros (limite de escala da página); alertas demais numa base pequena. Publicada como versão 37.

## Versão 34 (2026-10-11): demanda real por renda e Inteligência reorganizada
- Inteligência em três assuntos (botões, sem abas novas): Onde captar (Mapa de oportunidades com os 6 primeiros e "Ver todos", Demanda real por renda, Procura × oferta, Demanda qualificada MCMV), Preço e liquidez (Indicadores públicos, Bairros, Tempo e preço, Rentabilidade) e Clientes e proprietários (Perfil, Proprietários, Qualidade dos dados). No topo, sempre visíveis: filtros, números, "O que fazer agora" (até 3 ações) e a leitura do mês pela Elora AI.
- Demanda real por renda (locação e compra): faixas até R$ 3,5 mil, 3,5–7, 7–12, 12–20 e acima de 20 mil × tipo de imóvel; clientes, preço ou aluguel que cabe (locação: aluguel com condomínio até 1/3 da renda; compra: capacidade de compra ou crédito aprovado), imóveis em oferta que cabem, quantos faltam, orçamentos acima da renda e cobertura (quantos leads têm renda). Botão "Captar" abre a Prospecção com o tipo e a faixa de preço. Números agregados (LGPD); renda nunca usada para recusar atendimento. A leitura da Elora AI recebe esse painel. Publicada como versão 39 (2026-10-11), já juntando a busca de imóveis por frase do App Elora, feita em outra sessão (o cliente fala pelo microfone do teclado ou escreve; vira lead com o canal App Elora).

## Versão 35 (2026-10-11): trilha das solicitações e manuais em PDF
- **Trilha de andamento** (pontos ligados por linha: verde feito, dourado passo atual, vermelho travou) em tudo que depende de solicitação: solicitações do Pós-venda (equipe, portal do proprietário, portal do locatário e App), tickets, Projeto Boa Ideia, captações (painel da equipe e Minhas captações), cobranças e pagamentos avisados pelo app (App e Financeiro > App e pagamentos, versão compacta na tabela), lead no Atendimento (entrada, distribuição, aceite, 1º contato, qualificação), propostas (Atendimento e resposta do proprietário no App) e crédito do comprador. No celular, só os pontos e os títulos.
- **Manuais em PDF no modelo Elora** (capa verde com ELORA, filete dourado, sumário; páginas com cabeçalho, rodapé e numeração), gerados no navegador na hora do download, com as regras em vigor (jsPDF 2.5.1 do cdnjs, carregado só ao baixar):
  - Corretores: um por módulo do treinamento (objetivo, o que precisa saber, passo a passo no sistema, checklist, atenção, perguntas de fixação e gabarito). Módulos criados pela gestão também geram manual.
  - Gestores: como operar o sistema por pasta (Primeiros passos, Comercial, Imóveis, Operações, Gestão, Diretoria, Tecnologia), tela por tela: para que serve, como usar, regras e cuidados, rotina sugerida. Cada gestor só baixa os das pastas liberadas em Acessos; Diretoria só o dono.
- Onde ficam: Treinamento do corretor (seção "Manuais de instrução" e botão em cada módulo), Corretores Elora > Treinamento (manuais dos corretores e dos gestores) e o botão do livro ao lado do sino, em todas as telas, que abre a lista com a área da tela em destaque.
- Sem o download do Claude, tenta o download direto do navegador. Publicada como versão 40 do artefato (2026-10-11).

## Versão 36 (2026-10-11): lead pronto para o corretor (Fase 1)
Pedido do Rodrigo após ver anúncio de CRM com IA que "conversa, qualifica e entrega o lead pronto". Fase 1 = dentro da página; Fase 2 (robô 24 h no WhatsApp, com servidor, API oficial do WhatsApp Business e API do Claude) ficou para decisão: número, provedor e quem mantém (Guilherme).
- **Trava do lead pronto** (config.soLeadPronto, padrão ligado; caixa em Rodízio e funil): o rodízio automático só entrega ao corretor o lead da imobiliária com as perguntas essenciais respondidas (locação: tipo, bairros, orçamento, renda, prazo; compra: tipo, bairros, valor, forma de pagamento, renda, prazo). Lead trazido pelo corretor não muda. O gestor pode entregar antes ("Entregar mesmo assim"), com aviso.
- Quando o lead fica pronto, o sistema grava `prontoEm` e "Pronto para o corretor" no histórico (só na passagem de não pronto para pronto) e, com o rodízio automático ligado, distribui na hora.
- **Pré-atendimento** no alto de Atendimentos (painel que abre e fecha): leads aguardando qualificação, com o que falta, "Perguntar no WhatsApp" (mensagem pronta com as próximas perguntas) e Atendimento (onde a Elora AI preenche a partir da conversa colada); e **Prontos hoje**, com o corretor e o tempo da entrada até ficar pronto.
- Trilha do lead passa a ser Entrada → Qualificação → Distribuição → Aceite → 1º contato.
- **App Elora**: o "Tenho interesse" e o pedido de busca perguntam para quando, renda da família (opcional, nunca usada para recusar atendimento), forma de pagamento (compra) ou garantia (locação) e bairros (pedido de busca). As respostas vão para a qualificação; o bairro e o valor do imóvel escolhido completam o pedido. Respondido o essencial, o lead chega pronto e o cliente vê "um corretor fala com você em breve".
- Publicada como versão 41 do artefato. Testes: ui27 (16 verificações) e regressões ui2, ui3, ui4, ui17, ui22–ui26 (os testes antigos de rodízio rodam com a trava desligada).

## Versão 37 (2026-10-11): Elora Pós-Chaves e marketplace de serviços
Pedido do Rodrigo: trocar "Pós-venda" por "Elora Pós-Chaves"; depois da compra (ou locação), o corretor gera receita participando de serviços contratados pelo cliente (mudança, limpeza, manutenção, locação e administração); só existe remuneração com margem efetivamente gerada; no app, o cliente tem várias opções de profissionais (marketplace).
- **Nome**: menu, tela, Dashboard, OKRs, tickets, sino, Chat, Projeto Boa Ideia, guia da Elora AI e manuais mostram "Elora Pós-Chaves". O dado guardado do departamento continua "Pós-venda" (tickets, OKRs e heads antigos seguem valendo; a troca é só na tela, função `nd`).
- **Tela da equipe** em duas abas: Marketplace de serviços (padrão) e Solicitações e contratos (o conteúdo antigo).
- Coleções novas: `parceiros` (nome, cats, comissaoPct, whatsapp, cidades, prazo, desc, ativo) e `servicos` (cat, parceiroId, cliente {perfil, quem, nome, tel}, imovelId, corretorId, descricao, quando, status pedido/orcamento/aprovado/executado/cancelado, orcamento {valor, prazo, obs, em}, margemPct, margemRecebida, recebidaEm, corPct, avaliacao, hist).
- Categorias: Mudança e frete, Limpeza, Eletricista e encanador, Reforma e pintura, Móveis planejados e montagem, Ar-condicionado, Segurança e automação, Jardim e piscina, e "Alugar com a Elora" (só proprietário e comprador), que abre captação na Prospecção (fonte "Elora Pós-Chaves") e segue o Programa Associados.
- **Fluxo**: cliente pede no app (aba Serviços do comprador; entrada no Início e em Mais para proprietário e locatário), escolhendo o parceiro ou "Deixe a Elora indicar" → equipe registra o orçamento (guarda a comissão do parceiro) → cliente aprova no app (ou a equipe registra) → serviço feito → equipe registra a margem recebida do parceiro → participação do corretor = margem recebida × % do dia (guardado no pedido) → cliente avalia (nota 0–10 aparece para os próximos clientes). Trilha em cada pedido.
- **Corretor do cliente**: comprador = corretor da venda (ou do imóvel); locatário e proprietário = corretor de origem do imóvel.
- **Participação do corretor**: 30% da margem recebida (config.posChavesCorPct, provisório, só gestores alteram). Sem margem recebida, nada.
- Clientes em jornada: compras dos últimos 180 dias e locações iniciadas nos últimos 90, com mensagem pronta "Oferecer os serviços" e "Registrar pedido".
- Portal do corretor: Meus ganhos > Pós-Chaves (participação recebida, previsão, clientes em jornada, pedidos). Ainda não entra no Extrato.
- Avisos: pedido sem orçamento há 2 dias (Pós-Chaves) e margem não recebida 30 dias depois do serviço (Financeiro).
- Treinamento: módulo opcional "Elora Pós-Chaves: serviços depois das chaves" (4 perguntas) e manual em PDF; manual da pasta Operações atualizado.
- Regras na tela e no app: oferta, nunca condição (CDC, art. 39, I); o app informa que a Elora recebe comissão do parceiro (CDC, art. 6º, III); cliente contrata e paga direto ao profissional.
- Nenhum parceiro real cadastrado ainda. Publicada como versão 42 do artefato.

Decisões pendentes novas: 35. Percentual do corretor na margem do Pós-Chaves (hoje 30%, provisório). 36. Parceiros reais e comissão de cada um, por escrito. 37. A participação do Pós-Chaves deve entrar no Extrato e no pagamento mensal do corretor?

## Versão 38 (2026-10-12): listas de serviços no Elora Pós-Chaves
- Ícones novos no app (aba Serviços): **Reparos, reformas e outros serviços**, **Assistência técnica** e **Jurídico**, cada um com barra de seleção (lista com grupos) e campo "Explique o serviço".
  - Reparos (antigo "Eletricista e encanador"; "Reforma e pintura" saiu da grade e virou item da lista): Mais pedidos (marido de aluguel, encanador, eletricista, desentupidor e chaveiro de urgência, assistência técnica), Reformas e reparos, Construção, Instalação, Serviços gerais, Para casa e Aluguel de maquinário (47 itens).
  - Assistência técnica: adega, fogão e cooktop, geladeira e freezer, lava-louça, máquina de costura, máquina de lavar, micro-ondas, secadora.
  - Jurídico: advogado, mediação de conflitos, testamento e planejamento patrimonial. **Sem comissão para a Elora**: advogado não pode pagar por indicação (Lei 8.906/94, art. 34, III e IV); o app avisa e o orçamento grava margem 0.
- Pedido guarda `sub` (serviço escolhido) e `urgente` (caixa "É urgente" ou item de urgência). Pedido urgente gera aviso de bloqueio na hora; equipe e cliente veem a etiqueta Urgente.
- A equipe e o corretor também registram pedidos com a lista completa. Publicada como versão 43 do artefato.

## Versão 39 (2026-10-12): fundo do Projeto Boa Ideia no Elora Pós-Chaves
- Pedido do Rodrigo: avisar aos corretores que uma % das operações do Elora Pós-Chaves cobre os custos do Projeto Boa Ideia.
- Regra: de cada margem recebida dos parceiros, **10% (provisório; config.posChavesFundoPct, máx. 50%)** vão para o fundo do Projeto Boa Ideia, antes da divisão; o corretor recebe 30% (posChavesCorPct) **do restante**. Ex.: margem R$ 180 → Boa Ideia R$ 18 → corretor R$ 48,60 → Elora R$ 113,40. O pedido guarda `fundoPct` e `corPct` do dia (margens antigas sem `fundoPct` ficam com fundo 0).
- Onde o corretor vê: aviso fixo no portal (Meus ganhos > Pós-Chaves), cabeçalho da tela, módulo de treinamento (texto, exemplo e pergunta nova) e manual em PDF. Na equipe: "Como a remuneração funciona", janela da margem, registro no histórico e campos para ajustar os dois percentuais.
- Projeto Boa Ideia (equipe e corretor) mostra o fundo arrecadado (12 meses e total).
- Publicada como versão 44 do artefato.
Decisão pendente nova: 38. Percentual definitivo do fundo Boa Ideia (hoje 10%) e se ele também entra no pagamento das recompensas já combinadas.

## Versão 40 (2026-10-12): Mudança Plug & Play no Elora Pós-Chaves
- Ícone novo (primeiro da grade, para proprietário, locatário e comprador): **Mudança Plug & Play**, serviço da própria Elora por **taxa fixa de R$ 150** (config.plugPlayValor; gestores alteram na tela).
- Página explica o serviço: encerrar luz, água, gás e internet no endereço antigo, transferir as contas de luz e água (e gás) do novo imóvel para o nome do cliente e agendar a internet para o dia da mudança. Custos das próprias companhias ficam com o cliente. Serviço opcional.
- Contratação: data da mudança, WhatsApp, endereço antigo, itens desejados, operadora preferida, explicação e **autorização para procuração** (obrigatória; a procuração em si é enviada pela equipe para assinatura digital fora do sistema). Nenhuma senha é pedida; fotos das contas vão pelo WhatsApp.
- Ao contratar: pedido nasce aprovado (orçamento R$ 150, margem 100%) e gera **cobrança de R$ 150 no app** (PIX ou cartão, aba Pagar; tipo "Serviço Elora Pós-Chaves"). Cancelar o pedido apaga a cobrança não paga.
- Equipe: botões de tarefa (procuração assinada, desligamentos, luz, água, gás, internet), "Tudo pronto" e, com a taxa paga, "Registrar a margem recebida" (sugere R$ 150; vale a regra do fundo Boa Ideia e do corretor). Trilha: Pedido → Procuração → Desligamentos → Luz, água e internet → Taxa recebida (cliente vê "Pronto").
- Comissão de operadora de internet: cadastrar a operadora como parceiro e avisar o cliente (não automatizado).
- Publicada como versão 45 do artefato.

## Versão 41 (2026-10-12): Elora Pós-Chaves passa a se chamar Elora Casa+
- Decisão do Rodrigo: o programa de serviços (antigo Pós-venda, depois Elora Pós-Chaves) agora é **Elora Casa+** em todas as telas: menu (Operações > Elora Casa+), portal do corretor (Meus ganhos > Elora Casa+), app (entrada no Início, Mais, aba Serviços), avisos, treinamento, manuais em PDF, guia da Elora AI e textos das cobranças novas.
- Nomes internos não mudaram (view `posvenda` e `poschaves-c`, módulo `poschaves`, fonte `poschaves`, config `posChaves*`, departamento gravado "Pós-venda"), para não perder dados. Cobranças já criadas guardam o texto antigo.
- Nas seções acima, onde se lê "Elora Pós-Chaves", vale "Elora Casa+". Publicada como versão 46 do artefato.

## Versão 42 (2026-10-12): App Elora em inglês e espanhol
- Três bandeiras (Brasil, EUA, Espanha) ao lado do sino, no alto do App Elora, para todos os perfis. A escolha fica guardada no navegador (prefLer 'appLang'). No celular, o rótulo do perfil some e fica só a inicial, para caber.
- Tradução por dicionário (cerca de 880 frases e trechos, mais regras para textos com números e meses: out/26 → oct/26 ou oct/26 em espanhol), aplicada a tudo o que entra no app, nas janelas e nos avisos enquanto o app está aberto (MutationObserver). Inclui telas de todos os perfis, Elora Casa+ (com as listas de serviços), formulários, mensagens de confirmação e erros.
- Ficam em português: nomes, endereços e textos digitados (descrição de imóvel, pedido do lead), mensagens prontas para enviar ao cliente pelo WhatsApp e documentos legais (recibo, demonstrativo, contrato, diário de bordo). O sistema da equipe continua só em português.
- Elora AI no app responde no idioma escolhido (instrução no pedido).
- Texto novo no app que não estiver no dicionário aparece em português até ser incluído (lista em I18N_APP).
- Publicada como versão 47 do artefato.
