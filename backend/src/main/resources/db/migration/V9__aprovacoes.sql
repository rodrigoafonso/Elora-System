-- Fila de aprovação de ações externas e trilha de auditoria.
-- Nada é enviado por esta tabela: o envio só acontece pelo caso de uso "executar", depois da decisão de uma pessoa.

create table app.aprovacao (
  id               uuid primary key,
  tenant_id        text not null,
  tipo             text not null check (tipo in ('mensagem', 'publicacao', 'pagamento', 'campanha')),
  canal            text not null check (canal ~ '^[a-z]{2,20}$'),
  titulo           text not null check (length(titulo) between 1 and 120),
  conteudo         text not null check (length(conteudo) between 1 and 4000),
  destino          text check (destino is null or length(destino) <= 200),
  referencia       text check (referencia is null or length(referencia) <= 80),
  situacao         text not null check (situacao in ('PENDENTE', 'APROVADA', 'RECUSADA', 'ENVIADA')),
  pedido_por       text not null check (length(pedido_por) between 1 and 60),
  pedido_em        timestamptz not null,
  decidido_por     text check (decidido_por is null or length(decidido_por) <= 60),
  decidido_em      timestamptz,
  texto_aprovado   text check (texto_aprovado is null or length(texto_aprovado) <= 4000),
  motivo           text check (motivo is null or length(motivo) <= 300),
  enviado_por      text check (enviado_por is null or length(enviado_por) <= 60),
  enviado_em       timestamptz,
  resultado_envio  text check (resultado_envio is null or length(resultado_envio) <= 300),
  -- Coerência da decisão: aprovado tem texto; recusado tem motivo; enviado veio de uma aprovação.
  check (situacao <> 'APROVADA' or (decidido_por is not null and texto_aprovado is not null)),
  check (situacao <> 'RECUSADA' or (decidido_por is not null and motivo is not null)),
  check (situacao <> 'ENVIADA' or (texto_aprovado is not null and enviado_em is not null)),
  check (decidido_por is null or lower(decidido_por) <> lower(pedido_por))
);
create index aprovacao_por_situacao on app.aprovacao (tenant_id, situacao, pedido_em desc);

create table app.aprovacao_evento (
  id            bigint generated always as identity primary key,
  tenant_id     text not null,
  aprovacao_id  uuid not null references app.aprovacao(id),
  acao          text not null check (acao in ('pedido', 'aprovado', 'recusado', 'enviado', 'demonstracao', 'falha')),
  quem          text not null check (length(quem) between 1 and 60),
  detalhe       text check (detalhe is null or length(detalhe) <= 300),
  em            timestamptz not null
);
create index aprovacao_evento_por_pedido on app.aprovacao_evento (tenant_id, aprovacao_id, em);
