import { useState, type FormEvent } from 'react';
import { CATEGORIAS, categoria, type ChaveCategoria } from '@/domain/casamais/categorias';
import type { ClienteEmJornada, Parceiro, PedidoServico, RegrasCasaMais } from '@/domain/casamais/pedido';
import { margemPrevista } from '@/domain/casamais/remuneracao';
import { emReais, formatarPct, formatarReais } from '@/domain/shared/dinheiro';
import { Botao } from '../../components/ui';

/**
 * Formulários das janelas do Elora Casa+ (mesmos campos, ids e textos do protótipo).
 * Cada formulário só coleta e entrega os dados; a validação de regra fica nos casos de uso.
 */
interface Comum {
  readonly aoCancelar: () => void;
  readonly ocupado?: boolean;
}

const numero = (v: FormDataEntryValue | null) => Math.round((parseFloat(String(v ?? '')) || 0) * 100) / 100;
const texto = (v: FormDataEntryValue | null, max: number) =>
  String(v ?? '')
    .trim()
    .slice(0, max);

const Rodape = ({ aoCancelar, ocupado, rotulo }: Comum & { rotulo: string }) => (
  <div className="acts" style={{ marginTop: 12 }}>
    <Botao onClick={aoCancelar}>Cancelar</Botao>
    <button className="btn" type="submit" disabled={ocupado}>
      {rotulo}
    </button>
  </div>
);

// ---------- Registrar pedido (em nome do cliente) ----------
export interface DadosNovoPedido {
  cliente: { perfil: ClienteEmJornada['perfil']; referencia: string };
  categoria: ChaveCategoria;
  subservico?: string;
  descricao: string;
  urgente: boolean;
  preferenciaEm?: string;
}

