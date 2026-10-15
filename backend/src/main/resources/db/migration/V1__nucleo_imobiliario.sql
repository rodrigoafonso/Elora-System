-- Núcleo imobiliário (origem do imóvel, contratos de locação, cobranças, livro de participações e auditoria).
-- Copiado do modelo de dados aprovado no projeto (claude/schema.sql, versão 0.1). Migrações aplicadas NUNCA são editadas: mudanças entram em um novo V<n>.

-- =====================================================================
-- ELORA PARTNER OS — modelo de dados (PostgreSQL 15+ / Supabase)
-- Versão 0.1 — 07/10/2026
--
-- Princípios
--   1. A origem de cada imóvel é registrada uma vez e não muda.
--   2. Participação só nasce de RECEBIMENTO conciliado, nunca de boleto emitido.
--   3. O livro de participações é imutável; correção se faz por estorno.
--   4. Regras da Lei 8.245/91 e da Lei 6.530/78 que cabem em dado estruturado
--      são travas do banco, não avisos de tela.
--   5. Cada corretor enxerga apenas a própria carteira (RLS).
--
-- As citações de artigos indicam a origem da regra. Não substituem parecer
-- jurídico: a redação final das travas deve ser validada por advogado.
-- =====================================================================

create schema if not exists app;

-- Papel usado pelo Supabase para usuários logados. Criado aqui apenas para
-- que o arquivo rode também em PostgreSQL puro (testes).
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type app.papel            as enum ('gestao', 'financeiro', 'corretor');
create type app.nivel_parceiro   as enum ('partner', 'pro', 'elite', 'strategic');
create type app.creci_situacao   as enum ('ativo', 'em_verificacao', 'suspenso', 'cancelado');
create type app.tipo_locacao     as enum ('residencial', 'nao_residencial', 'temporada', 'built_to_suit');
create type app.status_contrato  as enum ('rascunho', 'ativo', 'encerrado', 'rescindido');

-- Lei 8.245, art. 17: vedado vincular o aluguel a moeda estrangeira, variação
-- cambial ou salário mínimo. O tipo simplesmente não oferece essas opções.
create type app.indice_reajuste  as enum ('IPCA', 'IGPM', 'INPC', 'IVAR', 'FIXO_CONTRATUAL');

-- Lei 8.245, art. 37, parágrafo único: uma única modalidade de garantia por
-- contrato, sob pena de nulidade. Coluna única = impossível cadastrar duas.
create type app.garantia         as enum ('nenhuma', 'caucao_dinheiro', 'caucao_bens',
                                          'fianca', 'seguro_fianca', 'cessao_quotas_fundo');

-- Lei 8.245, art. 22, VII e X, e art. 43, I: taxa de administração, taxa de
-- intermediação e despesas extraordinárias de condomínio são do locador.
-- Não existem como item cobrável do locatário.
create type app.item_cobranca    as enum ('aluguel', 'condominio_ordinario', 'iptu',
                                          'seguro_incendio', 'consumo', 'multa_contratual',
                                          'juros_mora', 'outro_encargo_permitido');

create type app.status_lancamento as enum ('a_pagar', 'pago', 'retido', 'estorno');
create type app.venia            as enum ('nao_aplicavel', 'pendente', 'obtida');

