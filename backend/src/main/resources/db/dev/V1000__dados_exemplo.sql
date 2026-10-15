-- Dados FICTÍCIOS para desenvolvimento (só no perfil dev). Mesmos exemplos do front-end em modo mock.
insert into app.cm_regras (tenant_id) values ('elora') on conflict do nothing;

insert into app.cm_parceiro (tenant_id, id, nome, categorias, comissao_pct, whatsapp, cidades, prazo) values
  ('elora', 'PA-1', 'Mudanças Vale (exemplo)', '{mudanca}', 12, '12999990000', 'São José dos Campos, Jacareí', 'Orçamento em 24 h'),
  ('elora', 'PA-2', 'Brilho Limpezas (exemplo)', '{limpeza}', 10, '12988887777', null, null),
  ('elora', 'PA-3', 'Hidráulica Paraíba (exemplo)', '{manutencao}', 10, '12977776666', null, 'Atende urgência');

insert into app.cm_jornada (tenant_id, perfil, referencia, nome, telefone, imovel_ref, corretor_ref, corretor_nome, desde) values
  ('elora', 'comprador', 'EL-0117', 'Tatiana Moura', '12990001111', 'EL-0117', 'caio', 'Caio Bittencourt', current_date - 27),
  ('elora', 'inquilino', 'C-0107', 'Componentes Mantiqueira S.A.', null, 'EL-0107', 'helena', 'Helena Sakamoto', current_date - 44),
  ('elora', 'inquilino', 'C-0101', 'Bruna Teles', '12991234567', 'EL-0101', 'caio', 'Caio Bittencourt', current_date - 20);

insert into app.cm_pedido (tenant_id, id, categoria, subservico, urgente, cliente_perfil, cliente_ref, cliente_nome, cliente_telefone,
  imovel_ref, corretor_ref, corretor_nome, descricao, status, criado_em) values
  ('elora', 'SV-1', 'manutencao', 'Encanador (urgência)', true, 'inquilino', 'C-0101', 'Bruna Teles', '12991234567',
   'EL-0101', 'caio', 'Caio Bittencourt', 'Vazamento embaixo da pia da cozinha', 'pedido', now() - interval '1 day');

insert into app.cm_pedido (tenant_id, id, categoria, cliente_perfil, cliente_ref, cliente_nome, cliente_telefone, imovel_ref,
  corretor_ref, corretor_nome, descricao, status, criado_em, parceiro_id, orc_valor, orc_prazo, orc_em, margem_pct) values
  ('elora', 'SV-2', 'mudanca', 'comprador', 'EL-0117', 'Tatiana Moura', '12990001111', 'EL-0117', 'caio', 'Caio Bittencourt',
   'Mudança de apartamento de 2 dormitórios', 'orcamento', now() - interval '5 days', 'PA-1', 1500, 'dia 20', current_date - 4, 12);

insert into app.cm_pedido (tenant_id, id, categoria, cliente_perfil, cliente_ref, cliente_nome, imovel_ref, corretor_ref, corretor_nome,
  descricao, status, criado_em, parceiro_id, aprovado_em, executado_em, orc_valor, orc_em, margem_pct, margem_recebida, recebida_em,
  corretor_pct, fundo_pct, aval_nota, aval_em) values
  ('elora', 'SV-3', 'limpeza', 'inquilino', 'C-0107', 'Componentes Mantiqueira S.A.', 'EL-0107', 'helena', 'Helena Sakamoto',
   'Limpeza de entrada no galpão', 'executado', now() - interval '42 days', 'PA-2', current_date - 41, current_date - 37, 1800,
   current_date - 42, 10, 180, current_date - 25, 30, 10, 9, current_date - 36);
