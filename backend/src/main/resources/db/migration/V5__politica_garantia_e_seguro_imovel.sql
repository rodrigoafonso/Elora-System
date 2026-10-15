-- Política da Elora (decisão de 15/10/2026):
--  * garantia: seguro-fiança; caução só com o consentimento do locador (data registrada);
--  * seguro do imóvel (contra incêndio): perguntado ao cliente e em vigor durante todo o contrato.
-- A política vale para contratos novos e trocas de garantia e é aplicada pelo domínio (regra da casa, não da lei):
-- contratos antigos continuam válidos. O banco só garante a coerência dos dados.
alter table app.contrato_locacao
  add column if not exists consentimento_caucao_em  date,
  add column if not exists seguro_imovel_seguradora text,
  add column if not exists seguro_imovel_apolice    text,
  add column if not exists seguro_imovel_fim        date;

-- Consentimento só existe em caução.
alter table app.contrato_locacao add constraint consentimento_so_em_caucao
  check (consentimento_caucao_em is null or garantia in ('caucao_dinheiro', 'caucao_bens'));

-- Avisos de renovação: contratos ativos por vencimento do seguro.
create index if not exists contrato_seguro_imovel_fim_idx
  on app.contrato_locacao (tenant_id, seguro_imovel_fim) where status = 'ativo';
