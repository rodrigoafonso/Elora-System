import { useMemo, useState, type FormEvent } from 'react';
import { useOutletContext } from 'react-router';
import { filtrarPedidos, resumirCasaMais, type FiltroPedidos } from '@/application/casamais/painel';
import { categoria } from '@/domain/casamais/categorias';
import {
  REGRAS_PADRAO,
  type ClienteEmJornada,
  type Parceiro,
  type PedidoServico,
  type RegrasCasaMais,
} from '@/domain/casamais/pedido';
import type { Empresa, Pacote } from '@/domain/casamais/pacote';
import { dividirMargem } from '@/domain/casamais/remuneracao';
import { formatarData } from '@/domain/shared/datas';
import { centavos, formatarBRL, formatarPct, formatarReais } from '@/domain/shared/dinheiro';
import { useAviso } from '../../components/Avisos';
import { Janela } from '../../components/Janela';
import { Botao, BotaoWhatsApp, Cabecalho, Chips, Etiqueta, Indicadores, Painel, Vazio } from '../../components/ui';
import type { ContextoDoLayout } from '../../layouts/TeamLayout';
import { EMPRESA } from '../../marca';
import { LegacyScreen } from '../legacy/LegacyScreen';
import { ItemPedido, type AcoesDoPedido } from './ItemPedido';
import { FormMargem, FormNovoPedido, FormOrcamento, FormParceiro } from './Janelas';
import { FormEmpresa, FormPacote, PainelEmpresas, PainelPacotes } from './Pacotes';
import { useAcaoCasaMais, useDadosCasaMais } from './useCasaMais';

type JanelaAberta =
  | { tipo: 'novo'; inicial?: { perfil: string; referencia: string } }
  | { tipo: 'orcamento'; pedido: PedidoServico }
  | { tipo: 'margem'; pedido: PedidoServico }
  | { tipo: 'parceiro'; parceiro?: Parceiro }
  | { tipo: 'pacote'; empresaId?: string }
  | { tipo: 'empresa'; empresa?: Empresa }
  | null;

const QUEM_SOU = `a equipe da ${EMPRESA}`;
/** Gestores editam regras e parceiros. Até o login chegar ao front-end, a equipe toda vê como gestor. */
const EH_GESTOR = true;

const mensagemDeOferta = (j: ClienteEmJornada) =>
  `Olá, ${(j.nome || '').split(' ')[0]}! Aqui é ${QUEM_SOU}. Parabéns pelo ${j.perfil === 'comprador' ? 'novo imóvel' : 'novo lar'}! No app da Elora, em Serviços (Elora Casa+), você encontra profissionais avaliados para mudança, limpeza, reparos, móveis planejados e mais. Você compara, escolhe e contrata direto, sem compromisso.`;

/** Elora Casa+ (visão da equipe): marketplace de serviços, jornadas, regras de remuneração e parceiros. */
export function CasaMaisPage() {
  const { referencia: hoje } = useOutletContext<ContextoDoLayout>();
  const [aba, setAba] = useState<'servicos' | 'sol'>('servicos');
  const [janela, setJanela] = useState<JanelaAberta>(null);
  const { pedidos, parceiros, regras, jornadas, pacotes, empresas } = useDadosCasaMais();
  const nPedidos = (pedidos.data ?? []).filter((p) => ['pedido', 'orcamento', 'aprovado'].includes(p.status)).length;

  return (
    <>
      <Cabecalho
        titulo="Elora Casa+"
        subtitulo="A venda e a locação abrem uma jornada: serviços com parceiros pelo app, solicitações, renovação e saída. O corretor participa só da margem efetivamente recebida."
        acoes={
          aba === 'servicos' ? (
            <>
              <Botao variante="" onClick={() => setJanela({ tipo: 'novo' })}>
                Registrar pedido
              </Botao>
              {EH_GESTOR ? <Botao onClick={() => setJanela({ tipo: 'parceiro' })}>Novo parceiro</Botao> : null}
            </>
          ) : null
        }
      />
      <Chips
        opcoes={[
          ['servicos', `Marketplace de serviços · ${nPedidos}`],
          ['sol', 'Solicitações e contratos'],
        ]}
        atual={aba}
        aoEscolher={setAba}
      />
      {aba === 'sol' ? (
        // Aba ainda não migrada: abre a versão de referência nesta mesma aba.
        <div style={{ height: '78dvh' }}>
          <LegacyScreen tela="posvenda" parametros="set.pcTab=sol" />
        </div>
      ) : pedidos.isError || parceiros.isError || jornadas.isError ? (
        <Vazio>Não foi possível carregar o Elora Casa+. Verifique a conexão e tente de novo.</Vazio>
      ) : !pedidos.data || !parceiros.data || !jornadas.data ? (
        <Vazio>Carregando os dados…</Vazio>
      ) : (
        <PainelMarketplace
          hoje={hoje}
          pedidos={pedidos.data}
          parceiros={parceiros.data}
          jornadas={jornadas.data}
          regras={regras.data ?? REGRAS_PADRAO}
          pacotes={pacotes.data ?? []}
          empresas={empresas.data ?? []}
          abrir={setJanela}
        />
      )}
      <JanelasDoCasaMais
        janela={janela}
        fechar={() => setJanela(null)}
        hoje={hoje}
        parceiros={parceiros.data ?? []}
        jornadas={jornadas.data ?? []}
        empresas={empresas.data ?? []}
        regras={regras.data ?? REGRAS_PADRAO}
      />
    </>
  );
}

