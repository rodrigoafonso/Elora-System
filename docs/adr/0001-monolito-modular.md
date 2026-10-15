# ADR 0001 — Monólito modular antes de microsserviços

**Status:** aceito · **Data:** 2026-10-15

**Contexto.** A equipe é pequena e o produto ainda muda muito. Microsserviços desde o início trariam custo de operação,
rede e consistência sem benefício no volume atual.

**Decisão.** Um único back-end, dividido em módulos com camadas isoladas (verificadas pelo ArchUnit) e banco único
com `tenant_id`. Um módulo só usa outro pela camada de aplicação ou por eventos.

**Consequências.** Deploy e depuração simples agora. Quando um módulo precisar escalar sozinho, ele é extraído
mantendo domínio e casos de uso; muda só a infraestrutura.
