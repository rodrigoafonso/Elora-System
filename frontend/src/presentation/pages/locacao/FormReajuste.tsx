import { useState, type FormEvent } from 'react';
import { INDICES, rotuloContrato, type ContratoLocacao } from '@/domain/locacao/contrato';
import {
  aluguelReajustado,
  dataSugeridaDeReajuste,
  ultimoReajuste,
  type ProblemaContrato,
} from '@/domain/locacao/regras';
import { formatarData, somaMeses } from '@/domain/shared/datas';
import { formatarPct, formatarReais } from '@/domain/shared/dinheiro';
import { Problemas } from '../../components/Problemas';
import { Botao } from '../../components/ui';

/** Reajuste anual do aluguel (abrirReajuste do protótipo). */
export function FormReajuste({
  contrato: c,
  hoje,
  problemas,
  ocupado,
  aoEnviar,
  aoCancelar,
}: {
  contrato: ContratoLocacao;
  hoje: string;
  problemas: readonly ProblemaContrato[];
  ocupado: boolean;
  aoEnviar: (d: { em: string; pct: number; novo: number }) => void;
  aoCancelar: () => void;
}) {
  const base = ultimoReajuste(c) ?? c.inicio;
  const [pctTexto, setPctTexto] = useState('');
  const [novoTexto, setNovoTexto] = useState('');
  const pct = parseFloat(pctTexto);
  const novo = parseFloat(novoTexto);

  const mudarPct = (t: string) => {
    setPctTexto(t);
    const p = parseFloat(t);
    setNovoTexto(Number.isFinite(p) ? aluguelReajustado(c.aluguel, p).toFixed(2) : '');
  };

  const enviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const em = String(new FormData(e.currentTarget).get('rj-em') ?? '');
    aoEnviar({ em, pct, novo });
  };

  return (
    <>
      <h2>Reajustar o aluguel</h2>
      <p className="sub">
        {rotuloContrato(c)} · {c.locatario.nome} · índice do contrato: {INDICES[c.indice]}
      </p>
      <div className="facts">
        <div>
          <span>Aluguel atual</span>
          {formatarReais(c.aluguel)}
        </div>
        <div>
          <span>Último marco</span>
          {formatarData(base)}
          {ultimoReajuste(c) ? ' (reajuste)' : ' (início do contrato)'}
        </div>
        <div>
          <span>Pode reajustar a partir de</span>
          {formatarData(somaMeses(base, 12))}
        </div>
      </div>
      <form id="frm-rj" onSubmit={enviar} noValidate>
        <div className="fgrid">
          <div className="f">
            <label htmlFor="rj-em">Reajuste vale a partir de *</label>
            <input id="rj-em" name="rj-em" type="date" defaultValue={dataSugeridaDeReajuste(c, hoje)} required />
          </div>
          <div className="f">
            <label htmlFor="rj-pct">Variação acumulada do índice em 12 meses (%) *</label>
            <input
              id="rj-pct"
              type="number"
              step="0.01"
              min="-30"
              max="60"
              required
              placeholder="Ex.: 4,62"
              value={pctTexto}
              onChange={(e) => mudarPct(e.target.value)}
            />
            <small>Consulte o índice na fonte oficial. O sistema não busca índices.</small>
          </div>
          <div className="f">
            <label htmlFor="rj-novo">Novo aluguel (R$) *</label>
            <input
              id="rj-novo"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={novoTexto}
              onChange={(e) => setNovoTexto(e.target.value)}
            />
            <small>Calculado pela variação. Ajuste se as partes combinarem outro valor.</small>
          </div>
        </div>
        <div className="memo num" id="rj-out" style={{ marginTop: 14 }}>
          {Number.isFinite(pct) && novo > 0 ? (
            <>
              <div>
                <span>Aluguel atual</span>
                <span>{formatarReais(c.aluguel)}</span>
              </div>
              <div>
                <span>Variação informada do {INDICES[c.indice]}</span>
                <span>{formatarPct(pct)}</span>
              </div>
              <div className="t">
                <span>Novo aluguel</span>
                <span>{formatarReais(novo)}</span>
              </div>
              <p>
                Diferença de {formatarReais(novo - c.aluguel)} por mês. A taxa de administração e a participação do
                corretor passam a ser calculadas sobre o novo valor.
              </p>
            </>
          ) : (
            <p>Informe a variação acumulada do índice nos doze meses.</p>
          )}
        </div>
        <Problemas itens={problemas} />
        <div className="acts" style={{ marginTop: 16 }}>
          <Botao onClick={aoCancelar}>Cancelar</Botao>
          <button className="btn" type="submit" disabled={ocupado}>
            Aplicar o reajuste
          </button>
        </div>
      </form>
      {c.reajustes.length ? (
        <>
          <h3>Reajustes anteriores</h3>
          <div className="tl">
            {[...c.reajustes].reverse().map((r) => (
              <div key={r.em}>
                <span>{formatarData(r.em)}</span>
                <p>
                  {INDICES[r.indice]} {formatarPct(r.pct)}: de {formatarReais(r.de)} para {formatarReais(r.para)}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