function PainelMarketplace({
  hoje,
  pedidos,
  parceiros,
  jornadas,
  regras,
  pacotes,
  empresas,
  abrir,
}: {
  hoje: string;
  pedidos: PedidoServico[];
  parceiros: Parceiro[];
  jornadas: ClienteEmJornada[];
  regras: RegrasCasaMais;
  pacotes: Pacote[];
  empresas: Empresa[];
  abrir: (j: JanelaAberta) => void;
}) {
  const avisar = useAviso();
  const [filtro, setFiltro] = useState<FiltroPedidos>('abertos');
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const resumo = useMemo(() => resumirCasaMais(pedidos, hoje), [pedidos, hoje]);
  const lista = filtrarPedidos(pedidos, resumo, filtro);
  const porId = useMemo(() => new Map(parceiros.map((p) => [p.id, p])), [parceiros]);

  const aprovar = useAcaoCasaMais((c, id: string) => c.aprovar(id));
  const concluir = useAcaoCasaMais((c, id: string) => c.concluir(id));
  const cancelar = useAcaoCasaMais((c, id: string) => c.cancelar(id));
  const guia = useAcaoCasaMais((c, id: string) => c.marcarGuiaEnviado(id));

  const acoes: AcoesDoPedido = {
    orcar: (p) => abrir({ tipo: 'orcamento', pedido: p }),
    registrarMargem: (p) => abrir({ tipo: 'margem', pedido: p }),
    aprovar: (p) => aprovar.mutate(p.id, { onSuccess: () => avisar('Aprovação registrada.') }),
    concluir: (p) => concluir.mutate(p.id, { onSuccess: () => avisar('Serviço marcado como feito.') }),
    cancelar: (p) => {
      if (confirmar !== p.id) return setConfirmar(p.id);
      setConfirmar(null);
      cancelar.mutate(p.id, { onSuccess: () => avisar('Pedido cancelado.') });
    },
  };

  const exemplo = dividirMargem(centavos(180), regras.fundoBoaIdeiaPct, regras.corretorPct, true);

  return (
    <>
      <Indicadores
        itens={[
          { rotulo: 'Pedidos em aberto', valor: resumo.abertos, nota: `${resumo.semOrcamento} sem orçamento` },
          { rotulo: 'Serviços feitos', valor: resumo.feitos12m, nota: 'nos últimos 12 meses' },
          {
            rotulo: 'Margem recebida',
            valor: formatarBRL(resumo.margem12m),
            nota: `12 meses · ${formatarBRL(resumo.aReceber)} a receber`,
          },
          {
            rotulo: 'Participação dos corretores',
            valor: formatarBRL(resumo.participacaoCorretores12m),
            nota: `${formatarPct(regras.corretorPct)} da margem, depois do Boa Ideia · fundo Boa Ideia: ${formatarBRL(resumo.fundoBoaIdeia12m)}`,
          },
        ]}
      />
      <PainelPacotes
        pacotes={pacotes}
        pedidos={pedidos}
        empresas={empresas}
        hoje={hoje}
        aoNovoPacote={() => abrir({ tipo: 'pacote' })}
        aoNovaEmpresa={() => abrir({ tipo: 'empresa' })}
        aoMarcarGuia={(pk) => guia.mutate(pk.id, { onSuccess: () => avisar('Guia do bairro marcado como enviado.') })}
      />
      <Painel titulo="Pedidos de serviço">
        <Chips
          opcoes={[
            ['abertos', `Em aberto · ${resumo.pendentes.length}`],
            ['feitos', 'Feitos'],
            ['todos', `Todos · ${pedidos.length}`],
          ]}
          atual={filtro}
          aoEscolher={setFiltro}
        />
        <div className="list">
          {lista.length ? (
            lista
              .slice(0, 40)
              .map((x) => (
                <ItemPedido
                  key={x.id}
                  pedido={x}
                  parceiro={x.parceiroId ? porId.get(x.parceiroId) : undefined}
                  acoes={acoes}
                  confirmandoCancelamento={confirmar === x.id}
                />
              ))
          ) : (
            <Vazio>
              Nenhum pedido aqui. Os clientes pedem pelo app, em Serviços; a equipe e o corretor também podem registrar.
            </Vazio>
          )}
        </div>
      </Painel>
      <div className="grid two">
        <Painel titulo={`Clientes em jornada · ${jornadas.length}`}>
          <div className="list">
            {jornadas.length ? (
              jornadas.slice(0, 12).map((j) => (
                <div className="item" key={`${j.perfil}|${j.referencia}`}>
                  <h3>{j.nome}</h3>
                  <p>
                    {j.rotulo} em {formatarData(j.desde)} · {j.imovelId ?? ''} · {j.corretorNome ?? 'sem corretor'} ·{' '}
                    {j.pedidos} pedido(s)
                  </p>
                  <div className="acts">
                    <BotaoWhatsApp telefone={j.telefone} texto={mensagemDeOferta(j)} rotulo="Oferecer os serviços" />
                    <Botao
                      onClick={() => abrir({ tipo: 'novo', inicial: { perfil: j.perfil, referencia: j.referencia } })}
                    >
                      Registrar pedido
                    </Botao>
                  </div>
                </div>
              ))
            ) : (
              <Vazio>Nenhuma compra nos últimos 180 dias nem locação nova nos últimos 90.</Vazio>
            )}
          </div>
          <p className="sub">
            Toda venda e toda locação abrem uma jornada de serviços. Ofereça na entrega das chaves: o cliente escolhe no
            app.
          </p>
        </Painel>
        <Painel titulo="Como a remuneração funciona">
          <ul className="regras">
            <li>
              O parceiro paga à Elora uma comissão combinada por serviço feito (a margem). O cliente contrata e paga
              direto ao profissional.
            </li>
            <li>
              <b>{formatarPct(regras.fundoBoaIdeiaPct)}</b> de cada margem recebida vão para o{' '}
              <b>fundo do Projeto Boa Ideia</b>, que cobre as recompensas e os custos do programa. Os corretores são
              avisados no portal, no treinamento e no manual.
            </li>
            <li>
              Do restante, o corretor que acompanha o cliente recebe <b>{formatarPct(regras.corretorPct)}</b>. Só conta
              margem <b>efetivamente recebida</b>: sem margem, não há remuneração nem fundo.
            </li>
            <li>
              Exemplo: margem de R$ 180,00 → Boa Ideia {formatarBRL(exemplo.fundo)} → corretor{' '}
              {formatarBRL(exemplo.corretor)} → Elora {formatarBRL(exemplo.elora)}.
            </li>
            <li>
              <b>Mudança Plug &amp; Play</b>: taxa fixa de {formatarReais(regras.taxaPlugPlay)} paga pelo cliente no
              app. A equipe marca a procuração e cada ligação; com a taxa paga, registre a margem (
              {formatarReais(regras.taxaPlugPlay)}). Se uma operadora de internet pagar comissão por contrato novo,
              cadastre-a como parceiro e avise o cliente.
            </li>
            <li>
              &quot;Alugar com a Elora&quot; vira captação na Prospecção e segue o Programa Elora Associados (origem do
              imóvel).
            </li>
            <li>
              Oferta, nunca condição: o cliente não é obrigado a contratar parceiro para comprar ou alugar (CDC, art.
              39, I). O app informa que a Elora recebe comissão do parceiro (CDC, art. 6º, III).
            </li>
          </ul>
          {EH_GESTOR ? <FormRegras regras={regras} /> : null}
        </Painel>
      </div>
      <PainelEmpresas
        empresas={empresas}
        pacotes={pacotes}
        aoNovoPacote={(empresaId) => abrir({ tipo: 'pacote', empresaId })}
        aoEditar={(empresa) => abrir({ tipo: 'empresa', empresa })}
      />
      <PainelParceiros parceiros={parceiros} pedidos={pedidos} abrir={abrir} />
    </>
  );
}

