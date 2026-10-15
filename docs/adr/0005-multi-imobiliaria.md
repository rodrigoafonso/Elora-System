# ADR 0005 — Multi-imobiliária por tenant_id

**Status:** aceito · **Data:** 2026-10-15

**Decisão.** Toda tabela de negócio tem `tenant_id`. Em produção o tenant vem da claim `tenant` do token; o cabeçalho
`X-Tenant-Id` só existe em desenvolvimento. Repositórios sempre filtram por tenant.

**Consequências.** A plataforma pode atender outras imobiliárias (modelo SaaS) e particionar dados por tenant ou por região
quando o volume exigir. Próximo passo recomendado: Row Level Security no PostgreSQL como segunda barreira.
