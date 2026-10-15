import { useState, type FormEvent } from 'react';
import {
  FORMA_PAG,
  GARANTIA,
  INDICES,
  PADRAO_CONTRATO,
  STATUS_CONTRATO,
  TIPO,
  VENIA,
  type ContratoLocacao,
  type CorretorResumo,
  type DadosContrato,
  type FormaPagamento,
  type Garantia,
  type ImovelResumo,
  type IndiceReajuste,
  type PessoaResumo,
  type StatusContrato,
  type TipoLocacao,
  type Venia,
} from '@/domain/locacao/contrato';
import type { ProblemaContrato } from '@/domain/locacao/regras';
import { CampoAreaTexto, CampoLista, CampoMarcar, CampoNumero, CampoTexto } from '../../components/Campos';
import { leitor } from '../../components/leitorDeFormulario';
import { Problemas } from '../../components/Problemas';
import { Botao } from '../../components/ui';

const opcoes = <K extends string>(r: Record<K, string>) => Object.entries(r) as [K, string][];

export interface CadastrosDoFormulario {
  readonly imoveis: readonly ImovelResumo[];
  readonly locatarios: readonly PessoaResumo[];
  readonly corretores: readonly CorretorResumo[];
}

/**
 * Cadastro/edição de contrato (CAMPOS.contratos do protótipo: mesmos campos, ordem, rótulos e dicas).
 * Os problemas legais vêm do caso de uso e aparecem na caixa vermelha, sem fechar a janela.
 */
