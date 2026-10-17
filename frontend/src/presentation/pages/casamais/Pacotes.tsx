import { useState, type FormEvent } from 'react';
import {
  ITENS_PACOTE,
  ITENS_PADRAO,
  itemPacote,
  pedidoDoItem,
  progressoDoPacote,
  type BuscaImovel,
  type ChaveItemPacote,
  type Empresa,
  type Pacote,
} from '@/domain/casamais/pacote';
import { STATUS_PEDIDO, type ClienteEmJornada, type PedidoServico, type PerfilCliente } from '@/domain/casamais/pedido';
import { diasEntre, formatarData } from '@/domain/shared/datas';
import { formatarReais } from '@/domain/shared/dinheiro';
import type { NovoPacote } from '@/application/ports/casamais';
import { Icone, type NomeIcone } from '../../components/Icone';
import { leitor } from '../../components/leitorDeFormulario';
import { Botao, BotaoWhatsApp, Chips, Etiqueta, Painel, Vazio } from '../../components/ui';
import { EMPRESA } from '../../marca';

/**
 * Pacotes do Elora Casa+ na visão da equipe (painelPacotes / painelEmpresas do protótipo v48).
 * Cada item do pacote é um pedido comum do Casa+; aqui a equipe acompanha o conjunto e cuida do guia do bairro.
 */
const precoDoItem = (chave: ChaveItemPacote, taxaPlugPlay: number) => {
  const it = itemPacote(chave);
  if (!it) return '';
  return it.categoria === 'plugplay'
    ? `${formatarReais(taxaPlugPlay)}, taxa única`
    : it.gratis
      ? 'Incluído, sem custo'
      : 'Orçamento grátis de parceiros';
};

/** Barra de andamento e contagem (mesmo markup do protótipo). */
export function BarraDoPacote({ pacote, pedidos }: { pacote: Pacote; pedidos: readonly PedidoServico[] }) {
  const p = progressoDoPacote(pacote, pedidos);
  return (
    <>
      <div className="pk-bar" role="img" aria-label={`${p.feitos}/${p.total}`}>
        <i style={{ width: `${p.pct}%` }} />
      </div>
      <small className="pk-cont">
        <b className="num">
          {p.feitos}/{p.total}
        </b>{' '}
        <span>itens prontos</span>
      </small>
    </>
  );
}

