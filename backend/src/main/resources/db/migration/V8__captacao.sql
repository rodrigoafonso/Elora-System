-- Captação: fontes de leads (site, portais, formulários, anúncios) e a caixa de entrada do que chega pelo endereço público.
-- O código secreto da fonte vai no endereço; aqui fica só o hash SHA-256 dele.

create table app.fonte_captacao (
  id           uuid primary key,
  tenant_id    text not null,
  nome         text not null check (length(nome) between 1 and 60),
  tipo         text not null check (tipo in ('site', 'portal', 'formulario', 'redes', 'parceiro', 'outro')),
  canal        text not null check (canal in ('Site', 'Portal', 'Instagram', 'WhatsApp', 'Indicação', 'Telefone')),
  negocio      text not null check (negocio in ('Locação', 'Compra')),
  corretor_id  uuid references app.corretor(id),
  ativa        boolean not null default true,
  codigo_hash  text not null unique check (codigo_hash ~ '^[0-9a-f]{64}$'),
  criada_em    timestamptz not null default now()
);
create index fonte_captacao_por_tenant on app.fonte_captacao (tenant_id, criada_em);

-- Leads recebidos. Só o que a própria pessoa enviou (LGPD, art. 6º, III: necessidade); sem IP nem navegador.
-- situacao: novo (vai ao funil), duplicado (mesmo telefone ou e-mail em 30 dias), descartado (robô), importado (já está no funil).
create table app.lead_recebido (
  id              bigint generated always as identity primary key,
  tenant_id       text not null,
  fonte_id        uuid not null references app.fonte_captacao(id),
  nome            text not null check (length(nome) between 1 and 80),
  telefone        text check (telefone is null or telefone ~ '^\+?[0-9]{10,13}$'),
  telefone_chave  text,
  email           text check (email is null or length(email) <= 254),
  mensagem        text check (mensagem is null or length(mensagem) <= 1000),
  regiao          text check (regiao is null or length(regiao) <= 120),
  valor_max       numeric(14,2) check (valor_max is null or valor_max > 0),
  imovel_codigo   text,
  consentimento   boolean not null default false,
  situacao        text not null check (situacao in ('novo', 'duplicado', 'descartado', 'importado')),
  duplicado_de    bigint references app.lead_recebido(id),
  recebido_em     timestamptz not null default now(),
  check (telefone is not null or email is not null)
);
create index lead_recebido_caixa on app.lead_recebido (tenant_id, situacao, recebido_em desc);
create index lead_recebido_por_fonte on app.lead_recebido (tenant_id, fonte_id, recebido_em desc);
create index lead_recebido_por_telefone on app.lead_recebido (tenant_id, telefone_chave) where telefone_chave is not null;
create index lead_recebido_por_email on app.lead_recebido (tenant_id, email) where email is not null;