export function FormContrato({
  contrato: c,
  cadastros,
  imoveisAlugados,
  problemas,
  ocupado,
  aoEnviar,
  aoCancelar,
}: {
  contrato?: ContratoLocacao;
  cadastros: CadastrosDoFormulario;
  /** Imóveis com contrato ativo (não aparecem no cadastro de contrato novo). */
  imoveisAlugados: ReadonlySet<string>;
  problemas: readonly ProblemaContrato[];
  ocupado: boolean;
  aoEnviar: (d: DadosContrato) => void;
  aoCancelar: () => void;
}) {
  const v: Partial<DadosContrato> = c ?? PADRAO_CONTRATO;
  const [faltando, setFaltando] = useState<ProblemaContrato[]>([]);

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const l = leitor(new FormData(e.currentTarget));
    const t = (k: string) => l.texto(k) || undefined;
    const d: DadosContrato = {
      imovelId: c ? c.imovelId : l.texto('imovelId'),
      locatarioId: l.texto('locatarioId'),
      tipo: l.texto('tipo') as TipoLocacao,
      inicio: l.texto('inicio'),
      fim: l.texto('fim'),
      aluguel: l.numero('aluguel') ?? 0,
      taxa: l.numero('taxa') ?? NaN,
      venc: l.numero('venc'),
      formaPagamento: l.texto('formaPagamento') as FormaPagamento,
      indice: l.texto('indice') as IndiceReajuste,
      garantia: l.texto('garantia') as Garantia,
      caucao: l.numero('caucao'),
      seguradora: t('seguradora'),
      apolice: t('apolice'),
      apoliceFim: t('apoliceFim'),
      premio: l.numero('premio'),
      antecipada: l.marcado('antecipada'),
      venia: l.texto('venia') as Venia,
      cond: l.numero('cond'),
      iptu: l.numero('iptu'),
      intermediacao: l.numero('intermediacao'),
      corretorLocId: t('corretorLocId'),
      diaRepasse: l.numero('diaRepasse'),
      extraLocDesc: t('extraLocDesc'),
      extraLocValor: l.numero('extraLocValor'),
      extraPropDesc: t('extraPropDesc'),
      extraPropValor: l.numero('extraPropValor'),
      clausulas: t('clausulas'),
      docContrato: l.marcado('docContrato'),
      docVistoria: l.marcado('docVistoria'),
      docGarantia: l.marcado('docGarantia'),
      docSeguro: l.marcado('docSeguro'),
      status: l.texto('status') as StatusContrato,
      encerradoEm: t('encerradoEm'),
    };
    // Campos obrigatórios primeiro (como o protótipo); as regras legais vêm do caso de uso.
    const obrig: [keyof DadosContrato, string][] = [
      ['imovelId', 'Imóvel'],
      ['locatarioId', 'Locatário'],
      ['inicio', 'Início'],
      ['fim', 'Fim do prazo'],
      ['aluguel', 'Aluguel (R$)'],
      ['taxa', 'Taxa de administração (%)'],
    ];
    const falta = obrig
      .filter(
        ([k]) =>
          d[k] === '' ||
          d[k] === undefined ||
          (typeof d[k] === 'number' && !Number.isFinite(d[k] as number)) ||
          (k === 'aluguel' && !(d.aluguel > 0)),
      )
      .map(([, r]) => ({ art: '', titulo: 'Campo obrigatório', msg: r }));
    setFaltando(falta);
    if (!falta.length) aoEnviar(d);
  };

  const imoveis = cadastros.imoveis.filter((i) => i.id === c?.imovelId || !imoveisAlugados.has(i.id));

  return (
    <>
      <h2>{c ? 'Editar' : 'Cadastrar'} contrato</h2>
      <form id="frm" onSubmit={enviar} noValidate>
        <div className="fgrid">
          <CampoLista
            nome="imovelId"
            rotulo="Imóvel"
            obrigatorio
            largo
            travado={Boolean(c)}
            valor={v.imovelId}
            vazio="Selecione"
            opcoes={imoveis.map((i) => [i.id, `${i.codigo} · ${i.descricao}, ${i.bairro}, ${i.cidade}`] as const)}
          />
          <CampoLista
            nome="locatarioId"
            rotulo="Locatário"
            obrigatorio
            valor={v.locatarioId}
            vazio="Selecione"
            opcoes={cadastros.locatarios.map((p) => [p.id, p.nome] as const)}
          />
          <CampoLista nome="tipo" rotulo="Tipo de locação" valor={v.tipo} opcoes={opcoes(TIPO)} />
          <CampoTexto nome="inicio" rotulo="Início" obrigatorio tipo="date" valor={v.inicio} />
          <CampoTexto nome="fim" rotulo="Fim do prazo" obrigatorio tipo="date" valor={v.fim} />
          <CampoNumero nome="aluguel" rotulo="Aluguel (R$)" obrigatorio valor={v.aluguel} />
          <CampoNumero nome="taxa" rotulo="Taxa de administração (%)" obrigatorio valor={v.taxa} />
          <CampoNumero nome="venc" rotulo="Dia de vencimento" valor={v.venc} />
          <CampoLista
            nome="formaPagamento"
            rotulo="Forma de pagamento"
            valor={v.formaPagamento}
            opcoes={opcoes(FORMA_PAG)}
          />
          <CampoLista nome="indice" rotulo="Índice de reajuste anual" valor={v.indice} opcoes={opcoes(INDICES)} />
          <CampoLista
            nome="garantia"
            rotulo="Garantia (uma só, art. 37)"
            valor={v.garantia}
            opcoes={opcoes(GARANTIA)}
          />
          <CampoNumero nome="caucao" rotulo="Valor da caução (R$)" valor={v.caucao} />
          <CampoTexto nome="seguradora" rotulo="Seguro-fiança: seguradora" valor={v.seguradora} />
          <CampoTexto nome="apolice" rotulo="Seguro-fiança: número da apólice" valor={v.apolice} />
          <CampoTexto nome="apoliceFim" rotulo="Seguro-fiança: fim da vigência" tipo="date" valor={v.apoliceFim} />
          <CampoNumero nome="premio" rotulo="Seguro-fiança: prêmio mensal (R$)" valor={v.premio} />
          <CampoMarcar nome="antecipada" rotulo="Aluguel cobrado antecipadamente" valor={v.antecipada} />
          <CampoLista
            nome="venia"
            rotulo="Vênia conjugal (prazo de 10 anos ou mais)"
            valor={v.venia}
            opcoes={opcoes(VENIA)}
          />
          <CampoNumero nome="cond" rotulo="Condomínio ordinário no boleto (R$)" valor={v.cond} />
          <CampoNumero nome="iptu" rotulo="IPTU no boleto (R$), se o contrato atribuir ao locatário" valor={v.iptu} />
          <CampoNumero
            nome="intermediacao"
            rotulo="Taxa de intermediação da locação (R$)"
            valor={v.intermediacao}
            dica="Paga pelo proprietário (art. 22, VII) e descontada do primeiro repasse."
          />
          <CampoLista
            nome="corretorLocId"
            rotulo="Corretor que fechou a locação"
            valor={v.corretorLocId}
            vazio="O corretor de origem do imóvel"
            opcoes={cadastros.corretores.map((k) => [k.id, k.nome] as const)}
            dica="Recebe a parte do corretor na taxa de intermediação."
          />
          <CampoNumero nome="diaRepasse" rotulo="Dia do repasse ao proprietário" valor={v.diaRepasse} />
          <CampoTexto
            nome="extraLocDesc"
            rotulo="Outro valor mensal no boleto do locatário: descrição"
            valor={v.extraLocDesc}
            dica="Ex.: seguro contra incêndio."
          />
          <CampoNumero nome="extraLocValor" rotulo="Outro valor mensal no boleto (R$)" valor={v.extraLocValor} />
          <CampoTexto
            nome="extraPropDesc"
            rotulo="Desconto mensal no repasse do proprietário: descrição"
            valor={v.extraPropDesc}
            dica="Ex.: condomínio pago pela Elora."
          />
          <CampoNumero nome="extraPropValor" rotulo="Desconto mensal no repasse (R$)" valor={v.extraPropValor} />
          <CampoAreaTexto
            nome="clausulas"
            rotulo="Condições adicionais para a minuta do contrato"
            largo
            valor={v.clausulas}
          />
          <CampoMarcar nome="docContrato" rotulo="Contrato assinado arquivado" valor={v.docContrato} />
          <CampoMarcar nome="docVistoria" rotulo="Laudo de vistoria de entrada" valor={v.docVistoria} />
          <CampoMarcar nome="docGarantia" rotulo="Comprovante da garantia" valor={v.docGarantia} />
          <CampoMarcar nome="docSeguro" rotulo="Seguro contra incêndio vigente" valor={v.docSeguro} />
          <CampoLista nome="status" rotulo="Situação" valor={v.status} opcoes={opcoes(STATUS_CONTRATO)} />
          <CampoTexto nome="encerradoEm" rotulo="Data de encerramento" tipo="date" valor={v.encerradoEm} />
        </div>
        <Problemas itens={faltando.length ? faltando : problemas} />
        <div className="acts" style={{ marginTop: 16 }}>
          <Botao onClick={aoCancelar}>Cancelar</Botao>
          <button className="btn" type="submit" disabled={ocupado}>
            Salvar
          </button>
        </div>
      </form>
    </>
  );
}
