// Valida a estrutura mínima de uma base normalizada antes de exibi-la.
// A regra principal: nenhuma base é servida sem tipo, origem, licença e data de obtenção declarados.
import { dataIsoValida } from '../dominio/texto.js';

const TIPOS = ['demo', 'oficial'];

export function validarMetaFonte(f, rotulo) {
  const erros = [];
  if (!f || typeof f !== 'object') return [`${rotulo}: ausente`];
  if (!f.nome) erros.push(`${rotulo}.nome ausente`);
  if (!f.url || !/^https:\/\//.test(f.url)) erros.push(`${rotulo}.url deve ser https`);
  if (!f.licenca) erros.push(`${rotulo}.licenca ausente`);
  if (!dataIsoValida(f.obtidoEm)) erros.push(`${rotulo}.obtidoEm deve ser AAAA-MM-DD`);
  if (f.atualizadoEm && !dataIsoValida(f.atualizadoEm)) erros.push(`${rotulo}.atualizadoEm deve ser AAAA-MM-DD`);
  return erros;
}

export function validarBase(base) {
  const erros = [];
  const meta = base?.meta;
  if (!meta) return ['meta ausente'];
  if (!TIPOS.includes(meta.tipo)) erros.push(`meta.tipo deve ser ${TIPOS.join(' ou ')}`);
  if (meta.tipo === 'demo' && !/DEMO/.test(meta.aviso ?? '')) erros.push('base DEMO precisa de meta.aviso contendo "DEMO"');
  erros.push(...validarMetaFonte(meta.fontes?.cadastro, 'meta.fontes.cadastro'));
  if (meta.camposConfiaveis?.fiscalizacoes) {
    erros.push(...validarMetaFonte(meta.fontes?.fiscalizacoes, 'meta.fontes.fiscalizacoes'));
  }
  if (!Array.isArray(base.postos)) erros.push('postos deve ser uma lista');
  if (!Array.isArray(base.fiscalizacoes)) erros.push('fiscalizacoes deve ser uma lista');
  const ids = new Set();
  for (const p of base.postos ?? []) {
    if (!p.id) erros.push('posto sem id');
    if (ids.has(p.id)) erros.push(`id duplicado: ${p.id}`);
    ids.add(p.id);
  }
  for (const f of base.fiscalizacoes ?? []) {
    if (!ids.has(f.postoId)) erros.push(`fiscalização ${f.id} aponta para posto inexistente`);
    if (f.data && !dataIsoValida(f.data)) erros.push(`fiscalização ${f.id} com data inválida`);
  }
  return erros;
}
