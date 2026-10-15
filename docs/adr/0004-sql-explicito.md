# ADR 0004 — PostgreSQL com Flyway e SQL explícito

**Status:** aceito · **Data:** 2026-10-15

**Decisão.** Esquema versionado por Flyway; acesso por `JdbcClient` com SQL explícito, sem ORM. Regras legais que cabem
em dado estruturado são travas no banco (checks, gatilhos), além das validações do domínio.

**Consequências.** Desempenho previsível e consultas fáceis de otimizar. Mapeamento é escrito à mão (testado pelos
testes de integração com Testcontainers).
