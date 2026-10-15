## O que muda

## Como testar

## Checklist
- [ ] Interface idêntica ao protótipo (compare com `frontend/public/legacy`) ou mudança de layout aprovada
- [ ] Regra de negócio no domínio, não na tela nem no controller
- [ ] Testes cobrindo a regra nova
- [ ] Migração nova em `V<n>__*.sql` (nunca editar migração aplicada)
- [ ] `docs/MIGRACAO.md` atualizado, se migrou uma tela
