import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router';
import { ProblemasDoContratoError } from '@/application/locacao/casosDeUso';
import { agendaLegal, SEV } from '@/domain/locacao/agenda';
import { GARANTIA, TIPO, type ContratoLocacao, type DadosContrato } from '@/domain/locacao/contrato';
import { documentosDoContrato, reajustePendente, ultimoReajuste, type ProblemaContrato } from '@/domain/locacao/regras';
import { formatarData } from '@/domain/shared/datas';
import { formatarPct, formatarReais } from '@/domain/shared/dinheiro';
import { useAviso } from '../../components/Avisos';
import { Janela } from '../../components/Janela';
import { Botao, Cabecalho, Etiqueta, Painel, Vazio } from '../../components/ui';
import type { ContextoDoLayout } from '../../layouts/TeamLayout';
import { FormContrato } from './FormContrato';
import { FormReajuste } from './FormReajuste';
import { useAcaoLocacao, useDadosLocacao } from './useLocacao';

type JanelaAberta =
  { tipo: 'contrato'; contrato?: ContratoLocacao } | { tipo: 'reajuste'; contrato: ContratoLocacao } | null;

/** Converte erro do caso de uso/API em itens da caixa de problemas. */
const comoProblemas = (e: unknown): ProblemaContrato[] =>
  e instanceof ProblemasDoContratoError
    ? [...e.problemas]
    : [{ art: '', titulo: 'Não foi possível salvar', msg: e instanceof Error ? e.message : 'Tente de novo.' }];

/** Locação (visão da equipe): agenda de prazos legais e contratos. Mesmo markup do protótipo (viewLocacao). */
export function LocacaoPage() {
  const { referencia: hoje } = useOutletContext<ContextoDoLayout>();
  const avisar = useAviso();
  const { contratos, cadastros } = useDadosLocacao();
  const [janela, setJanela] = useState<JanelaAberta>(null);
  const [problemas, setProblemas] = useState<ProblemaContrato[]>([]);
  const lista = useMemo(() => contratos.data ?? [], [contratos.data]);
  const agenda = useMemo(() => agendaLegal(lista, hoje, 120), [lista, hoje]);
  const alugados = useMemo(() => new Set(lista.filter((c) => c.status === 'ativo').map((c) => c.imovelId)), [lista]);

  const salvar = useAcaoLocacao((casos, a: { dados: DadosContrato; id?: string }) =>
    casos.salvarContrato(a.dados, lista, a.id),
  );
  const reajustar = useAcaoLocacao((casos, a: { c: ContratoLocacao; em: string; pct: number; novo: number }) =>
    casos.reajustar(a.c, a.em, a.pct, a.novo),
  );

  const abrir = (j: JanelaAberta) => {
    setProblemas([]);
    setJanela(j);
  };
  const fechar = () => setJanela(null);

  return (
    <>
      <Cabecalho
        titulo="Locação"
        subtitulo="Contratos, prazos legais e documentos."
        acoes={
          <Botao variante="" onClick={() => abrir({ tipo: 'contrato' })} disabled={!cadastros.data}>
            Novo contrato
          </Botao>
        }
      />
      {contratos.isError ? (
        <Vazio>Não foi possível carregar os contratos. Verifique a conexão e tente de novo.</Vazio>
      ) : !contratos.data ? (
        <Vazio>Carregando os dados…</Vazio>
      ) : (
        <>
          <Painel titulo={`Agenda dos próximos 120 dias · ${agenda.length}`}>
            <div className="list">
              {agenda.length ? (
                agenda.map((e) => (
                  <div className="item" key={`${e.contratoId}-${e.titulo}-${e.data}`}>
                    <h3>
                      {formatarData(e.data)} · {e.titulo}
                    </h3>
                    <p>{e.detalhe}</p>
                    <div className="side-r">
                      <Etiqueta classe={SEV[e.sev][0]}>{SEV[e.sev][1]}</Etiqueta>
                      <span className="law">{e.lei}</span>
                    </div>
                  </div>
                ))
              ) : (
                <Vazio>Nenhum prazo no período.</Vazio>
              )}
            </div>
          </Painel>
          <Painel titulo={`Contratos · ${lista.length}`}>
            <TabelaContratos
              contratos={lista}
              hoje={hoje}
              abrir={(c) => abrir({ tipo: 'contrato', contrato: c })}
              reajustar={(c) => abrir({ tipo: 'reajuste', contrato: c })}
            />
            <p className="sub">
              O formulário recusa o que a Lei 8.245/91 não permite: caução acima de três aluguéis, cobrança antecipada
              com garantia, índice proibido.
            </p>
          </Painel>
        </>
      )}
      <Janela aberta={janela !== null} aoFechar={fechar}>
        {janela?.tipo === 'contrato' && cadastros.data ? (
          <FormContrato
            contrato={janela.contrato}
            cadastros={cadastros.data}
            imoveisAlugados={alugados}
            problemas={problemas}
            ocupado={salvar.isPending}
            aoCancelar={fechar}
            aoEnviar={(dados) =>
              salvar.mutate(
                { dados, id: janela.contrato?.id },
                {
                  onSuccess: () => {
                    fechar();
                    avisar(janela.contrato ? 'Contrato atualizado.' : 'Contrato cadastrado.');
                  },
                  onError: (e) => setProblemas(comoProblemas(e)),
                },
              )
            }
          />
        ) : janela?.tipo === 'reajuste' ? (
          <FormReajuste
            contrato={janela.contrato}
            hoje={hoje}
            problemas={problemas}
            ocupado={reajustar.isPending}
            aoCancelar={fechar}
            aoEnviar={(d) =>
              reajustar.mutate(
                { c: janela.contrato, ...d },
                {
                  onSuccess: () => {
                    fechar();
                    avisar('Reajuste aplicado.');
                  },
                  onError: (e) => setProblemas(comoProblemas(e)),
                },
              )
            }
          />
        ) : null}
      </Janela>
    </>
  );
}

