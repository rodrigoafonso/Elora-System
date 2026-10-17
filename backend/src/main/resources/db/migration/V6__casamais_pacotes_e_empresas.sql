-- =====================================================================
-- Elora Casa+: pacotes (Pacote Chegada) e Casa+ Empresas.
-- Cada item do pacote é um pedido comum em app.cm_pedido, ligado pelo pacote_id.
-- =====================================================================

create table app.cm_empresa (
  tenant_id   text not null,
  id          text not null,
  nome        text not null check (length(nome) between 1 and 100),
  cidade      text,
  contato     text,
  whatsapp    text,
  email       text,
  auxilio     text,
  observacao  text,
  criado_em   timestamptz not null default now(),
  primary key (tenant_id, id)
);

create table app.cm_pacote (
  tenant_id         text not null,
  id                text not null,
  tipo              text not null default 'chegada' check (tipo in ('chegada')),
  cliente_perfil    text not null check (cliente_perfil in ('proprietario', 'inquilino', 'comprador', 'empresa')),
  cliente_ref       text not null,
  cliente_nome      text not null,
  cliente_telefone  text,
  empresa_id        text,
  imovel_ref        text,
  corretor_ref      text,
  corretor_nome     text,
  data              date not null,
  origem            text,
  pessoas           smallint not null default 1 check (pessoas between 1 and 20),
  pet               boolean not null default false,
  observacao        text,
  busca_imovel      text check (busca_imovel in ('Locação', 'Compra')),
  itens             text[] not null check (cardinality(itens) > 0
                      and itens <@ array['plugplay','limpeza','mudanca','montagem','instalacao','clima','guia']),
  guia_enviado_em   date,
  criado_em         timestamptz not null default now(),
  primary key (tenant_id, id),
  foreign key (tenant_id, empresa_id) references app.cm_empresa (tenant_id, id),
  -- Funcionário de empresa: a referência do cliente é a própria empresa.
  constraint cm_pacote_empresa_coerente check (cliente_perfil <> 'empresa' or (empresa_id is not null and empresa_id = cliente_ref)),
  -- Guia do bairro só é marcado se fizer parte do pacote.
  constraint cm_pacote_guia_coerente check (guia_enviado_em is null or 'guia' = any(itens))
);

create index cm_pacote_data_idx on app.cm_pacote (tenant_id, data);

-- Pedidos podem vir de um pacote e ser de funcionário de empresa.
alter table app.cm_pedido add column pacote_id text;
alter table app.cm_pedido add foreign key (tenant_id, pacote_id) references app.cm_pacote (tenant_id, id);
create index cm_pedido_pacote_idx on app.cm_pedido (tenant_id, pacote_id) where pacote_id is not null;
alter table app.cm_pedido drop constraint cm_pedido_cliente_perfil_check;
alter table app.cm_pedido add constraint cm_pedido_cliente_perfil_check
  check (cliente_perfil in ('proprietario', 'inquilino', 'comprador', 'empresa'));