function FormRegras({ regras }: { regras: RegrasCasaMais }) {
  const avisar = useAviso();
  const salvar = useAcaoCasaMais((c, r: RegrasCasaMais) => c.salvarRegras(r));
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const n = (k: string) => Number(f.get(k)) || 0;
    salvar.mutate(
      { taxaPlugPlay: n('pc-plug'), fundoBoaIdeiaPct: n('pc-fundo'), corretorPct: n('pc-cor') },
      { onSuccess: () => avisar('Regras salvas.') },
    );
  };
  return (
    <form id="frm-pc-cfg" className="fgrid" style={{ marginTop: 10 }} onSubmit={enviar} key={JSON.stringify(regras)}>
      <div className="f">
        <label htmlFor="pc-plug">Taxa da Mudança Plug &amp; Play (R$)</label>
        <input
          id="pc-plug"
          name="pc-plug"
          className="inp"
          type="number"
          min="0"
          step="1"
          defaultValue={regras.taxaPlugPlay}
        />
      </div>
      <div className="f">
        <label htmlFor="pc-fundo">Fundo do Projeto Boa Ideia (% da margem)</label>
        <input
          id="pc-fundo"
          name="pc-fundo"
          className="inp"
          type="number"
          min="0"
          max="50"
          step="1"
          defaultValue={regras.fundoBoaIdeiaPct}
        />
        <small>Sai antes da divisão com o corretor.</small>
      </div>
      <div className="f">
        <label htmlFor="pc-cor">Participação do corretor na margem (%)</label>
        <input
          id="pc-cor"
          name="pc-cor"
          className="inp"
          type="number"
          min="0"
          max="100"
          step="1"
          defaultValue={regras.corretorPct}
        />
        <small>
          Sobre o que sobra depois do fundo. Valores provisórios: defina com o contador. Valem para as margens recebidas
          daqui em diante.
        </small>
      </div>
      <div className="acts" style={{ alignSelf: 'end' }}>
        <button className="btn sm" type="submit" disabled={salvar.isPending}>
          Salvar
        </button>
      </div>
    </form>
  );
}

