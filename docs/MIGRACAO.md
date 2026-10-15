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
| Início | Dashboard | `central` | ⏳ protótipo embutido |
| Início | Agenda | `agenda` | ⏳ protótipo embutido |
| Início | Chat da equipe | `chat` | ⏳ protótipo embutido |
| Comercial | Atendimentos | `comercial` | ⏳ protótipo embutido |
| Comercial | Sequências | `flows` | ⏳ protótipo embutido |
| Comercial | Campanhas | `campanhas` | ⏳ protótipo embutido |
| Comercial | Banco de compradores | `compradores` | ⏳ protótipo embutido |
| Comercial | Prospecção | `prospeccao` | ⏳ protótipo embutido |
| Comercial | Corretores Elora | `rede` | ⏳ protótipo embutido |
| Comercial | Relatórios | `desempenho` | ⏳ protótipo embutido |
| Comercial | Rodízio e funil | `rodizio` | ⏳ protótipo embutido |
| Imóveis | Imóveis à venda | `im-venda` | ⏳ protótipo embutido |
| Imóveis | Imóveis para locação | `im-locacao` | ⏳ protótipo embutido |
| Imóveis | Recebimento e manutenção | `im-cuidado` | ⏳ protótipo embutido |
| Operações | Locação | `locacao` | ✅ React |
| Operações | Financeiro | `financeiro` | ⏳ protótipo embutido |
| Operações | Elora Casa+ | `posvenda` | ✅ React |
| Operações | Pessoas | `pessoas` | ⏳ protótipo embutido |
| Gestão | Reuniões | `reunioes` | ⏳ protótipo embutido |
| Gestão | Tickets e Kanban | `tickets` | ⏳ protótipo embutido |
| Gestão | Resultados e OKRs | `resultados` | ⏳ protótipo embutido |
| Gestão | Projeto Boa Ideia | `ideias` | ⏳ protótipo embutido |
| Diretoria | Sala de guerra | `guerra` | ⏳ protótipo embutido |
| Diretoria | Inteligência | `inteligencia` | ⏳ protótipo embutido |
| Diretoria | Jurídico | `juridico` | ⏳ protótipo embutido |
| Diretoria | Acessos | `acessos` | ⏳ protótipo embutido |
| Tecnologia | Dados | `dados` | ⏳ protótipo embutido |

### Portal do corretor

| Pasta | Tela | Rota | Situação |
|---|---|---|---|
| Início | Início | `inicio` | ⏳ protótipo embutido |
| CRM de Atendimento | Atendimentos | `crm-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Mensagens do dia | `flows-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Meus leads | `leads-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Imóveis | `imoveis-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Minhas captações | `capt-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Prospecção | `prosp-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Compradores | `compradores-c` | ⏳ protótipo embutido |
| CRM de Atendimento | Agenda | `agenda-c` | ⏳ protótipo embutido |
| Meus ganhos | Carteira | `carteira` | ⏳ protótipo embutido |
| Meus ganhos | Extrato | `extrato` | ⏳ protótipo embutido |
| Meus ganhos | Elora Casa+ | `poschaves-c` | ⏳ protótipo embutido |
| Elora | Chat da equipe | `chat-c` | ⏳ protótipo embutido |
| Elora | Treinamento | `treino-c` | ⏳ protótipo embutido |
| Elora | Projeto Boa Ideia | `ideias-c` | ⏳ protótipo embutido |
| Elora | Elora AI | `ia` | ⏳ protótipo embutido |

### App Elora (proprietário, locatário e comprador)

| Tela | Rota | Situação |
|---|---|---|
| App Elora (pt, en, es) | `/app` | ⏳ protótipo embutido em tela cheia |

## Pendências conhecidas das telas migradas

### Locação

- **Documentos** (minuta do contrato, recibos e termo aditivo de reajuste em Word): ainda não portados; o botão volta quando o gerador de documentos for migrado.
- **Situação "Em atraso"** na tabela: depende das cobranças, que chegam com a migração do Financeiro.
- **"+ Cadastrar agora…"** no campo Locatário: depende da tela Pessoas; por enquanto o locatário precisa estar cadastrado.
- Política "só seguro-fiança em contratos novos" (configurada em Jurídico): a regra existe no domínio, mas ainda não é lida da configuração.

### Elora Casa+

- Aba **Solicitações e contratos**: ainda abre o protótipo.
- **Mudança Plug & Play**: as tarefas (procuração, desligamentos, ligações) e a cobrança da taxa ainda não foram portadas; o pedido segue o fluxo comum.
- Perfis e permissões (gestor x equipe) aguardam o login (OIDC); hoje a equipe vê como gestora.
