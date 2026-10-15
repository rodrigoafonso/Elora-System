# Como contribuir

## Fluxo
1. Crie uma branch a partir de `main`: `feat/<assunto>`, `fix/<assunto>`, `chore/<assunto>`.
2. Commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/): `feat(casamais): registra avaliação do cliente`.
3. Abra um pull request; o CI precisa passar e ao menos uma pessoa revisa.
4. `main` está sempre pronta para publicar. Nada de push direto em `main`.

## Regras do código
- **Interface**: o protótipo em `frontend/public/legacy` é a referência. Reaproveite as classes de `src/styles/elora.css`
  e os componentes de `src/presentation/components`. Para estilos novos, use utilitários do Tailwind com os tokens da marca
  (`bg-green`, `text-muted`, `border-line`...), definidos em `src/styles/index.css`.
- **Regra de negócio mora no domínio** (front: `src/domain`; back: `<modulo>/domain`). Tela e controller só traduzem.
- **Dependências apontam para dentro**: domínio não conhece aplicação; aplicação não conhece React, Spring, HTTP ou SQL.
  O ESLint (front) e o ArchUnit (back) quebram o build se isso for violado.
- **Banco**: toda mudança é uma migração nova `V<n>__descricao.sql`. Nunca edite uma migração já aplicada.
  Toda tabela de negócio tem `tenant_id`.
- **Textos** em português claro, sem jargão, com acentuação. Mensagens de erro dizem o que fazer.
- **Dinheiro** em centavos inteiros (`Centavos` no front, `Dinheiro` no back). Nunca `float` para somar valores.
- Teste toda regra nova. Teste de tela usa os repositórios em memória.
