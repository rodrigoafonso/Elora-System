# Migração das telas (protótipo → React)

O protótipo aprovado (`frontend/public/legacy/elora-partner-os.html`, versão 52) é a **especificação visual e de comportamento**.
Usamos o padrão *Strangler Fig*: a casca (menu, rotas, estilos) já é React; cada tela é reescrita uma a uma.
Enquanto não migra, a tela abre o protótipo embutido (`LegacyScreen`), sem o menu dele — para o usuário, é o mesmo sistema.

> Atenção: telas embutidas ainda usam os dados do próprio protótipo (gravados no navegador). Só as telas migradas falam com a API.

## Como migrar uma tela

1. Leia a função `view<Tela>()` no protótipo e copie o **markup e as classes** (o CSS é o mesmo: `src/styles/elora.css`).
2. Regras puras → `src/domain/<modulo>`; orquestração → `src/application/<modulo>`; portas → `src/application/ports`.
3. Repositório em memória (`infrastructure/<modulo>/memoria.ts`) + HTTP (`httpRepositories.ts`) + esquema zod.
4. Página em `src/presentation/pages/<modulo>`; registre em `src/app/Tela.tsx` e marque `migrada: true` em `navigation/menu.ts`.
5. Back-end: módulo em `backend/.../<modulo>` (domain → application → infrastructure → api) + migração Flyway.
6. Testes (domínio, caso de uso e tela) e compare o print com o protótipo.
7. Atualize esta tabela.

## Situação

O menu é organizado por áreas (Hoje, Clientes, Imóveis, Operações, Equipe, Análises, Configurações). Telas irmãs são uma
linha do menu e aparecem como abas no alto da tela (`MENU` em `navigation/menu.ts`; no protótipo, `GRUPOS_TELA`). As rotas não mudaram.
Ao migrar uma tela que faz parte de um grupo, a página React precisa mostrar as mesmas abas (`.subnav`).
"Buscar ou ir para" (Ctrl+K) fica no alto do menu: na plataforma, busca telas; no protótipo, também imóveis, clientes, pessoas e contratos.

### Equipe

| Área | Entrada no menu | Tela (aba) | Rota | Situação |
|---|---|---|---|---|
| Hoje | Dashboard | — | `central` | ⏳ protótipo embutido |
| Hoje | Agenda | — | `agenda` | ⏳ protótipo embutido |
| Hoje | (no alto de cada tela) | Chat da equipe | `chat` | ⏳ protótipo embutido |
| Clientes | Atendimentos | Funil de atendimento | `comercial` | ⏳ protótipo embutido |
| Clientes | Atendimentos | Compradores | `compradores` | ⏳ protótipo embutido |
| Clientes | Atendimentos | Sequências | `flows` | ⏳ protótipo embutido |
| Clientes | Pessoas | — | `pessoas` | ⏳ protótipo embutido |
| Clientes | Campanhas | — | `campanhas` | ⏳ protótipo embutido |
| Imóveis | Imóveis | Para locação | `im-locacao` | ⏳ protótipo embutido |
| Imóveis | Imóveis | À venda | `im-venda` | ⏳ protótipo embutido |
| Imóveis | Imóveis | Recebimento e manutenção | `im-cuidado` | ⏳ protótipo embutido |
| Imóveis | Captação | — | `prospeccao` | ⏳ protótipo embutido |
| Operações | Locação | — | `locacao` | ✅ React |
| Operações | Financeiro | — | `financeiro` | ⏳ protótipo embutido |
| Operações | Elora Casa+ | — | `posvenda` | ✅ React |
| Equipe | Corretores | Corretores | `rede` | ⏳ protótipo embutido |
| Equipe | Corretores | Rodízio e funil | `rodizio` | ⏳ protótipo embutido |
| Equipe | Tickets e Kanban | — | `tickets` | ⏳ protótipo embutido |
| Equipe | Reuniões | — | `reunioes` | ⏳ protótipo embutido |
| Equipe | Projeto Boa Ideia | — | `ideias` | ⏳ protótipo embutido |
| Análises | Relatórios | Comercial | `desempenho` | ⏳ protótipo embutido |
| Análises | Relatórios | Resultados e OKRs | `resultados` | ⏳ protótipo embutido |
| Análises | Inteligência | Inteligência | `inteligencia` | ⏳ protótipo embutido |
| Análises | Inteligência | Sala de guerra (só o dono) | `guerra` | ⏳ protótipo embutido |
| Configurações | Configurações | Empresa e jurídico (só o dono) | `juridico` | ⏳ protótipo embutido |
| Configurações | Configurações | Acessos (só o dono) | `acessos` | ⏳ protótipo embutido |
| Configurações | Configurações | Dados | `dados` | ⏳ protótipo embutido |