function ItemDoPacote({
  pacote: pk,
  pedidos,
  empresa,
  hoje,
  aoMarcarGuia,
}: {
  pacote: Pacote;
  pedidos: readonly PedidoServico[];
  empresa?: Empresa;
  hoje: string;
  aoMarcarGuia: (pk: Pacote) => void;
}) {
  const p = progressoDoPacote(pk, pedidos);
  const dd = diasEntre(hoje, pk.data);
  const c = pk.cliente;
  const detalhe = [
    `Mudança em ${formatarData(pk.data)}${dd > 0 ? ` (em ${dd} dia(s))` : dd === 0 ? ' (hoje)' : ''}`,
    pk.origem ? `vem de ${pk.origem}` : '',
    `${pk.pessoas} pessoa(s)`,
    pk.pet ? 'com animais' : '',
    pk.imovelId ?? '',
    pk.corretorNome ? `corretor: ${pk.corretorNome}` : '',
    pk.buscaImovel ? `busca de imóvel (${pk.buscaImovel.toLowerCase()})` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="item">
      <h3>
        Pacote Chegada · {c.nome || 'cliente'}
        {empresa ? ` · ${empresa.nome}` : ''}
      </h3>
      <p>{detalhe}</p>
      <div className="pk-corpo">
        <BarraDoPacote pacote={pk} pedidos={pedidos} />
        <div className="pk-pills">
          {pk.itens.map((k) => {
            const it = itemPacote(k);
            if (!it) return null;
            if (k === 'guia')
              return (
                <Etiqueta key={k} classe={pk.guiaEnviadoEm ? 'ok' : ''}>
                  {`${pk.guiaEnviadoEm ? '✓ ' : ''}${it.titulo}`}
                </Etiqueta>
              );
            const sv = pedidoDoItem(pk, it, pedidos);
            const [classe, rotulo] = sv ? STATUS_PEDIDO[sv.status] : ['', 'sem pedido'];
            return (
              <Etiqueta key={k} classe={sv?.status === 'executado' ? 'ok' : classe}>
                {`${it.titulo}: ${rotulo.toLowerCase()}`}
              </Etiqueta>
            );
          })}
        </div>
        {pk.observacao ? <p className="sub">{pk.observacao}</p> : null}
      </div>
      <div className="acts">
        {pk.itens.includes('guia') ? (
          pk.guiaEnviadoEm ? (
            <Etiqueta classe="ok">{`Guia do bairro enviado em ${formatarData(pk.guiaEnviadoEm)}`}</Etiqueta>
          ) : (
            <Botao variante="" onClick={() => aoMarcarGuia(pk)}>
              Marcar guia do bairro enviado
            </Botao>
          )
        ) : null}
        <BotaoWhatsApp
          telefone={c.telefone}
          texto={`Olá, ${(c.nome || '').split(' ')[0]}! Aqui é a equipe da ${EMPRESA}, sobre o seu Pacote Chegada para ${formatarData(pk.data)}: `}
          rotulo="WhatsApp do cliente"
        />
        {empresa ? (
          <BotaoWhatsApp
            telefone={empresa.whatsapp}
            texto={`Olá, ${empresa.contato || empresa.nome}! Aqui é a equipe da ${EMPRESA}, sobre a chegada de ${c.nome}: `}
            rotulo="WhatsApp do RH"
          />
        ) : null}
      </div>
      <div className="side-r">
        <Etiqueta classe={p.pronto ? 'ok' : 'gold'}>{p.pronto ? 'Pronto' : `${p.pct}% pronto`}</Etiqueta>
      </div>
    </div>
  );
}

export function PainelPacotes({
  pacotes,
  pedidos,
  empresas,
  hoje,
  aoNovoPacote,
  aoNovaEmpresa,
  aoMarcarGuia,
}: {
  pacotes: readonly Pacote[];
  pedidos: readonly PedidoServico[];
  empresas: readonly Empresa[];
  hoje: string;
  aoNovoPacote: () => void;
  aoNovaEmpresa: () => void;
  aoMarcarGuia: (pk: Pacote) => void;
}) {
  const [filtro, setFiltro] = useState<'abertos' | 'todos'>('abertos');
  const ordenados = [...pacotes].sort((a, b) => a.data.localeCompare(b.data));
  const abertos = ordenados.filter((pk) => !progressoDoPacote(pk, pedidos).pronto);
  const lista = filtro === 'todos' ? ordenados : abertos;
  const porId = new Map(empresas.map((e) => [e.id, e]));
  return (
    <Painel titulo={`Pacotes Casa+ · ${abertos.length} em andamento`}>
      <div className="acts">
        <Botao variante="" onClick={aoNovoPacote}>
          Novo pacote
        </Botao>
        <Botao onClick={aoNovaEmpresa}>Nova empresa</Botao>
      </div>
      <Chips
        opcoes={[
          ['abertos', `Em andamento · ${abertos.length}`],
          ['todos', `Todos · ${ordenados.length}`],
        ]}
        atual={filtro}
        aoEscolher={setFiltro}
      />
      <div className="list">
        {lista.length ? (
          lista
            .slice(0, 30)
            .map((pk) => (
              <ItemDoPacote
                key={pk.id}
                pacote={pk}
                pedidos={pedidos}
                empresa={pk.empresaId ? porId.get(pk.empresaId) : undefined}
                hoje={hoje}
                aoMarcarGuia={aoMarcarGuia}
              />
            ))
        ) : (
          <Vazio>
            Nenhum pacote aqui. O cliente monta o Pacote Chegada pelo app; a equipe registra os de clientes em jornada e
            de funcionários de empresas.
          </Vazio>
        )}
      </div>
      <p className="sub">
        Cada item do pacote é um pedido comum do Casa+: orçamento, aprovação, margem, fundo Boa Ideia e participação do
        corretor seguem as mesmas regras. O guia do bairro é preparado pela equipe.
      </p>
    </Painel>
  );
}

