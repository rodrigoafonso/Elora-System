# Arquitetura

## Visão geral

```
Navegador (React SPA)  ──HTTPS/JSON──▶  API Spring Boot (stateless)  ──▶  PostgreSQL
        │                                    │
        └─ CDN para arquivos estáticos       └─ (futuro) fila de eventos, cache, réplicas de leitura
```

## Front-end (`frontend/src`)

| Camada | Pasta | Pode depender de |
|---|---|---|
| Domínio | `domain/` | nada (TypeScript puro) |
| Aplicação | `application/` (portas e casos de uso) | domínio |
| Infraestrutura | `infrastructure/` (HTTP, zod, memória, injeção de dependências) | aplicação, domínio |
| Apresentação | `presentation/` (componentes, telas, layout, menu) | todas acima |
| Composição | `app/` (rotas, provedores) e `main.tsx` | todas |

- **Fidelidade visual**: o CSS do protótipo foi copiado sem alterações (`styles/elora.css`). O Tailwind 4 entra sem o
  *preflight* (reset), para não alterar a aparência, e expõe as cores da marca como utilitários.
- **Dados**: `@tanstack/react-query` faz cache, recarga e estados de carregamento. A fonte é escolhida por
  `VITE_DATA_SOURCE` (`mock` = memória, `api` = back-end) no `infrastructure/di/container.ts`.
- **Contrato**: toda resposta da API é validada com zod na borda (`infrastructure/*/esquemas.ts`).
- **Migração gradual**: ver `docs/MIGRACAO.md`.

## Back-end (`backend/`)

Monólito modular, um pacote por módulo de negócio (`casamais`, `locacao`, `divulgacao`, `imoveis`, `participacao`, ...), cada um com:

```
<modulo>/domain          entidades e regras (Java puro)
<modulo>/application     casos de uso + portas (interfaces de repositório)
<modulo>/infrastructure  adaptadores JDBC e configuração Spring (onde nasce a transação)
<modulo>/api             controllers REST + DTOs
shared/                  tipos comuns (Dinheiro, TenantId), erros problem+json, segurança
```

- SQL explícito com `JdbcClient` (sem ORM): consultas previsíveis e fáceis de otimizar.
- **Travas legais no banco** (V1 e V2): Lei 8.245/91 (garantia única, itens não cobráveis do locatário, índices de reajuste),
  livro de participações imutável, Jurídico sem comissão (Lei 8.906/94, art. 34).
- Concorrência otimista (`versao`) nos pedidos.
- Erros no formato `application/problem+json`, com `detail` legível para o usuário.

## Escalabilidade: do Brasil ao mundo

O projeto nasce simples, mas com as decisões que permitem crescer sem reescrever:

| Fase | Volume | O que fazer |
|---|---|---|
| 1. Hoje | 1 imobiliária a algumas dezenas | Monólito modular, 1 banco, 2+ instâncias da API atrás de um balanceador. |
| 2. Nacional | centenas de imobiliárias | Réplicas de leitura do PostgreSQL; cache (Redis) para consultas quentes; CDN para o front; filas para tarefas lentas (e-mail, WhatsApp, IA, boletos). |
| 3. Grande escala | milhares de imobiliárias | Extrair módulos de alto tráfego (ex.: Casa+, cobrança, Elora AI) para serviços próprios; eventos (Kafka/SQS) entre módulos; particionar tabelas por `tenant_id`. |
| 4. Internacional | vários países | Implantação por região (dados perto do cliente e em conformidade com a lei local: LGPD, GDPR); `tenant_id` + região; i18n já previsto no App Elora. |

O que já está pronto para isso:

- **API sem estado** (JWT, sem sessão): qualquer instância atende qualquer requisição; escala horizontal.
- **`tenant_id` em todas as tabelas**, liderando chaves e índices: permite particionar/fragmentar por imobiliária.
- **Módulos isolados** por camadas e regras do ArchUnit: extrair um módulo vira mudar o adaptador, não o domínio.
- **Threads virtuais (Java 21)** e pool de conexões configurável por variável de ambiente.
- **Observabilidade**: `/actuator/health` (probes para Kubernetes) e `/actuator/prometheus` (métricas).
- **Imagens Docker** de front e back, prontas para Kubernetes/ECS/Cloud Run.

## Segurança

- Produção: login por um provedor OIDC (ex.: Keycloak, Auth0, Cognito, Azure AD B2C) → JWT com a claim `tenant`.
  Configure `OIDC_ISSUER_URI`. O cabeçalho `X-Tenant-Id` só é aceito no perfil `dev`.
- Segredos sempre por variáveis de ambiente; nunca no repositório.