### Portal do corretor

| Área | Entrada no menu | Tela (aba) | Rota | Situação |
|---|---|---|---|---|
| Hoje | Início | — | `inicio` | ⏳ protótipo embutido |
| Hoje | Agenda | — | `agenda-c` | ⏳ protótipo embutido |
| Hoje | Mensagens do dia | — | `flows-c` | ⏳ protótipo embutido |
| Hoje | (no alto de cada tela) | Chat da equipe | `chat-c` | ⏳ protótipo embutido |
| Clientes | Atendimentos | Funil | `crm-c` | ⏳ protótipo embutido |
| Clientes | Atendimentos | Meus leads | `leads-c` | ⏳ protótipo embutido |
| Clientes | Atendimentos | Compradores | `compradores-c` | ⏳ protótipo embutido |
| Imóveis | Imóveis em oferta | — | `imoveis-c` | ⏳ protótipo embutido |
| Imóveis | Captação | Minhas captações | `capt-c` | ⏳ protótipo embutido |
| Imóveis | Captação | Prospecção | `prosp-c` | ⏳ protótipo embutido |
| Meus ganhos | Carteira e extrato | Carteira | `carteira` | ⏳ protótipo embutido |
| Meus ganhos | Carteira e extrato | Extrato | `extrato` | ⏳ protótipo embutido |
| Meus ganhos | Elora Casa+ | — | `poschaves-c` | ⏳ protótipo embutido |
| Elora | Treinamento | — | `treino-c` | ⏳ protótipo embutido |
| Elora | Projeto Boa Ideia | — | `ideias-c` | ⏳ protótipo embutido |
| Elora | Elora AI | — | `ia` | ⏳ protótipo embutido |

### App Elora (proprietário, locatário e comprador)

| Tela | Rota | Situação |
|---|---|---|
| App Elora (pt, en, es) | `/app` | ⏳ protótipo embutido em tela cheia |

## Cadastrar imóvel com IA

- **Protótipo v51 pronto** (Imóveis da equipe e "Minhas captações" do corretor). Desenho de produção em
  [`funcionalidades/cadastro-com-ia.md`](funcionalidades/cadastro-com-ia.md): tabelas, arquivos com retenção, IA no servidor, API e permissões.
- Falta: migrar para React junto com o módulo Imóveis.

## Divulgação (link, prévia no WhatsApp e brochure)

- **Back-end pronto** (módulo `divulgacao`, migração V7, ADR 0006): `POST/GET /api/v1/divulgacao/envios` e o link público `GET /i/{código}?e={envio}`
  com metatags Open Graph, redirecionamento ao site e registro de abertura (robôs de prévia não contam).
- **Telas no protótipo** (v49): botão "Enviar ao cliente" do app do corretor com a prévia do WhatsApp, o link do envio e o aviso de abertura;
  oferta da equipe com link por cliente; brochure em PDF e imagens para o WhatsApp na ficha do imóvel e no envio.
- Falta: ligar essas telas à API quando Imóveis e Comercial forem migrados; preencher `foto_capa_url` quando as fotos forem para o
  armazenamento de arquivos; configurar `ELORA_SITE_URL` e o proxy do site para `/i/*`.

## Pendências conhecidas das telas migradas

### Locação

- **Documentos** (minuta do contrato, recibos e termo aditivo de reajuste em Word): ainda não portados; o botão volta quando o gerador de documentos for migrado.
- **Situação "Em atraso"** na tabela: depende das cobranças, que chegam com a migração do Financeiro.
- **"+ Cadastrar agora…"** no campo Locatário: depende da tela Pessoas; por enquanto o locatário precisa estar cadastrado.
- Regras da casa já aplicadas (15/10/2026): garantia só seguro-fiança, caução só com o consentimento do locador (data registrada); seguro do imóvel perguntado ao cliente e em vigor durante todo o contrato, com aviso de renovação na agenda. Ainda fixas no código; podem virar configuração da imobiliária.

### Elora Casa+

- **Pacote Chegada e Casa+ Empresas** (protótipo v48) já migrados na visão da equipe. No app, o pacote continua no protótipo até o App Elora ser migrado. A opção "Precisa encontrar o imóvel?" fica gravada no pacote; a abertura automática do atendimento no Comercial chega com a migração do Comercial.

- Aba **Solicitações e contratos**: ainda abre o protótipo.
- **Mudança Plug & Play**: as tarefas (procuração, desligamentos, ligações) e a cobrança da taxa ainda não foram portadas; o pedido segue o fluxo comum.
- Perfis e permissões (gestor x equipe) aguardam o login (OIDC); hoje a equipe vê como gestora.
