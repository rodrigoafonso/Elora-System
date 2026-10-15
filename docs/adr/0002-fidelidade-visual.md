# ADR 0002 — Interface idêntica ao protótipo

**Status:** aceito · **Data:** 2026-10-15

**Decisão.** O CSS do protótipo é copiado sem alterações e os componentes React geram o mesmo markup e as mesmas classes.
O Tailwind CSS 4 é carregado sem o reset (*preflight*) e com as cores da marca como tokens, para estilos novos.

**Consequências.** As telas migradas ficam visualmente iguais. Mudanças de visual passam a ser feitas no `elora.css`
(ou com utilitários Tailwind), revisadas no pull request com print.