function TabelaContratos({
  contratos,
  hoje,
  abrir,
  reajustar,
}: {
  contratos: readonly ContratoLocacao[];
  hoje: string;
  abrir: (c: ContratoLocacao) => void;
  reajustar: (c: ContratoLocacao) => void;
}) {
  if (!contratos.length) return <Vazio>Nenhum contrato cadastrado.</Vazio>;
  return (
    <div className="tbl">
      <table>
        <tbody>
          <tr>
            <th>Imóvel</th>
            <th>Locatário</th>
            <th>Tipo e vigência</th>
            <th className="r">Aluguel</th>
            <th>Garantia</th>
            <th>Documentos</th>
            <th>Situação</th>
            <th></th>
          </tr>
          {contratos.map((c) => {
            const docs = documentosDoContrato(c);
            const pend = reajustePendente(c, hoje);
            const ult = ultimoReajuste(c);
            return (
              <tr key={c.id}>
                <td>
                  <b>{c.imovel.descricao || '—'}</b>
                  <small>
                    {c.imovel.bairro} · {c.imovel.codigo}
                  </small>
                </td>
                <td>{c.locatario.nome}</td>
                <td>
                  {TIPO[c.tipo]}
                  <small>
                    {formatarData(c.inicio)} a {formatarData(c.fim)}
                  </small>
                </td>
                <td className="r num">
                  {formatarReais(c.aluguel)}
                  <small>taxa {formatarPct(c.taxa)}</small>
                </td>
                <td>{GARANTIA[c.garantia] ?? '—'}</td>
                <td>
                  <Etiqueta
                    classe={docs.arquivados === docs.exigidos.length ? 'ok' : 'gold'}
                  >{`${docs.arquivados} de ${docs.exigidos.length}`}</Etiqueta>
                </td>
                <td>
                  {c.status !== 'ativo' ? (
                    <Etiqueta>{`${c.status === 'rescindido' ? 'Rescindido em ' : 'Encerrado em '}${formatarData(c.encerradoEm)}`}</Etiqueta>
                  ) : (
                    <Etiqueta classe="ok">Ativo</Etiqueta>
                  )}
                  {pend ? (
                    <small>Reajuste a aplicar desde {formatarData(pend)}</small>
                  ) : ult ? (
                    <small>Reajustado em {formatarData(ult)}</small>
                  ) : null}
                </td>
                <td>
                  <div className="acts">
                    <Botao onClick={() => abrir(c)}>Abrir</Botao>
                    {c.status === 'ativo' ? (
                      <Botao variante={pend ? '' : 'ghost'} onClick={() => reajustar(c)}>
                        Reajustar
                      </Botao>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