export function FormNovoPedido({
  jornadas,
  inicial,
  hoje,
  aoEnviar,
  ...comum
}: Comum & {
  jornadas: readonly ClienteEmJornada[];
  inicial?: { perfil: string; referencia: string };
  hoje: string;
  aoEnviar: (d: DadosNovoPedido) => void;
}) {
  const [cat, setCat] = useState<ChaveCategoria>('manutencao');
  const daElora = Boolean(categoria(cat)?.daElora);
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const [perfil = '', referencia = ''] = String(f.get('sv-cli') ?? '').split('|');
    let chave = cat;
    let sub = String(f.get('sv-sub') ?? '');
    // "Serviço específico" vale no lugar da categoria escolhida acima.
    if (sub.includes('|')) {
      const [c2, s2] = sub.split('|');
      if (c2 && categoria(c2)) {
        chave = c2 as ChaveCategoria;
        sub = s2 ?? '';
      }
    }
    aoEnviar({
      cliente: { perfil: perfil as ClienteEmJornada['perfil'], referencia },
      categoria: chave,
      ...(sub ? { subservico: sub } : {}),
      descricao: texto(f.get('sv-desc'), 500),
      urgente: f.get('sv-urg') === 'on',
      ...(f.get('sv-quando') ? { preferenciaEm: String(f.get('sv-quando')) } : {}),
    });
  };
  return (
    <>
      <h2>Registrar pedido de serviço</h2>
      <p className="sub">Em nome do cliente, com a autorização dele.</p>
      <form id="frm-sv" onSubmit={enviar}>
        <div className="fgrid">
          <div className="f">
            <label htmlFor="sv-cli">Cliente *</label>
            <select
              id="sv-cli"
              name="sv-cli"
              required
              defaultValue={inicial ? `${inicial.perfil}|${inicial.referencia}` : undefined}
            >
              {jornadas.map((j) => (
                <option key={`${j.perfil}|${j.referencia}`} value={`${j.perfil}|${j.referencia}`}>
                  {j.nome} · {j.rotulo.toLowerCase()} {j.imovelId ?? ''}
                </option>
              ))}
            </select>
          </div>
          <div className="f">
            <label htmlFor="sv-cat">Serviço *</label>
            <select id="sv-cat" value={cat} onChange={(e) => setCat(e.target.value as ChaveCategoria)}>
              {CATEGORIAS.map((c) => (
                <option key={c.chave} value={c.chave}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="f w">
            <label htmlFor="sv-sub">Serviço específico</label>
            <select id="sv-sub" name="sv-sub" className="inp" defaultValue="">
              <option value="">Nenhum (só a categoria)</option>
              {CATEGORIAS.filter((c) => c.subservicos).flatMap((c) =>
                c.subservicos!.map(([grupo, itens]) => (
                  <optgroup key={`${c.chave}-${grupo}`} label={`${c.nome} · ${grupo}`}>
                    {itens.map((x) => (
                      <option key={x} value={`${c.chave}|${x}`}>
                        {x}
                      </option>
                    ))}
                  </optgroup>
                )),
              )}
            </select>
            <small>Se escolher, vale no lugar do serviço acima.</small>
          </div>
          <div className="f w">
            <label htmlFor="sv-desc">
              {daElora ? 'Conte sobre o imóvel que quer alugar *' : 'Explique o serviço *'}
            </label>
            <textarea
              id="sv-desc"
              name="sv-desc"
              maxLength={500}
              rows={4}
              required
              placeholder={
                daElora
                  ? 'Endereço, tipo, quartos e quando fica livre'
                  : cat === 'juridico'
                    ? 'Ex.: dúvida sobre inventário do imóvel herdado'
                    : cat === 'assistencia'
                      ? 'Ex.: geladeira não gela, marca e modelo, quando começou'
                      : 'O que aconteceu ou o que precisa, onde fica, medidas, fotos que pode mandar depois'
              }
            />
          </div>
          {!daElora && cat !== 'juridico' ? (
            <div className="f ck">
              <input type="checkbox" id="sv-urg" name="sv-urg" />
              <label htmlFor="sv-urg">É urgente (vazamento, falta de luz, porta travada)</label>
            </div>
          ) : null}
          <div className="f">
            <label htmlFor="sv-quando">Data de preferência</label>
            <input id="sv-quando" name="sv-quando" type="date" min={hoje} />
          </div>
        </div>
        <Rodape {...comum} rotulo="Registrar" />
      </form>
    </>
  );
}

// ---------- Orçamento ----------
export interface DadosOrcamento {
  parceiroId: string;
  valor: number;
  prazo?: string;
  observacao?: string;
}

export function FormOrcamento({
  pedido: x,
  parceiros,
  aoEnviar,
  ...comum
}: Comum & { pedido: PedidoServico; parceiros: readonly Parceiro[]; aoEnviar: (d: DadosOrcamento) => void }) {
  const ativos = parceiros.filter((p) => p.ativo && p.categorias.includes(x.categoria));
  const atual = parceiros.find((p) => p.id === x.parceiroId);
  const opcoes = atual && !ativos.includes(atual) ? [atual, ...ativos] : ativos;
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const prazo = texto(f.get('so-prazo'), 60);
    const observacao = texto(f.get('so-obs'), 160);
    aoEnviar({
      parceiroId: String(f.get('so-parc') ?? ''),
      valor: numero(f.get('so-valor')),
      ...(prazo ? { prazo } : {}),
      ...(observacao ? { observacao } : {}),
    });
  };
  return (
    <>
      <h2>Orçamento do serviço</h2>
      <p className="sub">
        {categoria(x.categoria)?.nome ?? 'Serviço'} · {x.cliente.nome} · {x.descricao}
      </p>
      <form id="frm-sv-orc" onSubmit={enviar}>
        <div className="fgrid">
          <div className="f">
            <label htmlFor="so-parc">Parceiro *</label>
            <select id="so-parc" name="so-parc" required defaultValue={x.parceiroId}>
              {opcoes.length ? (
                opcoes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} · {formatarPct(p.comissaoPct)}
                  </option>
                ))
              ) : (
                <option value="">Cadastre um parceiro desta categoria</option>
              )}
            </select>
          </div>
          <div className="f">
            <label htmlFor="so-valor">Valor do serviço (R$) *</label>
            <input id="so-valor" name="so-valor" type="number" min="1" step="0.01" required />
          </div>
          <div className="f">
            <label htmlFor="so-prazo">Prazo ou data</label>
            <input id="so-prazo" name="so-prazo" type="text" maxLength={60} placeholder="Ex.: dia 20, das 8h às 12h" />
          </div>
          <div className="f">
            <label htmlFor="so-obs">Observação ao cliente</label>
            <input id="so-obs" name="so-obs" type="text" maxLength={160} />
          </div>
        </div>
        <p className="sub">
          A comissão do parceiro fica guardada no pedido. O cliente aprova pelo app (ou a equipe registra a aprovação
          dada por telefone).
        </p>
        <Rodape {...comum} rotulo="Enviar ao cliente" />
      </form>
    </>
  );
}

// ---------- Margem recebida ----------
export function FormMargem({
  pedido: x,
  parceiro,
  regras,
  hoje,
  aoEnviar,
  ...comum
}: Comum & {
  pedido: PedidoServico;
  parceiro?: Parceiro;
  regras: RegrasCasaMais;
  hoje: string;
  aoEnviar: (d: { valor: number; recebidaEm: string }) => void;
}) {
  const prevista = emReais(margemPrevista(x));
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const em = String(f.get('sm-em') ?? '');
    aoEnviar({ valor: numero(f.get('sm-valor')), recebidaEm: /^\d{4}-\d{2}-\d{2}$/.test(em) ? em : hoje });
  };
  return (
    <>
      <h2>Margem recebida</h2>
      <p className="sub">
        {categoria(x.categoria)?.nome ?? 'Serviço'} · {parceiro?.nome ?? ''} · serviço de{' '}
        {formatarReais(x.orcamento?.valor ?? 0)}
      </p>
      <form id="frm-sv-margem" onSubmit={enviar}>
        <div className="fgrid">
          <div className="f">
            <label htmlFor="sm-valor">Valor recebido do parceiro (R$) *</label>
            <input
              id="sm-valor"
              name="sm-valor"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={prevista || ''}
            />
            <small>Previsto: {formatarPct(x.margemPct ?? 0)} do serviço. Lance o que entrou no banco.</small>
          </div>
          <div className="f">
            <label htmlFor="sm-em">Recebido em *</label>
            <input id="sm-em" name="sm-em" type="date" required defaultValue={hoje} max={hoje} />
          </div>
        </div>
        <p className="sub">
          {formatarPct(regras.fundoBoaIdeiaPct)} deste valor vão para o fundo do Projeto Boa Ideia.{' '}
          {x.corretorNome
            ? `${x.corretorNome} recebe ${formatarPct(regras.corretorPct)} do restante.`
            : 'Pedido sem corretor: o restante fica com a Elora.'}{' '}
          Só margem efetivamente recebida gera participação.
        </p>
        <Rodape {...comum} rotulo="Registrar" />
      </form>
    </>
  );
}

