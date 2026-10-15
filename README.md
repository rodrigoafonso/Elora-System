# Elora Partner OS

Plataforma da **Elora Inteligência Imobiliária**: gestão de vendas, locação, financeiro, corretores e o
marketplace **Elora Casa+**, com a Elora AI ligada a todos os setores.

| Pasta | O que tem |
|---|---|
| `frontend/` | React 19 + TypeScript + Vite + Tailwind CSS 4. Interface idêntica ao protótipo aprovado. |
| `backend/` | Java 21 + Spring Boot 3.5 (monólito modular, Clean Architecture) + PostgreSQL/Flyway. |
| `infra/` | `docker-compose.yml` com banco, API e front-end. |
| `docs/` | Arquitetura, decisões (ADRs), plano de migração das telas e regras do sistema. |

## Rodar localmente

**Só o front-end (dados de exemplo em memória, sem back-end):**

```bash
cd frontend
cp .env.example .env.local   # VITE_DATA_SOURCE=mock
npm install
npm run dev                  # http://localhost:5173
```

**Tudo junto (PostgreSQL + API + front-end):**

```bash
docker compose -f infra/docker-compose.yml up --build
# Front-end: http://localhost:8081
# API e documentação: http://localhost:8080/swagger-ui.html
```

**Back-end sozinho** (precisa de um PostgreSQL em `localhost:5432`, usuário/senha `elora`):

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'
```

## Comandos de qualidade

| Front-end (`frontend/`) | Back-end (`backend/`) |
|---|---|
| `npm run lint` · `npm run typecheck` · `npm test` · `npm run build` | `./gradlew build` (testes de domínio, ArchUnit e integração com Testcontainers) |

O CI (`.github/workflows/ci.yml`) roda tudo isso em cada pull request.

## Por onde começar

1. [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — camadas, módulos e o caminho para escalar.
2. [`docs/MIGRACAO.md`](docs/MIGRACAO.md) — quais telas já são React e como migrar a próxima.
3. [`CONTRIBUTING.md`](CONTRIBUTING.md) — branches, commits e revisão.
4. [`docs/estado-do-sistema-prototipo.md`](docs/estado-do-sistema-prototipo.md) — todas as regras do protótipo.