-- ---------------------------------------------------------------------
-- Identidade (compatível com auth.uid() do Supabase)
-- ---------------------------------------------------------------------
create or replace function app.uid() returns uuid
language sql stable as $$
  select nullif(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub', '')::uuid
$$;

create table app.usuario (
  id     uuid primary key,
  nome   text not null,
  email  text not null unique,
  papel  app.papel not null
);

-- Lei 6.530/78: só intermedeia quem está inscrito no CRECI (arts. 2º a 4º).
-- Art. 6º, §§ 2º a 4º: o corretor associado atua por contrato de associação
-- registrado no sindicato, sem vínculo empregatício.
create table app.corretor (
  id                         uuid primary key default gen_random_uuid(),
  usuario_id                 uuid not null unique references app.usuario(id),
  nome                       text not null,
  creci_numero               text not null,
  creci_uf                   char(2) not null default 'SP',
  creci_situacao             app.creci_situacao not null default 'em_verificacao',
  creci_verificado_em        date,
  nivel                      app.nivel_parceiro not null default 'partner',
  associacao_assinada_em     date,
  associacao_registro_sind   text,          -- protocolo do registro no sindicato
  desligado_em               date,
  unique (creci_numero, creci_uf)
);

create or replace function app.papel_atual() returns app.papel
language sql stable security definer set search_path = app, pg_temp as $$
  select papel from app.usuario where id = app.uid()
$$;

create or replace function app.corretor_atual() returns uuid
language sql stable security definer set search_path = app, pg_temp as $$
  select id from app.corretor where usuario_id = app.uid()
$$;

create or replace function app.eh_gestao() returns boolean
language sql stable as $$
  select coalesce(app.papel_atual() in ('gestao', 'financeiro'), false)
$$;

-- ---------------------------------------------------------------------
-- Pessoas e imóveis
-- ---------------------------------------------------------------------
create table app.pessoa (
  id          uuid primary key default gen_random_uuid(),
  tipo        char(2) not null check (tipo in ('PF', 'PJ')),
  nome        text not null,
  documento   text not null unique,         -- CPF ou CNPJ
  casado      boolean,                      -- relevante para o art. 3º (vênia conjugal)
  consentimento_lgpd_em timestamptz
);

create table app.imovel (
  id                     uuid primary key default gen_random_uuid(),
  codigo                 text not null unique,
  descricao              text not null,
  tipo                   text not null,
  cidade                 text not null,
  uf                     char(2) not null default 'SP',
  proprietario_id        uuid not null references app.pessoa(id),
  -- Lei 6.530, art. 20, III: vedado anunciar sem autorização escrita.
  autorizacao_escrita_em date,
  autorizacao_valida_ate date,
  autorizacao_exclusiva  boolean not null default false,
  -- Lei 6.530, art. 20, V: loteamento ou condomínio exige nº de registro.
  exige_registro_incorp  boolean not null default false,
  registro_incorporacao  text,
  publicado              boolean not null default false,
  constraint anuncio_exige_autorizacao_escrita
    check (not publicado or autorizacao_escrita_em is not null),
  constraint anuncio_exige_registro_incorporacao
    check (not publicado or not exige_registro_incorp or registro_incorporacao is not null)
);

-- Vínculo de origem: quem trouxe o imóvel. Um por imóvel, imutável.
create table app.origem (
  id            uuid primary key default gen_random_uuid(),
  imovel_id     uuid not null unique references app.imovel(id),
  corretor_id   uuid not null references app.corretor(id),
  registrada_em timestamptz not null default now(),
  registrada_por uuid default app.uid()
);

-- Conflito de origem não altera o vínculo: abre uma disputa decidida pela gestão.
create table app.disputa_origem (
  id            uuid primary key default gen_random_uuid(),
  origem_id     uuid not null references app.origem(id),
  reclamante_id uuid not null references app.corretor(id),
  motivo        text not null,
  aberta_em     timestamptz not null default now(),
  decisao       text,
  decidida_por  uuid references app.usuario(id),
  decidida_em   timestamptz
);

-- ---------------------------------------------------------------------
-- Plano de remuneração (versionado)
-- ---------------------------------------------------------------------
create table app.plano_remuneracao (
  id                 uuid primary key default gen_random_uuid(),
  versao             int  not null,
  nivel              app.nivel_parceiro not null,
  vigente_de         date not null,
  vigente_ate        date,
  custo_direto_pct   numeric(5,2) not null check (custo_direto_pct between 0 and 100),
  participacao_pct   numeric(5,2) not null check (participacao_pct between 0 and 100),
  aprovado_por       uuid references app.usuario(id),
  unique (versao, nivel)
);

-- ---------------------------------------------------------------------
-- Contrato de locação
-- ---------------------------------------------------------------------
create table app.contrato_locacao (
  id                     uuid primary key default gen_random_uuid(),
  imovel_id              uuid not null references app.imovel(id),
  locador_id             uuid not null references app.pessoa(id),
  locatario_id           uuid not null references app.pessoa(id),
  tipo                   app.tipo_locacao not null,
  inicio                 date not null,
  fim                    date not null,
  aluguel                numeric(12,2) not null check (aluguel > 0),
  taxa_adm_pct           numeric(5,2)  not null check (taxa_adm_pct between 0 and 100),
  dia_vencimento         int not null check (dia_vencimento between 1 and 31),
  cobranca_antecipada    boolean not null default false,
  indice                 app.indice_reajuste not null,
  reajuste_a_cada_meses  int not null default 12,
  garantia               app.garantia not null,
  caucao_valor           numeric(12,2),
  venia_conjugal         app.venia not null default 'nao_aplicavel',
  plano_id               uuid references app.plano_remuneracao(id),
  status                 app.status_contrato not null default 'rascunho',
  encerrado_em           date,

  constraint prazo_valido check (fim > inicio),

  -- Lei 8.245, art. 38, § 2º: caução em dinheiro limitada a três aluguéis.
  constraint caucao_ate_tres_alugueis check (
    garantia <> 'caucao_dinheiro'
    or (caucao_valor is not null and caucao_valor <= 3 * aluguel)),

  -- Lei 8.245, arts. 20, 42 e 43, III: cobrança antecipada só sem garantia
  -- ou na locação para temporada.
  constraint antecipado_so_sem_garantia_ou_temporada check (
    not cobranca_antecipada or garantia = 'nenhuma' or tipo = 'temporada'),

  -- Lei 8.245, art. 48: temporada tem prazo máximo de noventa dias.
  constraint temporada_ate_90_dias check (
    tipo <> 'temporada' or (fim - inicio) <= 90),

  -- Lei 10.192/2001, art. 2º, § 1º: reajuste com periodicidade mínima anual.
  constraint reajuste_minimo_anual check (reajuste_a_cada_meses >= 12)
);

create index on app.contrato_locacao (imovel_id);

-- Lei 8.245, art. 3º: prazo igual ou superior a dez anos depende de vênia
-- conjugal. O contrato não é ativado enquanto ela estiver pendente.
create or replace function app.tg_contrato_ativacao() returns trigger
language plpgsql as $$
begin
  if new.status = 'ativo' and (tg_op = 'INSERT' or old.status is distinct from 'ativo') then
    if new.fim >= (new.inicio + interval '10 years')::date and new.venia_conjugal = 'pendente' then
      raise exception 'Contrato com prazo de dez anos ou mais exige vênia conjugal (Lei 8.245, art. 3º).';
    end if;
    if new.plano_id is null then
      raise exception 'Defina o plano de remuneração antes de ativar o contrato.';
    end if;
  end if;
  return new;
end $$;

create trigger contrato_ativacao before insert or update on app.contrato_locacao
  for each row execute function app.tg_contrato_ativacao();

-- ---------------------------------------------------------------------
-- Cobrança e recebimento
-- ---------------------------------------------------------------------
create table app.cobranca (
  id           uuid primary key default gen_random_uuid(),
  contrato_id  uuid not null references app.contrato_locacao(id),
  competencia  date not null check (extract(day from competencia) = 1),
  vencimento   date not null,
  unique (contrato_id, competencia)
);

-- Lei 8.245, art. 22, VI: recibo discriminado, vedada a quitação genérica.
-- O recibo é gerado a partir destes itens.
create table app.cobranca_item (
  id           uuid primary key default gen_random_uuid(),
  cobranca_id  uuid not null references app.cobranca(id),
  tipo         app.item_cobranca not null,
  descricao    text,
  valor        numeric(12,2) not null check (valor >= 0)
);

create table app.recebimento (
  id               uuid primary key default gen_random_uuid(),
  cobranca_id      uuid not null references app.cobranca(id),
  recebido_em      date not null,
  aluguel_recebido numeric(12,2) not null check (aluguel_recebido >= 0),
  total_recebido   numeric(12,2) not null check (total_recebido >= aluguel_recebido),
  conciliado_por   uuid default app.uid()
);

-- ---------------------------------------------------------------------
-- Motor de participação
-- ---------------------------------------------------------------------
create or replace function app.calcular_participacao(
  p_aluguel_recebido numeric, p_taxa_adm_pct numeric,
  p_custo_direto_pct numeric, p_participacao_pct numeric,
  out receita_bruta numeric, out receita_elegivel numeric, out valor numeric)
language sql immutable as $$
  with a as (select round(p_aluguel_recebido * p_taxa_adm_pct / 100, 2) as bruta),
       b as (select bruta, round(bruta * (100 - p_custo_direto_pct) / 100, 2) as elegivel from a)
  select bruta, elegivel, round(elegivel * p_participacao_pct / 100, 2) from b
$$;

create table app.lancamento_participacao (
  id                uuid primary key default gen_random_uuid(),
  recebimento_id    uuid not null references app.recebimento(id),
  contrato_id       uuid not null references app.contrato_locacao(id),
  corretor_id       uuid not null references app.corretor(id),
  plano_id          uuid not null references app.plano_remuneracao(id),
  competencia       date not null,
  -- Memória de cálculo gravada junto com o valor: o extrato mostra a conta.
  aluguel_recebido  numeric(12,2) not null,
  taxa_adm_pct      numeric(5,2)  not null,
  receita_bruta     numeric(12,2) not null,
  custo_direto_pct  numeric(5,2)  not null,
  receita_elegivel  numeric(12,2) not null,
  participacao_pct  numeric(5,2)  not null,
  valor             numeric(12,2) not null,
  status            app.status_lancamento not null,
  motivo_retencao   text,
  estorno_de        uuid references app.lancamento_participacao(id),
  criado_em         timestamptz not null default now(),
  pago_em           date
);

create index on app.lancamento_participacao (corretor_id, competencia);
create unique index um_lancamento_por_recebimento
  on app.lancamento_participacao (recebimento_id) where estorno_de is null;

-- Todo recebimento conciliado gera o lançamento. Sem recebimento, nada nasce.
create or replace function app.tg_gerar_participacao() returns trigger
language plpgsql security definer set search_path = app, pg_temp as $$
declare
  c   app.contrato_locacao;
  cb  app.cobranca;
  o   app.origem;
  k   app.corretor;
  p   app.plano_remuneracao;
  r   record;
  st  app.status_lancamento := 'a_pagar';
  mot text;
begin
  select * into cb from app.cobranca where id = new.cobranca_id;
  select * into c  from app.contrato_locacao where id = cb.contrato_id;
  select * into o  from app.origem where imovel_id = c.imovel_id;
  if o.id is null or c.plano_id is null then
    return new;                               -- imóvel sem origem de parceiro
  end if;
  select * into k from app.corretor where id = o.corretor_id;
  select * into p from app.plano_remuneracao where id = c.plano_id;

  -- Lei 6.530, art. 20, II: vedado facilitar o exercício a não inscritos.
  if k.creci_situacao <> 'ativo' then
    st := 'retido'; mot := 'Inscrição no CRECI não está ativa.';
  elsif k.associacao_registro_sind is null then
    st := 'retido'; mot := 'Contrato de associação sem registro no sindicato (Lei 6.530, art. 6º, § 2º).';
  end if;

  r := app.calcular_participacao(new.aluguel_recebido, c.taxa_adm_pct,
                                 p.custo_direto_pct, p.participacao_pct);

  insert into app.lancamento_participacao
    (recebimento_id, contrato_id, corretor_id, plano_id, competencia,
     aluguel_recebido, taxa_adm_pct, receita_bruta, custo_direto_pct,
     receita_elegivel, participacao_pct, valor, status, motivo_retencao)
  values
    (new.id, c.id, k.id, p.id, cb.competencia,
     new.aluguel_recebido, c.taxa_adm_pct, r.receita_bruta, p.custo_direto_pct,
     r.receita_elegivel, p.participacao_pct, r.valor, st, mot);
  return new;
end $$;

create trigger gerar_participacao after insert on app.recebimento
  for each row execute function app.tg_gerar_participacao();

-- Imutabilidade: nada se apaga; só o status muda (a_pagar/retido -> pago).
create or replace function app.tg_livro_imutavel() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Registro imutável: corrija com um lançamento de estorno.';
  end if;
  if (to_jsonb(new) - 'status' - 'pago_em' - 'motivo_retencao')
     is distinct from (to_jsonb(old) - 'status' - 'pago_em' - 'motivo_retencao') then
    raise exception 'Registro imutável: corrija com um lançamento de estorno.';
  end if;
  if old.status in ('pago', 'estorno') and new.status is distinct from old.status then
    raise exception 'Lançamento % não pode mudar de status.', old.status;
  end if;
  return new;
end $$;

create trigger livro_imutavel before update or delete on app.lancamento_participacao
  for each row execute function app.tg_livro_imutavel();

create or replace function app.tg_sem_alteracao() returns trigger
language plpgsql as $$
begin
  raise exception 'Registro imutável (%).', tg_table_name;
end $$;

create trigger origem_imutavel before update or delete on app.origem
  for each row execute function app.tg_sem_alteracao();
create trigger recebimento_imutavel before update or delete on app.recebimento
  for each row execute function app.tg_sem_alteracao();

-- ---------------------------------------------------------------------
-- Auditoria e trilha das ações de IA
-- ---------------------------------------------------------------------
create table app.evento_auditoria (
  id        bigint generated always as identity primary key,
  quando    timestamptz not null default now(),
  usuario   uuid default app.uid(),
  tabela    text not null,
  acao      text not null,
  antes     jsonb,
  depois    jsonb
);

create or replace function app.tg_auditar() returns trigger
language plpgsql security definer set search_path = app, pg_temp as $$
begin
  insert into app.evento_auditoria (tabela, acao, antes, depois)
  values (tg_table_name, tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger auditar after insert or update or delete on app.contrato_locacao
  for each row execute function app.tg_auditar();
create trigger auditar after insert or update or delete on app.plano_remuneracao
  for each row execute function app.tg_auditar();
create trigger auditar after insert or update or delete on app.corretor
  for each row execute function app.tg_auditar();
create trigger auditar after insert or update on app.lancamento_participacao
  for each row execute function app.tg_auditar();
create trigger auditar after insert or update or delete on app.imovel
  for each row execute function app.tg_auditar();

create trigger auditoria_imutavel before update or delete on app.evento_auditoria
  for each row execute function app.tg_sem_alteracao();

-- A IA lê e propõe. Toda ação fica registrada; as sensíveis esperam aprovação.
create table app.ia_acao (
  id               bigint generated always as identity primary key,
  quando           timestamptz not null default now(),
  agente           text not null,
  tipo             text not null,
  justificativa    text not null,
  dados_usados     jsonb not null,
  requer_aprovacao boolean not null default true,
  aprovada_por     uuid references app.usuario(id),
  aprovada_em      timestamptz,
  resultado        text
);

-- ---------------------------------------------------------------------
-- Isolamento por linha (RLS): cada corretor vê só a própria carteira
-- ---------------------------------------------------------------------
create or replace function app.imovel_e_meu(p_imovel uuid) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select exists (select 1 from app.origem
                 where imovel_id = p_imovel and corretor_id = app.corretor_atual())
$$;

create or replace function app.contrato_e_meu(p_contrato uuid) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select exists (select 1 from app.contrato_locacao c
                 join app.origem o on o.imovel_id = c.imovel_id
                 where c.id = p_contrato and o.corretor_id = app.corretor_atual())
$$;

alter table app.usuario                 enable row level security;
alter table app.corretor                enable row level security;
alter table app.pessoa                  enable row level security;
alter table app.imovel                  enable row level security;
alter table app.origem                  enable row level security;
alter table app.disputa_origem          enable row level security;
alter table app.plano_remuneracao       enable row level security;
alter table app.contrato_locacao        enable row level security;
alter table app.cobranca                enable row level security;
alter table app.cobranca_item           enable row level security;
alter table app.recebimento             enable row level security;
alter table app.lancamento_participacao enable row level security;
alter table app.evento_auditoria        enable row level security;
alter table app.ia_acao                 enable row level security;

-- Gestão e financeiro: acesso completo (as travas e triggers continuam valendo).
do $$
declare t text;
begin
  foreach t in array array['usuario','corretor','pessoa','imovel','origem','disputa_origem',
      'plano_remuneracao','contrato_locacao','cobranca','cobranca_item','recebimento',
      'lancamento_participacao','evento_auditoria','ia_acao'] loop
    execute format('create policy gestao_tudo on app.%I for all to authenticated
                    using (app.eh_gestao()) with check (app.eh_gestao())', t);
  end loop;
end $$;

-- Corretor: leitura restrita ao que ele originou.
create policy proprio on app.usuario for select to authenticated using (id = app.uid());
create policy proprio on app.corretor for select to authenticated using (usuario_id = app.uid());
create policy planos  on app.plano_remuneracao for select to authenticated using (true);

create policy minha_carteira on app.origem for select to authenticated
  using (corretor_id = app.corretor_atual());
create policy registrar_origem on app.origem for insert to authenticated
  with check (corretor_id = app.corretor_atual());
create policy minha_carteira on app.imovel for select to authenticated
  using (app.imovel_e_meu(id));
create policy minha_carteira on app.contrato_locacao for select to authenticated
  using (app.imovel_e_meu(imovel_id));
create policy minha_carteira on app.cobranca for select to authenticated
  using (app.contrato_e_meu(contrato_id));
create policy minha_carteira on app.recebimento for select to authenticated
  using (exists (select 1 from app.cobranca cb
                 where cb.id = cobranca_id and app.contrato_e_meu(cb.contrato_id)));
create policy meu_extrato on app.lancamento_participacao for select to authenticated
  using (corretor_id = app.corretor_atual());
create policy minhas_disputas on app.disputa_origem for select to authenticated
  using (reclamante_id = app.corretor_atual());
create policy abrir_disputa on app.disputa_origem for insert to authenticated
  with check (reclamante_id = app.corretor_atual());

grant usage on schema app to authenticated;
grant select, insert, update, delete on all tables in schema app to authenticated;
grant execute on all functions in schema app to authenticated;

-- ---------------------------------------------------------------------
-- Visões de apoio
-- ---------------------------------------------------------------------
-- Extrato mensal do corretor (respeita o RLS de quem consulta).
create view app.extrato_mensal with (security_invoker = true) as
select corretor_id, competencia,
       sum(valor) filter (where status in ('a_pagar', 'pago')) as participacao,
       sum(valor) filter (where status = 'retido')             as retido,
       count(*)                                                as lancamentos
from app.lancamento_participacao
group by corretor_id, competencia;

-- Lei 8.245, art. 51, § 5º: a ação renovatória deve ser proposta entre um ano
-- e seis meses antes do fim do contrato. Lista os contratos com a janela aberta.
create view app.alerta_renovatoria with (security_invoker = true) as
select id as contrato_id, imovel_id, fim,
       (fim - interval '1 year')::date   as janela_abre,
       (fim - interval '6 months')::date as janela_fecha
from app.contrato_locacao
where status = 'ativo'
  and tipo = 'nao_residencial'
  and fim >= (inicio + interval '5 years' - interval '1 day')::date
  and current_date between (fim - interval '1 year')::date and (fim - interval '6 months')::date;

grant select on app.extrato_mensal, app.alerta_renovatoria to authenticated;
