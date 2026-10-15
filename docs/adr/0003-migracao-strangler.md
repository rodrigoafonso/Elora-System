# ADR 0003 — Migração gradual das telas (Strangler Fig)

**Status:** aceito · **Data:** 2026-10-15

**Decisão.** A casca (menu, rotas) é React desde o primeiro dia. Telas não migradas abrem o protótipo embutido
(`LegacyScreen`). Cada tela migrada substitui a sua parte. O status fica em `docs/MIGRACAO.md`.

**Consequências.** A equipe pode usar e evoluir o sistema inteiro já. Enquanto houver telas embutidas, elas usam os
dados do próprio protótipo; a migração deve priorizar as telas que compartilham dados com as já migradas.