function PainelParceiros({
  parceiros,
  pedidos,
  abrir,
}: {
  parceiros: Parceiro[];
  pedidos: PedidoServico[];
  abrir: (j: JanelaAberta) => void;
}) {
  const ordenados = [...parceiros].sort((a, b) => Number(!a.ativo) - Number(!b.ativo) || a.nome.localeCompare(b.nome));
  const nota = (id: string) => {
    const vs = pedidos.filter((x) => x.parceiroId === id && x.avaliacao).map((x) => x.avaliacao!.nota);
    return vs.length
      ? `${(vs.reduce((s, v) => s + v, 0) / vs.length).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} de 10 · ${vs.length} avaliação(ões)`
      : 'Novo na Elora';
  };
  return (
    <Painel titulo={`Parceiros · ${parceiros.filter((p) => p.ativo).length} ativos`}>
      {EH_GESTOR ? (
        <div className="acts">
          <Botao variante="" onClick={() => abrir({ tipo: 'parceiro' })}>
            Novo parceiro
          </Botao>
        </div>
      ) : null}
      {ordenados.length ? (
        <div className="tbl">
          <table>
            <tbody>
              <tr>
                <th>Parceiro</th>
                <th>Serviços</th>
                <th className="r">Comissão</th>
                <th className="r">Feitos</th>
                <th>Avaliação</th>
                <th></th>
              </tr>
              {ordenados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.nome}</b>
                    {!p.ativo ? (
                      <>
                        {' '}
                        <Etiqueta>Inativo</Etiqueta>
                      </>
                    ) : null}
                    <small>
                      {p.cidades ?? ''}
                      {p.prazo ? ` · ${p.prazo}` : ''}
                    </small>
                  </td>
                  <td>{p.categorias.map((c) => categoria(c)?.nome ?? c).join(', ')}</td>
                  <td className="r num">{formatarPct(p.comissaoPct)}</td>
                  <td className="r num">
                    {pedidos.filter((x) => x.parceiroId === p.id && x.status === 'executado').length}
                  </td>
                  <td>{nota(p.id)}</td>
                  <td>
                    <div className="acts">
                      {EH_GESTOR ? (
                        <Botao onClick={() => abrir({ tipo: 'parceiro', parceiro: p })}>Editar</Botao>
                      ) : null}
                      <BotaoWhatsApp telefone={p.whatsapp} texto={`Olá, ${p.nome}! Aqui é a equipe da ${EMPRESA}.`} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Vazio>
          Nenhum parceiro cadastrado. Cadastre profissionais de confiança, com a comissão combinada por escrito.
        </Vazio>
      )}
      <p className="sub">
        Só aparecem no app os parceiros ativos. A nota vem das avaliações dos clientes depois do serviço feito.
      </p>
    </Painel>
  );
}

