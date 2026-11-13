// Indicador de alerta ao consumidor, calculado SÓ a partir dos registros oficiais de fiscalização.
// Regra pública (exibida no app, em "Sobre os dados"). Não é a nota oficial da ANP e não diz se o
// combustível está adulterado agora: resume o que a fonte registrou e quando.
import { normalizar } from './texto.js';

export const NIVEIS = {
  alerta: {
    rotulo: 'Alerta',
    regra: 'Nos últimos 12 meses há registro de interdição, de amostra de combustível reprovada ou fora da especificação, ou de irregularidade na bomba medidora (aferição ou volume).',
  },
  atencao: {
    rotulo: 'Atenção',
    regra: 'Nos últimos 24 meses há auto de infração, ou um dos registros do nível “Alerta” ocorreu entre 12 e 24 meses atrás.',
  },
  sem_alerta: {
    rotulo: 'Sem alertas',
    regra: 'Houve fiscalização nos últimos 24 meses e nenhuma das situações acima foi registrada. Não significa que o posto seja seguro.',
  },
  sem_registro: {
    rotulo: 'Sem fiscalização recente',
    regra: 'Nenhuma fiscalização registrada na base nos últimos 24 meses. Não significa ausência de problemas.',
  },
};

// Termos dos resultados oficiais (comparados sem acento e sem caixa).
const QUALIDADE = /reprovad|fora das especifica|teor de metanol|marcador\/solvente|induzam a erro quanto a qualidade/;
const QUANTIDADE = /afericao irregular|alteracao do volume|medida-padrao|sem passar pela bomba/;
const INTERDICAO = /^(re)?interdicao/;

function descricoes(f) {
  return (f.ocorrencias?.length ? f.ocorrencias.map((o) => o.descricao) : [f.resultado]).filter(Boolean);
}

/** Classifica um registro: 'grave' (critérios de Alerta), 'infracao' (auto de infração) ou null. */
export function gravidade(f) {
  const lista = descricoes(f);
  const motivoGrave = lista.find((t) => {
    const n = normalizar(t);
    return QUALIDADE.test(n) || QUANTIDADE.test(n) || INTERDICAO.test(n);
  });
  if (motivoGrave) return { tipo: 'grave', motivo: motivoGrave };
  const tipo = normalizar(f.tipo);
  if (tipo === 'auto de interdicao') return { tipo: 'grave', motivo: lista[0] ?? 'Auto de Interdição' };
  if (tipo === 'auto de infracao') return { tipo: 'infracao', motivo: lista[0] ?? 'Auto de Infração' };
  return null;
}

function mesesAntes(iso, meses) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() - meses);
  return d.toISOString().slice(0, 10);
}

/**
 * @param fiscalizacoes registros do posto (qualquer ordem)
 * @param referencia data ISO usada como "hoje" — a data mais recente da base, para não depender do relógio
 */
export function calcularAlerta(fiscalizacoes, referencia) {
  const corte12 = mesesAntes(referencia, 12);
  const corte24 = mesesAntes(referencia, 24);
  const recentes = fiscalizacoes
    .filter((f) => f.data && f.data >= corte24 && f.data <= referencia)
    .sort((a, b) => b.data.localeCompare(a.data));
  const resultado = (nivel, registro, motivo) => ({
    nivel,
    rotulo: NIVEIS[nivel].rotulo,
    data: registro?.data ?? null,
    motivo: motivo ?? null,
    referencia,
  });
  if (!recentes.length) return resultado('sem_registro');
  let atencao = null;
  for (const f of recentes) {
    const g = gravidade(f);
    if (!g) continue;
    if (g.tipo === 'grave' && f.data >= corte12) return resultado('alerta', f, g.motivo);
    atencao ??= { f, motivo: g.motivo ?? f.tipo };
  }
  if (atencao) return resultado('atencao', atencao.f, atencao.motivo);
  return resultado('sem_alerta', recentes[0], null);
}

/** Data de referência da base: a fiscalização mais recente registrada. */
export function referenciaDaBase(fiscalizacoes) {
  let max = null;
  for (const f of fiscalizacoes) if (f.data && (!max || f.data > max)) max = f.data;
  return max;
}