export function PainelEmpresas({
  empresas,
  pacotes,
  aoNovoPacote,
  aoEditar,
}: {
  empresas: readonly Empresa[];
  pacotes: readonly Pacote[];
  aoNovoPacote: (empresaId: string) => void;
  aoEditar: (e: Empresa) => void;
}) {
  const ordenadas = [...empresas].sort((a, b) => a.nome.localeCompare(b.nome));
  return (
    <Painel titulo={`Casa+ Empresas · ${empresas.length}`}>
      {ordenadas.length ? (
        <div className="tbl">
          <table>
            <tbody>
              <tr>
                <th>Empresa</th>
                <th>Contato no RH</th>
                <th>Auxílio-moradia</th>
                <th className="r">Pacotes</th>
                <th></th>
              </tr>
              {ordenadas.map((e) => (
                <tr key={e.id}>
                  <td>
                    <b>{e.nome}</b>
                    <small>{e.cidade ?? ''}</small>
                  </td>
                  <td>
                    {e.contato || '—'}
                    <small>{e.email ?? ''}</small>
                  </td>
                  <td>{e.auxilio || '—'}</td>
                  <td className="r num">{pacotes.filter((pk) => pk.empresaId === e.id).length}</td>
                  <td>
                    <div className="acts">
                      <Botao variante="" onClick={() => aoNovoPacote(e.id)}>
                        Novo pacote
                      </Botao>
                      <Botao onClick={() => aoEditar(e)}>Editar</Botao>
                      <BotaoWhatsApp
                        telefone={e.whatsapp}
                        texto={`Olá, ${e.contato || e.nome}! Aqui é a equipe da ${EMPRESA}.`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Vazio>
          Nenhuma empresa cadastrada. Cadastre os RHs que transferem funcionários para a região: a Elora cuida da
          chegada de cada um.
        </Vazio>
      )}
      <p className="sub">
        O pacote do funcionário segue as regras do Casa+. A taxa do Plug & Play é faturada para a empresa, fora do app.
        Peça ao RH a autorização do funcionário para usar os dados dele (LGPD).
      </p>
    </Painel>
  );
}

// ---------- Janelas ----------
export function FormPacote({
  jornadas,
  empresas,
  empresaInicial,
  taxaPlugPlay,
  ocupado,
  aoEnviar,
  aoCancelar,
}: {
  jornadas: readonly ClienteEmJornada[];
  empresas: readonly Empresa[];
  empresaInicial?: string;
  taxaPlugPlay: number;
  ocupado: boolean;
  aoEnviar: (d: NovoPacote) => void;
  aoCancelar: () => void;
}) {
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const l = leitor(f);
    const [tipo = '', a = '', b = ''] = l.texto('pq-para').split('|');
    const empresa = tipo === 'emp';
    const busca = l.texto('pq-busca') as BuscaImovel | '';
    aoEnviar({
      cliente: {
        perfil: (empresa ? 'empresa' : a) as PerfilCliente,
        referencia: empresa ? a : b,
        ...(l.texto('pq-nome') ? { nome: l.texto('pq-nome') } : {}),
        ...(l.texto('pq-tel') ? { telefone: l.texto('pq-tel') } : {}),
      },
      data: l.texto('pq-data'),
      origem: l.texto('pq-origem') || undefined,
      pessoas: l.numero('pq-pessoas') ?? 1,
      pet: l.marcado('pq-pet'),
      gasEncanado: l.marcado('pq-gas'),
      observacao: l.texto('pq-obs') || undefined,
      ...(busca ? { buscaImovel: busca } : {}),
      itens: f.getAll('pq-item').map(String) as ChaveItemPacote[],
    });
  };
  return (
    <>
      <h2>Novo Pacote Chegada</h2>
      <p className="sub">Para um cliente em jornada ou para o funcionário de uma empresa (Casa+ Empresas).</p>
      <form id="frm-pk-eq" onSubmit={enviar} noValidate>
        <div className="fgrid">
          <div className="f w">
            <label htmlFor="pq-para">Para quem *</label>
            <select
              id="pq-para"
              name="pq-para"
              required
              defaultValue={empresaInicial ? `emp|${empresaInicial}` : undefined}
            >
              {empresas.length ? (
                <optgroup label="Funcionário de empresa">
                  {empresas.map((e) => (
                    <option key={e.id} value={`emp|${e.id}`}>
                      {e.nome}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {jornadas.length ? (
                <optgroup label="Cliente em jornada">
                  {jornadas.map((j) => (
                    <option key={`${j.perfil}|${j.referencia}`} value={`cli|${j.perfil}|${j.referencia}`}>
                      {j.nome} · {j.rotulo.toLowerCase()} {j.imovelId ?? ''}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {!empresas.length && !jornadas.length ? (
                <option value="">Cadastre uma empresa ou aguarde um cliente em jornada</option>
              ) : null}
            </select>
          </div>
          <div className="f">
            <label htmlFor="pq-nome">Nome do funcionário</label>
            <input id="pq-nome" name="pq-nome" maxLength={100} placeholder="Obrigatório para empresa" />
          </div>
          <div className="f">
            <label htmlFor="pq-tel">WhatsApp</label>
            <input id="pq-tel" name="pq-tel" type="tel" maxLength={30} placeholder="Do funcionário ou do cliente" />
          </div>
          <div className="f">
            <label htmlFor="pq-data">Data da mudança *</label>
            <input id="pq-data" name="pq-data" type="date" required />
          </div>
          <div className="f">
            <label htmlFor="pq-origem">De onde vem</label>
            <input id="pq-origem" name="pq-origem" maxLength={80} placeholder="Cidade e estado, ou país" />
          </div>
          <div className="f">
            <label htmlFor="pq-pessoas">Pessoas</label>
            <input id="pq-pessoas" name="pq-pessoas" type="number" min="1" max="20" step="1" defaultValue={1} />
          </div>
          <div className="f">
            <label htmlFor="pq-busca">Precisa encontrar o imóvel?</label>
            <select id="pq-busca" name="pq-busca" defaultValue="">
              <option value="">Não, já tem imóvel</option>
              <option value="Locação">Sim, para alugar</option>
              <option value="Compra">Sim, para comprar</option>
            </select>
            <small>Abre um atendimento no Comercial.</small>
          </div>
          <fieldset className="f w pk-escolha">
            <legend>O que você quer no pacote *</legend>
            {ITENS_PACOTE.map((it) => (
              <label className="pk-op" key={it.chave}>
                <input
                  type="checkbox"
                  name="pq-item"
                  value={it.chave}
                  defaultChecked={ITENS_PADRAO.includes(it.chave)}
                />
                <Icone nome={it.icone as NomeIcone} tamanho={18} />
                <span>
                  <b>{it.titulo}</b>
                  <small>{precoDoItem(it.chave, taxaPlugPlay)}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="f ck">
            <input type="checkbox" id="pq-gas" name="pq-gas" />
            <label htmlFor="pq-gas">O imóvel tem gás encanado</label>
          </div>
          <div className="f ck">
            <input type="checkbox" id="pq-pet" name="pq-pet" />
            <label htmlFor="pq-pet">Leva animais de estimação</label>
          </div>
          <div className="f w">
            <label htmlFor="pq-obs">Observações</label>
            <textarea id="pq-obs" name="pq-obs" maxLength={400} rows={3} />
          </div>
        </div>
        <p className="sub">
          Luz, água, gás e internet: a procuração é enviada pela equipe para assinatura digital. Para empresas, a taxa
          de {formatarReais(taxaPlugPlay)} é faturada para a empresa.
        </p>
        <div className="acts" style={{ marginTop: 14 }}>
          <Botao onClick={aoCancelar}>Cancelar</Botao>
          <button className="btn" type="submit" disabled={ocupado}>
            Registrar pacote
          </button>
        </div>
      </form>
    </>
  );
}

export function FormEmpresa({
  empresa: e,
  ocupado,
  aoEnviar,
  aoCancelar,
}: {
  empresa?: Empresa;
  ocupado: boolean;
  aoEnviar: (d: Omit<Empresa, 'id'> & { id?: string }) => void;
  aoCancelar: () => void;
}) {
  const enviar = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const l = leitor(new FormData(ev.currentTarget));
    const opc = (k: string, max: number) => l.texto(k).slice(0, max) || undefined;
    aoEnviar({
      ...(e ? { id: e.id } : {}),
      nome: l.texto('em-nome'),
      cidade: opc('em-cidade', 80),
      contato: opc('em-contato', 80),
      whatsapp: opc('em-tel', 30),
      email: opc('em-email', 120),
      auxilio: opc('em-aux', 80),
      observacao: opc('em-obs', 400),
    });
  };
  return (
    <>
      <h2>{e ? `Empresa · ${e.nome}` : 'Nova empresa (Casa+ Empresas)'}</h2>
      <p className="sub">RH que transfere funcionários para a região. A Elora cuida da chegada de cada um.</p>
      <form id="frm-emp" onSubmit={enviar}>
        <div className="fgrid">
          <div className="f w">
            <label htmlFor="em-nome">Empresa *</label>
            <input id="em-nome" name="em-nome" className="inp" maxLength={100} required defaultValue={e?.nome ?? ''} />
          </div>
          <div className="f">
            <label htmlFor="em-cidade">Cidade da unidade</label>
            <input id="em-cidade" name="em-cidade" className="inp" maxLength={80} defaultValue={e?.cidade ?? ''} />
          </div>
          <div className="f">
            <label htmlFor="em-contato">Contato no RH</label>
            <input id="em-contato" name="em-contato" className="inp" maxLength={80} defaultValue={e?.contato ?? ''} />
          </div>
          <div className="f">
            <label htmlFor="em-tel">WhatsApp do RH</label>
            <input
              id="em-tel"
              name="em-tel"
              className="inp"
              type="tel"
              maxLength={30}
              defaultValue={e?.whatsapp ?? ''}
            />
          </div>
          <div className="f">
            <label htmlFor="em-email">E-mail do RH</label>
            <input
              id="em-email"
              name="em-email"
              className="inp"
              type="email"
              maxLength={120}
              defaultValue={e?.email ?? ''}
            />
          </div>
          <div className="f w">
            <label htmlFor="em-aux">Auxílio-moradia ou faixa de aluguel</label>
            <input
              id="em-aux"
              name="em-aux"
              className="inp"
              maxLength={80}
              placeholder="Ex.: até R$ 4.000 por mês"
              defaultValue={e?.auxilio ?? ''}
            />
          </div>
          <div className="f w">
            <label htmlFor="em-obs">Combinados com a empresa</label>
            <textarea id="em-obs" name="em-obs" maxLength={400} rows={3} defaultValue={e?.observacao ?? ''} />
          </div>
        </div>
        <div className="acts" style={{ marginTop: 14 }}>
          <Botao onClick={aoCancelar}>Cancelar</Botao>
          <button className="btn" type="submit" disabled={ocupado}>
            Salvar
          </button>
        </div>
      </form>
    </>
  );
}
