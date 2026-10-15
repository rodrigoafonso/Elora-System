# Migração das telas (protótipo → React)

O protótipo aprovado (`frontend/public/legacy/elora-partner-os.html`, versão 47) é a **especificação visual e de comportamento**.
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

### Equipe

| Pasta | Tela | Rota | Situação |
|---|---|---|---|
| — | Dashboard | `central` | ⏳ protótipo embutido |
| — | Agenda | `agenda` | ⏳ protótipo embutido |
| — | Chat da equipe | `chat` | ⏳ protótipo embutido |
| — | Atendimentos | `comercial` | ⏳ protótipo embutido |
| — | Sequências | `flows` | ⏳ protótipo embutido |
| — | Campanhas | `campanhas` | ⏳ protótipo embutido |
| — | Banco de compradores | `compradores` | ⏳ protótipo embutido |
| — | Prospecção | `prospeccao` | ⏳ protótipo embutido |
| — | Corretores Elora | `rede` | ⏳ protótipo embutido |
| — | Relatórios | `desempenho` | ⏳ protótipo embutido |
| — | Rodízio e funil | `rodizio` | ⏳ protótipo embutido |
| — | Imóveis à venda | `im-venda` | ⏳ protótipo embutido |
| — | Imóveis para locação | `im-locacao` | ⏳ protótipo embutido |
| — | Recebimento e manutenção | `im-cuidado` | ⏳ protótipo embutido |
| — | Locação | `locacao` | ⏳ protótipo embutido |
| — | Financeiro | `financeiro` | ⏳ protótipo embutido |
| — | Elora Casa+ | `posvenda` | ✅ React |
| — | Pessoas | `pessoas` | ⏳ protótipo embutido |
| — | Reuniões | `reunioes` | ⏳ protótipo embutido |
| — | Tickets e Kanban | `tickets` | ⏳ protótipo embutido |
| — | Resultados e OKRs | `resultados` | ⏳ protótipo embutido |
| — | Projeto Boa Ideia | `ideias` | ⏳ protótipo embutido |
| — | Sala de guerra | `guerra` | ⏳ protótipo embutido |
| — | Inteligência | `inteligencia` | ⏳ protótipo embutido |
| — | Jurídico | `juridico` | ⏳ protótipo embutido |
| — | Acessos | `acessos` | ⏳ protótipo embutido |
| Tecnologia | Dados | `dados` | ⏳ protótipo embutido |

### Portal do corretor

| Pasta | Tela | Rota | Situação |
|---|---|---|---|
| Início | Início | `inicio` | ⏳ protótipo embutido |
| Início | Atendimentos | `crm-c` | ⏳ protótipo embutido |
| Início | Mensagens do dia | `flows-c` | ⏳ protótipo embutido |
| Início | Meus leads | `leads-c` | ⏳ protótipo embutido |
| Início | Imóveis | `imoveis-c` | ⏳ protótipo embutido |
| Início | Minhas captações | `capt-c` | ⏳ protótipo embutido |
| Início | Prospecção | `prosp-c` | ⏳ protótipo embutido |
| Início | Compradores | `compradores-c` | ⏳ protótipo embutido |
| Início | Agenda | `agenda-c` | ⏳ protótipo embutido |
| Início | Carteira | `carteira` | ⏳ protótipo embutido |
| Início | Extrato | `extrato` | ⏳ protótipo embutido |
| Início | Elora Casa+ | `poschaves-c` | ⏳ protótipo embutido |
| Início | Chat da equipe | `chat-c` | ⏳ protótipo embutido |
| Início | Treinamento | `treino-c` | ⏳ protótipo embutido |
| Início | Projeto Boa Ideia | `ideias-c` | ⏳ protótipo embutido |
| Início | Elora AI | `ia` | ⏳ protótipo embutido |

### App Elora (proprietário, locatário e comprador)

| Tela | Rota | Situação |
|---|---|---|
| App Elora (pt, en, es) | `/app` | ⏳ protótipo embutido em tela cheia |

## Pendências conhecidas da tela migrada (Elora Casa+)

- Aba **Solicitações e contratos**: ainda abre o protótipo.
- **Mudança Plug & Play**: as tarefas (procuração, desligamentos, ligações) e a cobrança da taxa ainda não foram portadas; o pedido segue o fluxo comum.
- Perfis e permissões (gestor x equipe) aguardam o login (OIDC); hoje a equipe vê como gestora.
