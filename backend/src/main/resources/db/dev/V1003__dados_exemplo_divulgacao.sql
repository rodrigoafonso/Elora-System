-- Dados de exemplo da Divulgação (só desenvolvimento): dados públicos dos imóveis e um envio já aberto.
update app.imovel set autorizacao_escrita_em = date '2026-09-01', quartos = 2, area_m2 = 62, aluguel_pedido = 2400, publicado = true
 where id = '00000000-0000-0000-0000-000000000101';
update app.imovel set autorizacao_escrita_em = date '2026-08-15', quartos = 3, area_m2 = 160, aluguel_pedido = 5200, publicado = true
 where id = '00000000-0000-0000-0000-000000000112';
-- EL-0107 fica sem autorização escrita: não tem prévia nem link (Lei 6.530/78, art. 20, III).

insert into app.envio_imovel (token, tenant_id, imovel_id, lead_ref, lead_nome, corretor_id, criado_em) values
  ('exempk2345', 'elora', '00000000-0000-0000-0000-000000000112', 'L-02', 'Eduardo Brandão (exemplo)', '00000000-0000-0000-0000-0000000000c2',
   timestamptz '2026-10-15 14:00-03');
insert into app.abertura_link (token, tenant_id, aberto_em, aparelho) values
  ('exempk2345', 'elora', timestamptz '2026-10-15 19:42-03', 'celular'),
  ('exempk2345', 'elora', timestamptz '2026-10-16 08:10-03', 'celular');
