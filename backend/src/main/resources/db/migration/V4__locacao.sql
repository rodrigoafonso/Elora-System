-- =====================================================================
-- Locação: campos do contrato usados pela tela (iguais ao protótipo) e histórico de reajustes.
-- =====================================================================

alter table app.imovel add column if not exists bairro text not null default '';
-- Papel da pessoa no cadastro (proprietario, locatario, comprador...). Usado para filtrar listas.
alter table app.pessoa add column if not exists papel text;

alter table app.contrato_locacao
  add column if not exists forma_pagamento  text not null default 'boleto' check (forma_pagamento in ('boleto','pix','transferencia','deposito')),
  add column if not exists seguradora       text,
  add column if not exists apolice          text,
  add column if not exists apolice_fim      date,
  add column if not exists premio           numeric(12,2) check (premio >= 0),
  add column if not exists condominio       numeric(12,2) check (condominio >= 0),
  add column if not exists iptu             numeric(12,2) check (iptu >= 0),
  -- Lei 8.245/91, art. 22, VII: a intermediação é do locador (descontada do primeiro repasse).
  add column if not exists intermediacao    numeric(12,2) check (intermediacao >= 0),
  add column if not exists corretor_loc_id  uuid references app.corretor(id),
  add column if not exists dia_repasse      int check (dia_repasse between 1 and 31),
  add column if not exists extra_loc_desc   text,
  add column if not exists extra_loc_valor  numeric(12,2) check (extra_loc_valor >= 0),
  add column if not exists extra_prop_desc  text,
  add column if not exists extra_prop_valor numeric(12,2) check (extra_prop_valor >= 0),
  add column if not exists clausulas        text,
  add column if not exists doc_contrato     boolean not null default false,
  add column if not exists doc_vistoria     boolean not null default false,
  add column if not exists doc_garantia     boolean not null default false,
  add column if not exists doc_seguro       boolean not null default false,
  add column if not exists versao           bigint not null default 0;

-- Contrato encerrado ou rescindido precisa da data.
alter table app.contrato_locacao add constraint encerramento_com_data
  check (status in ('rascunho', 'ativo') or encerrado_em is not null);

-- Um só contrato ativo por imóvel.
create unique index if not exists contrato_um_ativo_por_imovel
  on app.contrato_locacao (tenant_id, imovel_id) where status = 'ativo';

-- Histórico de reajustes (imutável).
create table app.contrato_reajuste (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    text not null default 'elora',
  contrato_id  uuid not null references app.contrato_locacao(id),
  em           date not null,
  indice       app.indice_reajuste not null,
  pct          numeric(6,2) not null,
  de           numeric(12,2) not null check (de > 0),
  para         numeric(12,2) not null check (para > 0),
  criado_em    timestamptz not null default now(),
  unique (contrato_id, em)
);
create index on app.contrato_reajuste (tenant_id, contrato_id);

create trigger reajuste_imutavel before update or delete on app.contrato_reajuste
  for each row execute function app.tg_sem_alteracao();

-- Lei 10.192/2001, art. 2º, § 1º: reajuste com periodicidade mínima anual (do início ou do último reajuste).
create or replace function app.tg_reajuste_anual() returns trigger
language plpgsql as $$
declare marco date;
begin
  select greatest(c.inicio, coalesce(max(r.em), c.inicio)) into marco
    from app.contrato_locacao c left join app.contrato_reajuste r on r.contrato_id = c.id
   where c.id = new.contrato_id group by c.inicio;
  if new.em < (marco + interval '12 months')::date then
    raise exception 'Reajuste antes de um ano do último marco (Lei 10.192/2001, art. 2º, § 1º).';
  end if;
  return new;
end $$;

create trigger reajuste_anual before insert on app.contrato_reajuste
  for each row execute function app.tg_reajuste_anual();

create trigger auditar after insert on app.contrato_reajuste
  for each row execute function app.tg_auditar();
