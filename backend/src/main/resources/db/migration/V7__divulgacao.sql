-- Divulgação: link do imóvel por envio (corretor + cliente) e registro de aberturas.
-- O link leva só um código aleatório (token); quem enviou e para quem fica aqui, não na URL.

-- Dados públicos do imóvel para a prévia do link (WhatsApp, redes): título, preço e foto de capa.
alter table app.imovel add column if not exists quartos        smallint check (quartos is null or quartos >= 0);
alter table app.imovel add column if not exists area_m2        numeric(10,2) check (area_m2 is null or area_m2 > 0);
alter table app.imovel add column if not exists aluguel_pedido numeric(12,2) check (aluguel_pedido is null or aluguel_pedido > 0);
alter table app.imovel add column if not exists preco_venda    numeric(14,2) check (preco_venda is null or preco_venda > 0);
alter table app.imovel add column if not exists sob_consulta   boolean not null default false;
alter table app.imovel add column if not exists foto_capa_url  text check (foto_capa_url is null or foto_capa_url ~ '^https://');

create table app.envio_imovel (
  token        text primary key check (token ~ '^[abcdefghjkmnpqrstuvwxyz2-9]{10}$'),
  tenant_id    text not null,
  imovel_id    uuid not null references app.imovel(id),
  lead_ref     text,                                  -- lead do CRM (o Comercial ainda não migrou: referência textual)
  lead_nome    text,
  corretor_id  uuid references app.corretor(id),
  criado_em    timestamptz not null default now()
);
create index envio_imovel_por_imovel   on app.envio_imovel (tenant_id, imovel_id);
create index envio_imovel_por_corretor on app.envio_imovel (tenant_id, corretor_id, criado_em desc);
create unique index envio_imovel_um_por_cliente on app.envio_imovel (tenant_id, imovel_id, lead_ref) where lead_ref is not null;

-- Aberturas: só data/hora e tipo de aparelho. Sem IP nem user agent completo (LGPD, art. 6º, III: necessidade).
create table app.abertura_link (
  id           bigint generated always as identity primary key,
  token        text not null references app.envio_imovel(token),
  tenant_id    text not null,
  aberto_em    timestamptz not null default now(),
  aparelho     text not null check (aparelho in ('celular', 'computador', 'outro'))
);
create index abertura_link_por_token on app.abertura_link (token, aberto_em desc);
