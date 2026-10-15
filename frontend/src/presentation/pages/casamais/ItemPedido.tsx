import { categoria } from '@/domain/casamais/categorias';
import {
  STATUS_PEDIDO,
  estaAberto,
  margemFoiRecebida,
  type Parceiro,
  type PedidoServico,
} from '@/domain/casamais/pedido';
import { divisaoDoPedido, ehServicoDaElora, margemPrevista } from '@/domain/casamais/remuneracao';
import { passosDoPedido } from '@/domain/casamais/trilhaPedido';
import { formatarData } from '@/domain/shared/datas';
import { formatarBRL, formatarPct, formatarReais } from '@/domain/shared/dinheiro';
import { Trilha } from '../../components/Trilha';
import { Botao, BotaoWhatsApp, Etiqueta } from '../../components/ui';
import { EMPRESA } from '../../marca';

export interface AcoesDoPedido {
  orcar(p: PedidoServico): void;
  aprovar(p: PedidoServico): void;
  concluir(p: PedidoServico): void;
  registrarMargem(p: PedidoServico): void;
  cancelar(p: PedidoServico): void;
}

/** Pedido de serviço na visão da equipe (itemServ(x, 'equipe') do protótipo). */
export function ItemPedido({
  pedido: x,
  parceiro: p,
  acoes,
  confirmandoCancelamento,
}: {
  pedido: PedidoServico;
  parceiro?: Parceiro;
  acoes: AcoesDoPedido;
  confirmandoCancelamento: boolean;
}) {
  const [classe, rotulo] = STATUS_PEDIDO[x.status];
  const cat = categoria(x.categoria);
  const daElora = ehServicoDaElora(x);
  const o = x.orcamento;
  const divisao = divisaoDoPedido(x);

  const detalhe = [
    cat?.nome ?? 'Serviço',
    x.subservico,
    p ? p.nome : daElora ? 'com a Elora' : 'a Elora indica o profissional',
    x.cliente.nome || 'cliente',
    x.imovelId,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="item">
      <h3>{x.descricao || 'Pedido de serviço'}</h3>
      <p>
        {detalhe} · pedido em {formatarData(x.criadoEm.slice(0, 10))}
        {x.corretorNome ? ` · corretor: ${x.corretorNome}` : ''}
      </p>
      <Trilha passos={passosDoPedido(x, true)} />
      {o && o.valor > 0 ? (
        <p className="sub">
          Orçamento: <b>{formatarReais(o.valor)}</b>
          {o.prazo ? ` · ${o.prazo}` : ''}
          {x.margemPct ? ` · margem ${formatarPct(x.margemPct)} (${formatarBRL(margemPrevista(x))})` : ''}
        </p>
      ) : null}
      {divisao ? (
        <p className="sub">
          Margem recebida em {formatarData(x.recebidaEm)}: <b>{formatarBRL(divisao.margem)}</b>
          {divisao.fundo ? ` · Boa Ideia: ${formatarBRL(divisao.fundo)} (${formatarPct(x.fundoPct ?? 0)})` : ''}
          {x.corretorNome
            ? ` · ${x.corretorNome}: ${formatarBRL(divisao.corretor)} (${formatarPct(x.corretorPct ?? 0)} do restante)`
            : ' · sem corretor: o restante fica com a Elora'}
        </p>
      ) : null}
      {x.avaliacao ? (
        <p className="sub">
          Avaliação do cliente: nota {x.avaliacao.nota}
          {x.avaliacao.comentario ? ` · ${x.avaliacao.comentario}` : ''}
        </p>
      ) : null}
      <div className="acts">
        {x.status === 'pedido' && !daElora ? (
          <Botao variante="" onClick={() => acoes.orcar(x)}>
            Registrar orçamento
          </Botao>
        ) : null}
        {x.status === 'orcamento' ? <Botao onClick={() => acoes.aprovar(x)}>Cliente aprovou</Botao> : null}
        {x.status === 'aprovado' ? (
          <Botao variante="" onClick={() => acoes.concluir(x)}>
            {x.categoria === 'plugplay' ? 'Tudo pronto' : 'Serviço feito'}
          </Botao>
        ) : null}
        {x.status === 'executado' && !margemFoiRecebida(x) && !daElora ? (
          <Botao variante="" onClick={() => acoes.registrarMargem(x)}>
            Registrar a margem recebida
          </Botao>
        ) : null}
        {p ? (
          <BotaoWhatsApp
            telefone={p.whatsapp}
            texto={`Olá, ${p.nome}! Aqui é a equipe da ${EMPRESA}. Pedido ${x.id} de ${x.cliente.nome || 'cliente'}: ${x.descricao}`}
            rotulo="WhatsApp do parceiro"
          />
        ) : null}
        <BotaoWhatsApp
          telefone={x.cliente.telefone}
          texto={`Olá, ${(x.cliente.nome || '').split(' ')[0]}! Aqui é a equipe da ${EMPRESA}, sobre o seu pedido de ${(cat?.nome ?? 'serviço').toLowerCase()}: `}
          rotulo="WhatsApp do cliente"
        />
        {estaAberto(x) ? (
          <Botao variante="danger" onClick={() => acoes.cancelar(x)}>
            {confirmandoCancelamento ? 'Confirmar: cancelar' : 'Cancelar'}
          </Botao>
        ) : null}
      </div>
      <div className="side-r">
        {x.urgente ? <Etiqueta classe="bad">Urgente</Etiqueta> : null}
        <Etiqueta classe={classe}>{rotulo}</Etiqueta>
      </div>
    </div>
  );
}
