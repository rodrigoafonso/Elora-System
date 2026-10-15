-- Dados FICTÍCIOS de locação para desenvolvimento (só no perfil dev).
insert into app.usuario (id, nome, email, papel) values
  ('00000000-0000-0000-0000-0000000000a1', 'Caio Bittencourt', 'caio@exemplo.dev', 'corretor'),
  ('00000000-0000-0000-0000-0000000000a2', 'Helena Sakamoto', 'helena@exemplo.dev', 'corretor');

insert into app.corretor (id, usuario_id, nome, creci_numero, creci_situacao, nivel, associacao_registro_sind) values
  ('00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', 'Caio Bittencourt', '000001-F', 'ativo', 'partner', 'SIND-EXEMPLO-1'),
  ('00000000-0000-0000-0000-0000000000c2', '00000000-0000-0000-0000-0000000000a2', 'Helena Sakamoto', '000002-F', 'ativo', 'pro', 'SIND-EXEMPLO-2');

insert into app.plano_remuneracao (versao, nivel, vigente_de, custo_direto_pct, participacao_pct) values
  (1, 'partner', date '2020-01-01', 20, 30), (1, 'pro', date '2020-01-01', 20, 35),
  (1, 'elite', date '2020-01-01', 20, 40), (1, 'strategic', date '2020-01-01', 20, 45);

insert into app.pessoa (id, tipo, nome, documento, papel) values
  ('00000000-0000-0000-0000-0000000000f1', 'PF', 'Marta Ribeiro (proprietária)', '000.000.001-91', 'proprietario'),
  ('00000000-0000-0000-0000-0000000000f2', 'PJ', 'Vale Logística Patrimonial Ltda.', '00.000.002/0001-91', 'proprietario'),
  ('00000000-0000-0000-0000-0000000000f3', 'PF', 'Bruna Teles', '000.000.003-91', 'locatario'),
  ('00000000-0000-0000-0000-0000000000f4', 'PJ', 'Componentes Mantiqueira S.A.', '00.000.004/0001-91', 'locatario'),
  ('00000000-0000-0000-0000-0000000000f5', 'PF', 'Rafael Nogueira', '000.000.005-91', 'locatario');

insert into app.imovel (id, codigo, descricao, tipo, cidade, bairro, proprietario_id) values
  ('00000000-0000-0000-0000-000000000101', 'EL-0101', 'Apartamento 2 dormitórios', 'apartamento', 'São José dos Campos', 'Jardim Aquarius', '00000000-0000-0000-0000-0000000000f1'),
  ('00000000-0000-0000-0000-000000000107', 'EL-0107', 'Galpão logístico 1.200 m²', 'galpao', 'São José dos Campos', 'Eugênio de Melo', '00000000-0000-0000-0000-0000000000f2'),
  ('00000000-0000-0000-0000-000000000112', 'EL-0112', 'Casa 3 dormitórios', 'casa', 'Pindamonhangaba', 'Centro', '00000000-0000-0000-0000-0000000000f1');

insert into app.origem (imovel_id, corretor_id) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-0000000000c1'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-0000000000c2');

insert into app.contrato_locacao (id, imovel_id, locador_id, locatario_id, tipo, inicio, fim, aluguel, taxa_adm_pct, dia_vencimento,
  indice, garantia, caucao_valor, status, plano_id, forma_pagamento, seguradora, condominio, doc_contrato, doc_vistoria, doc_garantia, doc_seguro,
  consentimento_caucao_em, seguro_imovel_seguradora, seguro_imovel_apolice, seguro_imovel_fim)
select '00000000-0000-0000-0000-0000000000d1'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, '00000000-0000-0000-0000-0000000000f1'::uuid,
       '00000000-0000-0000-0000-0000000000f3'::uuid, 'residencial'::app.tipo_locacao, (current_date - interval '11 months')::date,
       (current_date - interval '11 months' + interval '30 months')::date, 2400, 8, 5, 'IPCA'::app.indice_reajuste, 'seguro_fianca'::app.garantia, null::numeric, 'ativo'::app.status_contrato,
       (select id from app.plano_remuneracao where nivel = 'partner'), 'boleto', 'Seguradora Exemplo'::text, 480::numeric, true, true, true, false,
       null::date, 'Seguradora Exemplo'::text, 'INC-000123'::text, (current_date + 20)::date
union all
select '00000000-0000-0000-0000-0000000000d2'::uuid, '00000000-0000-0000-0000-000000000107'::uuid, '00000000-0000-0000-0000-0000000000f2'::uuid,
       '00000000-0000-0000-0000-0000000000f4'::uuid, 'nao_residencial'::app.tipo_locacao, (current_date - interval '52 months')::date,
       (current_date - interval '52 months' + interval '60 months')::date, 18500, 6, 10, 'IGPM', 'caucao_dinheiro', 55500, 'ativo',
       (select id from app.plano_remuneracao where nivel = 'pro'), 'transferencia', null, null, true, true, true, true,
       (current_date - interval '52 months')::date, 'Seguradora Exemplo', null, (current_date + interval '7 months')::date;
