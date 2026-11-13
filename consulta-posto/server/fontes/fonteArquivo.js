// Fonte de dados baseada em um arquivo JSON normalizado (base DEMO ou base importada de arquivos oficiais).
//
// Contrato de qualquer fonte (para trocar por uma integração oficial no futuro):
//   info()            -> { disponivel, meta, filtros, erro? }
//   buscar(criterios) -> { total, pagina, porPagina, itens, buscaPorCnpj }
//   obterPosto(id)    -> { posto, fiscalizacoes } | null
//   postoExiste(id)   -> boolean
// Toda fonte deve informar em meta: tipo ('demo' | 'oficial'), origem, licença e datas de obtenção/atualização.
import { readFile } from 'node:fs/promises';
import { buscarPostos, detalharPosto, filtrosDisponiveis } from '../dominio/busca.js';
import { validarBase } from './validarBase.js';

export class FonteIndisponivelError extends Error {}

export class FonteArquivo {
  constructor(caminho) {
    this.caminho = caminho;
    this.base = null;
    this.erro = null;
  }

  async carregar() {
    try {
      const bruto = JSON.parse(await readFile(this.caminho, 'utf8'));
      const problemas = validarBase(bruto);
      if (problemas.length) throw new Error(`Base inválida: ${problemas.slice(0, 5).join('; ')}`);
      this.base = bruto;
      this.erro = null;
    } catch (e) {
      this.base = null;
      this.erro = e.code === 'ENOENT' ? `Arquivo de dados não encontrado (${this.caminho}).` : e.message;
    }
    return this;
  }

  #exigirBase() {
    if (!this.base) throw new FonteIndisponivelError(this.erro ?? 'Fonte de dados não carregada.');
    return this.base;
  }

  info() {
    if (!this.base) return { disponivel: false, erro: this.erro, meta: null, filtros: null };
    return {
      disponivel: true,
      meta: this.base.meta,
      filtros: filtrosDisponiveis(this.base),
      totalPostos: this.base.postos.length,
    };
  }

  async buscar(criterios) {
    return buscarPostos(this.#exigirBase(), criterios);
  }

  postoExiste(id) {
    return Boolean(this.base?.postos.some((p) => p.id === id));
  }

  async obterPosto(id) {
    return detalharPosto(this.#exigirBase(), id);
  }
}
