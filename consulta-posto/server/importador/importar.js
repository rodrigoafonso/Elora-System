// Converte linhas de arquivos oficiais (CSV/JSON já lidos) para a base normalizada do app.
// O mapeamento de colunas vem de um arquivo JSON (ver importador/mapeamento.exemplo.json) porque os
// nomes das colunas devem ser conferidos nos metadados oficiais de cada conjunto de dados antes do uso.
import { createHash } from 'node:crypto';
import { apenasDigitos, cnpjValido, paraDataIso, paraNumero, coordenadaValida } from '../dominio/texto.js';
import { validarMetaFonte } from '../fontes/validarBase.js';

/** Primeiro valor não vazio entre as colunas candidatas. */
function pegar(linha, candidatas) {
  if (!candidatas) return null;
  for (const c of [].concat(candidatas)) {
    const v = linha[c];
    if (v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return null;
}

function idDoPosto(cnpj) {
  return `p-${createHash('sha256').update(cnpj).digest('hex').slice(0, 12)}`;
}

export function importar({ linhasCadastro, linhasFiscalizacoes = [], mapeamento, fontes, nome }) {
  const avisos = [];
  const erroFontes = [
    ...validarMetaFonte(fontes?.cadastro, 'fonte do cadastro'),
    ...(linhasFiscalizacoes.length ? validarMetaFonte(fontes?.fiscalizacoes, 'fonte das fiscalizações') : []),
  ];
  if (erroFontes.length) {
    throw new Error(
      `Informe origem, URL, licença e data de obtenção antes de importar: ${erroFontes.join('; ')}`,
    );
  }

  const mc = mapeamento.cadastro ?? {};
  const postosPorCnpj = new Map();
  let semCnpj = 0;
  let cnpjInvalido = 0;
  for (const linha of linhasCadastro) {
    const cnpj = apenasDigitos(pegar(linha, mc.cnpj));
    if (cnpj.length !== 14) {
      semCnpj++;
      continue;
    }
    if (!cnpjValido(cnpj)) cnpjInvalido++;
    const lat = paraNumero(pegar(linha, mc.latitude));
    const lon = paraNumero(pegar(linha, mc.longitude));
    const combustiveisBruto = pegar(linha, mc.combustiveis);
    const posto = {
      id: idDoPosto(cnpj),
      cnpj,
      razaoSocial: pegar(linha, mc.razaoSocial),
      nomeFantasia: pegar(linha, mc.nomeFantasia),
      endereco: {
        logradouro: pegar(linha, mc.logradouro),
        numero: pegar(linha, mc.numero),
        complemento: pegar(linha, mc.complemento),
        bairro: pegar(linha, mc.bairro),
        cep: pegar(linha, mc.cep),
        municipio: pegar(linha, mc.municipio),
        uf: pegar(linha, mc.uf)?.toUpperCase() ?? null,
      },
      coordenadas: coordenadaValida(lat, lon) ? { lat, lon } : null,
      bandeira: pegar(linha, mc.bandeira),
      situacaoCadastral: pegar(linha, mc.situacaoCadastral),
      combustiveis: combustiveisBruto
        ? combustiveisBruto.split(mapeamento.separadorCombustiveis ?? ',').map((c) => c.trim()).filter(Boolean)
        : null,
      autorizacao: { numero: pegar(linha, mc.autorizacaoNumero), data: paraDataIso(pegar(linha, mc.autorizacaoData)) },
    };
    // CNPJ repetido: mantém o último registro (arquivos de cadastro costumam trazer a versão mais recente por último).
    postosPorCnpj.set(cnpj, posto);
  }
  if (semCnpj) avisos.push(`${semCnpj} linha(s) do cadastro ignoradas por não terem CNPJ com 14 dígitos.`);
  if (cnpjInvalido) avisos.push(`${cnpjInvalido} CNPJ(s) com dígito verificador inválido mantidos como na fonte.`);

  const mf = mapeamento.fiscalizacoes ?? {};
  const fiscPorChave = new Map();
  let semPosto = 0;
  for (const linha of linhasFiscalizacoes) {
    const cnpj = apenasDigitos(pegar(linha, mf.cnpj));
    const posto = postosPorCnpj.get(cnpj);
    if (!posto) {
      semPosto++;
      continue;
    }
    const data = paraDataIso(pegar(linha, mf.data));
    const documento = pegar(linha, mf.documento);
    const tipo = pegar(linha, mf.tipo);
    // Arquivos de fiscalização podem trazer uma linha por infração: agrupa pela ação.
    const chave = [cnpj, data, documento ?? '', tipo ?? ''].join('|');
    if (!fiscPorChave.has(chave)) {
      fiscPorChave.set(chave, {
        id: `${posto.id}-${createHash('sha256').update(chave).digest('hex').slice(0, 8)}`,
        postoId: posto.id,
        data,
        tipo,
        resultado: pegar(linha, mf.resultado),
        ocorrencias: [],
        documento,
      });
    }
    const descricao = pegar(linha, mf.ocorrenciaDescricao);
    if (descricao) {
      fiscPorChave.get(chave).ocorrencias.push({ categoria: pegar(linha, mf.ocorrenciaCategoria), descricao });
    }
  }
  if (semPosto) avisos.push(`${semPosto} linha(s) de fiscalização sem posto correspondente no cadastro (por CNPJ).`);

  const postos = [...postosPorCnpj.values()];
  const temCampo = (f) => postos.some(f);
  const base = {
    meta: {
      tipo: 'oficial',
      nome: nome ?? 'Base importada de arquivos oficiais',
      aviso: null,
      camposConfiaveis: {
        combustiveis: Boolean(mc.combustiveis) && temCampo((p) => p.combustiveis?.length),
        situacaoCadastral: Boolean(mc.situacaoCadastral) && temCampo((p) => p.situacaoCadastral),
        fiscalizacoes: linhasFiscalizacoes.length > 0,
      },
      fontes: { cadastro: fontes.cadastro, ...(linhasFiscalizacoes.length ? { fiscalizacoes: fontes.fiscalizacoes } : {}) },
      geradoEm: new Date().toISOString().slice(0, 10),
    },
    postos,
    fiscalizacoes: [...fiscPorChave.values()],
  };
  return { base, avisos };
}