function JanelasDoCasaMais({
  janela,
  fechar,
  hoje,
  parceiros,
  jornadas,
  empresas,
  regras,
}: {
  janela: JanelaAberta;
  fechar: () => void;
  hoje: string;
  parceiros: Parceiro[];
  jornadas: ClienteEmJornada[];
  empresas: Empresa[];
  regras: RegrasCasaMais;
}) {
  const avisar = useAviso();
  const erro = (e: unknown) => avisar(e instanceof Error ? e.message : 'Não foi possível salvar.');
  const novo = useAcaoCasaMais((c, d: Parameters<typeof c.registrarPedido>[0]) => c.registrarPedido(d));
  const orcamento = useAcaoCasaMais((c, d: Parameters<typeof c.registrarOrcamento>[0]) => c.registrarOrcamento(d));
  const margem = useAcaoCasaMais((c, d: Parameters<typeof c.registrarMargem>[0]) => c.registrarMargem(d));
  const parceiro = useAcaoCasaMais((c, d: Parameters<typeof c.salvarParceiro>[0]) => c.salvarParceiro(d));
  const pacote = useAcaoCasaMais((c, d: Parameters<typeof c.registrarPacote>[0]) => c.registrarPacote(d));
  const empresa = useAcaoCasaMais((c, d: Parameters<typeof c.salvarEmpresa>[0]) => c.salvarEmpresa(d));
  const ok = (texto: string) => ({
    onSuccess: () => {
      fechar();
      avisar(texto);
    },
    onError: erro,
  });
  const comum = { aoCancelar: fechar };

  return (
    <Janela aberta={janela !== null} aoFechar={fechar} largo={janela?.tipo === 'parceiro' || janela?.tipo === 'pacote'}>
      {janela?.tipo === 'novo' ? (
        <FormNovoPedido
          {...comum}
          ocupado={novo.isPending}
          jornadas={jornadas}
          inicial={janela.inicial}
          hoje={hoje}
          aoEnviar={(d) => novo.mutate(d, ok('Pedido registrado.'))}
        />
      ) : janela?.tipo === 'orcamento' ? (
        <FormOrcamento
          {...comum}
          ocupado={orcamento.isPending}
          pedido={janela.pedido}
          parceiros={parceiros}
          aoEnviar={(d) =>
            orcamento.mutate({ pedidoId: janela.pedido.id, ...d }, ok('Orçamento enviado ao cliente no app.'))
          }
        />
      ) : janela?.tipo === 'margem' ? (
        <FormMargem
          {...comum}
          ocupado={margem.isPending}
          pedido={janela.pedido}
          parceiro={parceiros.find((p) => p.id === janela.pedido.parceiroId)}
          regras={regras}
          hoje={hoje}
          aoEnviar={(d) => margem.mutate({ pedidoId: janela.pedido.id, ...d }, ok('Margem registrada.'))}
        />
      ) : janela?.tipo === 'parceiro' ? (
        <FormParceiro
          {...comum}
          ocupado={parceiro.isPending}
          parceiro={janela.parceiro}
          aoEnviar={(d) => parceiro.mutate(d, ok('Parceiro salvo.'))}
        />
      ) : janela?.tipo === 'pacote' ? (
        <FormPacote
          {...comum}
          ocupado={pacote.isPending}
          jornadas={jornadas}
          empresas={empresas}
          empresaInicial={janela.empresaId}
          taxaPlugPlay={regras.taxaPlugPlay}
          aoEnviar={(d) => pacote.mutate(d, ok('Pacote registrado.'))}
        />
      ) : janela?.tipo === 'empresa' ? (
        <FormEmpresa
          {...comum}
          ocupado={empresa.isPending}
          empresa={janela.empresa}
          aoEnviar={(d) => empresa.mutate(d, ok('Empresa salva.'))}
        />
      ) : null}
    </Janela>
  );
}
