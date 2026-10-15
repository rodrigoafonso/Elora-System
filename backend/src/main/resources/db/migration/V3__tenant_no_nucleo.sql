-- Multi-imobiliária: o núcleo (V1) ganha tenant_id. Registros existentes ficam com a imobiliária "elora".
do $$
declare t text;
begin
  foreach t in array array['usuario','corretor','pessoa','imovel','origem','disputa_origem','plano_remuneracao',
                           'contrato_locacao','cobranca','cobranca_item','recebimento','lancamento_participacao',
                           'evento_auditoria','ia_acao'] loop
    execute format('alter table app.%I add column if not exists tenant_id text not null default %L', t, 'elora');
    execute format('create index if not exists %I on app.%I (tenant_id)', t || '_tenant_idx', t);
  end loop;
end $$;
