-- =====================================================================
-- Elora Casa+ — marketplace de serviços depois das chaves.
-- Regras que o banco garante (além das do domínio Java):
--   * Jurídico não tem comissão (Lei 8.906/94, art. 34): margem_pct = 0.
--   * Margem só existe em serviço feito, e os percentuais do dia ficam congelados no pedido.
--   * Nota de avaliação de 0 a 10.
-- Toda tabela tem tenant_id (a imobiliária), que lidera as chaves e índices para permitir
-- particionamento/fragmentação por imobiliária no futuro.
-- =====================================================================

create table app.cm_regras (
  tenant_id       text primary key,
  corretor_pct    numeric(5,2)  not null default 30 check (corretor_pct between 0 and 100),
  fundo_pct       numeric(5,2)  not null default 10 check (fundo_pct between 0 and 50),
  taxa_plugplay   numeric(12,2) not null default 150 check (taxa_plugplay >= 0),
  atualizado_em   timestamptz   not null default now()
);

create table app.cm_parceiro (
  tenant_id     text not null,
  id            text not null,
  nome          text not null check (length(nome) between 1 and 80),
  categorias    text[] not null check (cardinality(categorias) > 0),
  comissao_pct  numeric(5,2) not null check (comissao_pct between 0 and 50),
  whatsapp      text,
  cidades       text,
  prazo         text,
  apresentacao  text,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  primary key (tenant_id, id),
  -- Parceiro só do Jurídico: sem comissão.
  constraint cm_parceiro_juridico_sem_comissao check (categorias <> array['juridico'] or comissao_pct = 0)
);

-- Clientes em jornada (compra ≤ 180 dias, locação ≤ 90 dias). Alimentada pelos módulos de venda e locação.
create table app.cm_jornada (
  tenant_id       text not null,
  perfil          text not null check (perfil in ('proprietario', 'inquilino', 'comprador')),
  referencia      text not null,
  nome            text not null,
  telefone        text,
  imovel_ref      text,
  corretor_ref    text,
  corretor_nome   text,
  desde           date not null,
  primary key (tenant_id, perfil, referencia)
);

create table app.cm_pedido (
  tenant_id            text not null,
  id                   text not null,
  categoria            text not null check (categoria in ('plugplay','manutencao','assistencia','mudanca','limpeza','moveis','clima','seguranca','jardim','juridico','reforma','administracao')),
  subservico           text check (length(subservico) <= 80),
  urgente              boolean not null default false,
  cliente_perfil       text not null check (cliente_perfil in ('proprietario', 'inquilino', 'comprador')),
  cliente_ref          text not null,
  cliente_nome         text not null,
  cliente_telefone     text,
  imovel_ref           text,
  corretor_ref         text,
  corretor_nome        text,
  descricao            text not null check (length(descricao) between 1 and 500),
  preferencia_em       date,
  status               text not null check (status in ('pedido','orcamento','aprovado','executado','cancelado')),
  criado_em            timestamptz not null,
  parceiro_id          text,
  aprovado_em          date,
  executado_em         date,
  orc_valor            numeric(12,2) check (orc_valor > 0),
  orc_prazo            text,
  orc_observacao       text,
  orc_em               date,
  margem_pct           numeric(5,2) check (margem_pct between 0 and 50),
  margem_recebida      numeric(12,2) check (margem_recebida > 0),
  recebida_em          date,
  corretor_pct         numeric(5,2),
  fundo_pct            numeric(5,2),
  aval_nota            smallint check (aval_nota between 0 and 10),
  aval_comentario      text,
  aval_em              date,
  motivo_cancelamento  text,
  versao               bigint not null default 0,
  primary key (tenant_id, id),
  foreign key (tenant_id, parceiro_id) references app.cm_parceiro (tenant_id, id),
  constraint cm_pedido_juridico_sem_comissao check (categoria <> 'juridico' or coalesce(margem_pct, 0) = 0),
  constraint cm_pedido_margem_so_executado check (margem_recebida is null or (status = 'executado' and recebida_em is not null and fundo_pct is not null and corretor_pct is not null)),
  constraint cm_pedido_orcamento_com_parceiro check (orc_valor is null or parceiro_id is not null)
);

create index cm_pedido_status_idx on app.cm_pedido (tenant_id, status, criado_em desc);
create index cm_pedido_cliente_idx on app.cm_pedido (tenant_id, cliente_perfil, cliente_ref);
create index cm_pedido_parceiro_idx on app.cm_pedido (tenant_id, parceiro_id);