// ---------- Parceiro ----------
export type DadosParceiro = Omit<Parceiro, 'id'> & { id?: string };

export function FormParceiro({
  parceiro: p,
  aoEnviar,
  ...comum
}: Comum & { parceiro?: Parceiro; aoEnviar: (d: DadosParceiro) => void }) {
  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const whatsapp = texto(f.get('pa-tel'), 30);
    const cidades = texto(f.get('pa-cid'), 80);
    const prazo = texto(f.get('pa-prazo'), 40);
    const apresentacao = texto(f.get('pa-desc'), 160);
    aoEnviar({
      ...(p ? { id: p.id } : {}),
      nome: texto(f.get('pa-nome'), 80),
      categorias: f
        .getAll('pa-cat')
        .map(String)
        .filter((c): c is ChaveCategoria => Boolean(categoria(c))),
      comissaoPct: numero(f.get('pa-com')),
      ativo: f.get('pa-ativo') === 'on',
      ...(whatsapp ? { whatsapp } : {}),
      ...(cidades ? { cidades } : {}),
      ...(prazo ? { prazo } : {}),
      ...(apresentacao ? { apresentacao } : {}),
    });
  };
  return (
    <>
      <h2>{p ? `Parceiro · ${p.nome}` : 'Novo parceiro'}</h2>
      <p className="sub">Profissional ou empresa que atende os clientes da Elora depois das chaves.</p>
      <form id="frm-parc" onSubmit={enviar}>
        <div className="fgrid">
          <div className="f w">
            <label htmlFor="pa-nome">Nome *</label>
            <input id="pa-nome" name="pa-nome" className="inp" maxLength={80} required defaultValue={p?.nome ?? ''} />
          </div>
          <fieldset className="f w pa-cats">
            <legend>Serviços que presta *</legend>
            {CATEGORIAS.filter((c) => !c.daElora && !c.oculta).map((c) => (
              <label key={c.chave}>
                <input type="checkbox" name="pa-cat" value={c.chave} defaultChecked={p?.categorias.includes(c.chave)} />{' '}
                {c.nome}
              </label>
            ))}
          </fieldset>
          <div className="f">
            <label htmlFor="pa-com">Comissão da Elora (% do serviço) *</label>
            <input
              id="pa-com"
              name="pa-com"
              className="inp"
              type="number"
              min="0"
              max="50"
              step="0.5"
              required
              defaultValue={p?.comissaoPct ?? 10}
            />
            <small>
              Combinada por escrito com o parceiro. No Jurídico não há comissão: advogado não pode pagar por indicação
              (Lei 8.906/94, art. 34).
            </small>
          </div>
          <div className="f">
            <label htmlFor="pa-tel">WhatsApp</label>
            <input
              id="pa-tel"
              name="pa-tel"
              className="inp"
              type="tel"
              maxLength={30}
              defaultValue={p?.whatsapp ?? ''}
            />
          </div>
          <div className="f">
            <label htmlFor="pa-cid">Cidades e regiões</label>
            <input
              id="pa-cid"
              name="pa-cid"
              className="inp"
              maxLength={80}
              defaultValue={p?.cidades ?? ''}
              placeholder="São José dos Campos, Jacareí"
            />
          </div>
          <div className="f">
            <label htmlFor="pa-prazo">Prazo do orçamento</label>
            <input
              id="pa-prazo"
              name="pa-prazo"
              className="inp"
              maxLength={40}
              defaultValue={p?.prazo ?? ''}
              placeholder="Orçamento em 24 h"
            />
          </div>
          <div className="f w">
            <label htmlFor="pa-desc">Apresentação para o cliente</label>
            <input id="pa-desc" name="pa-desc" className="inp" maxLength={160} defaultValue={p?.apresentacao ?? ''} />
          </div>
          <div className="f ck">
            <input type="checkbox" id="pa-ativo" name="pa-ativo" defaultChecked={p ? p.ativo : true} />
            <label htmlFor="pa-ativo">Ativo: aparece no app</label>
          </div>
        </div>
        <div className="acts" style={{ marginTop: 14 }}>
          <Botao onClick={comum.aoCancelar}>Cancelar</Botao>
          <button className="btn" type="submit" disabled={comum.ocupado}>
            Salvar
          </button>
        </div>
      </form>
    </>
  );
}
