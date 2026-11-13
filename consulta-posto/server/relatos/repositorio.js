// Armazenamento de relatos em arquivo JSON local (MVP). Trocar por um banco de dados em produção
// mantendo a mesma interface. Dados pessoais (e-mail) e anexos nunca saem por rotas públicas.
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ocultarDadosPessoais, TIPOS_PROBLEMA } from './validacao.js';

/** Prazos de retenção (em dias). Mantidos em sincronia com a política de privacidade. */
export const RETENCAO = {
  emModeracao: 90, // relato não analisado é apagado depois disso
  rejeitado: 30,
  publicado: 730, // 24 meses
  anexos: 90, // imagens: só para moderação; apagadas ao decidir ou após 90 dias
  contato: 90, // e-mail: apagado ao decidir ou após 90 dias
  solicitacaoRemocao: 180,
};

const DIA = 24 * 60 * 60 * 1000;
const hash = (t) => createHash('sha256').update(t).digest('hex');

function iguais(a, b) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export class RepositorioRelatos {
  constructor(diretorio, relogio = () => new Date()) {
    this.dir = diretorio;
    this.arquivo = join(diretorio, 'relatos.json');
    this.dirAnexos = join(diretorio, 'anexos');
    this.relogio = relogio;
    this.dados = { relatos: [], solicitacoesRemocao: [] };
    this.fila = Promise.resolve();
  }

  async iniciar() {
    await mkdir(this.dirAnexos, { recursive: true });
    try {
      this.dados = JSON.parse(await readFile(this.arquivo, 'utf8'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
    await this.aplicarRetencao();
    return this;
  }

  /** Serializa escritas e grava de forma atômica (arquivo temporário + rename). */
  #salvar() {
    this.fila = this.fila.then(async () => {
      const tmp = `${this.arquivo}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(this.dados));
      await rename(tmp, this.arquivo);
    });
    return this.fila;
  }

  async criar({ postoId, dataAproximada, tipoProblema, descricao, contato, anexos }) {
    const agora = this.relogio().toISOString();
    const id = randomUUID();
    const protocolo = `R-${randomBytes(4).toString('hex').toUpperCase()}`;
    const codigoRemocao = randomBytes(9).toString('base64url');
    const nomesAnexos = [];
    for (const [i, a] of anexos.entries()) {
      const nome = `${id}-${i}.${a.tipo === 'image/png' ? 'png' : 'jpg'}`;
      await writeFile(join(this.dirAnexos, nome), a.bytes);
      nomesAnexos.push({ nome, tipo: a.tipo });
    }
    this.dados.relatos.push({
      id,
      protocolo,
      codigoRemocaoHash: hash(codigoRemocao),
      postoId,
      dataAproximada,
      tipoProblema,
      descricao,
      contato,
      anexos: nomesAnexos,
      status: 'em_moderacao',
      criadoEm: agora,
      decididoEm: null,
    });
    await this.#salvar();
    return { protocolo, codigoRemocao };
  }

  /** Visão pública: só relatos publicados após moderação, sem contato, sem anexos, com dados pessoais ocultos. */
  listarPublicos(postoId) {
    const doPosto = this.dados.relatos.filter((r) => r.postoId === postoId);
    return {
      itens: doPosto
        .filter((r) => r.status === 'publicado')
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
        .map((r) => ({
          id: r.id,
          tipoProblema: TIPOS_PROBLEMA[r.tipoProblema] ?? 'Outro',
          dataAproximada: r.dataAproximada,
          descricao: ocultarDadosPessoais(r.descricao),
          enviadoEm: r.criadoEm.slice(0, 7), // só mês/ano
          verificado: false,
        })),
      aguardandoModeracao: doPosto.filter((r) => r.status === 'em_moderacao').length,
    };
  }

  /** Remoção pelo próprio autor (protocolo + código recebido no envio). */
  async removerPeloAutor(protocolo, codigo) {
    const r = this.dados.relatos.find((x) => x.protocolo === String(protocolo ?? '').trim().toUpperCase());
    if (!r || !codigo || !iguais(r.codigoRemocaoHash, hash(String(codigo).trim()))) return false;
    await this.#apagar(r);
    await this.#salvar();
    return true;
  }

  /** Pedido de remoção feito por terceiros (ex.: responsável pelo posto). Vai para análise. */
  async registrarSolicitacaoRemocao({ referencia, motivo, contato }) {
    const protocolo = `S-${randomBytes(4).toString('hex').toUpperCase()}`;
    this.dados.solicitacoesRemocao.push({
      protocolo,
      referencia,
      motivo,
      contato,
      status: 'aberta',
      criadoEm: this.relogio().toISOString(),
    });
    await this.#salvar();
    return { protocolo };
  }

  // --- Moderação -------------------------------------------------------------------------------

  listarParaModeracao() {
    return {
      relatos: this.dados.relatos
        .filter((r) => r.status === 'em_moderacao')
        .map(({ codigoRemocaoHash, ...r }) => r),
      solicitacoesRemocao: this.dados.solicitacoesRemocao.filter((s) => s.status === 'aberta'),
    };
  }

  caminhoAnexo(relatoId, nome) {
    const r = this.dados.relatos.find((x) => x.id === relatoId);
    const a = r?.anexos.find((x) => x.nome === nome);
    return a ? { caminho: join(this.dirAnexos, a.nome), tipo: a.tipo } : null;
  }

  async decidir(id, decisao) {
    const r = this.dados.relatos.find((x) => x.id === id);
    if (!r || r.status !== 'em_moderacao') return null;
    r.status = decisao === 'publicar' ? 'publicado' : 'rejeitado';
    r.decididoEm = this.relogio().toISOString();
    // Após a decisão, anexos e contato deixam de ser necessários.
    await this.#apagarAnexos(r);
    r.contato = null;
    await this.#salvar();
    return { id: r.id, status: r.status };
  }

  async removerPorModeracao(id) {
    const r = this.dados.relatos.find((x) => x.id === id);
    if (!r) return false;
    await this.#apagar(r);
    await this.#salvar();
    return true;
  }

  async fecharSolicitacao(protocolo) {
    const s = this.dados.solicitacoesRemocao.find((x) => x.protocolo === protocolo);
    if (!s) return false;
    s.status = 'fechada';
    s.contato = null;
    await this.#salvar();
    return true;
  }

  // --- Retenção --------------------------------------------------------------------------------

  async aplicarRetencao() {
    const agora = this.relogio().getTime();
    const idade = (iso) => (agora - new Date(iso).getTime()) / DIA;
    for (const r of [...this.dados.relatos]) {
      const limite = { em_moderacao: RETENCAO.emModeracao, rejeitado: RETENCAO.rejeitado, publicado: RETENCAO.publicado }[r.status];
      if (limite && idade(r.criadoEm) > limite) {
        await this.#apagar(r);
        continue;
      }
      if (r.anexos.length && idade(r.criadoEm) > RETENCAO.anexos) await this.#apagarAnexos(r);
      if (r.contato && idade(r.criadoEm) > RETENCAO.contato) r.contato = null;
    }
    this.dados.solicitacoesRemocao = this.dados.solicitacoesRemocao.filter(
      (s) => idade(s.criadoEm) <= RETENCAO.solicitacaoRemocao,
    );
    await this.#salvar();
  }

  async #apagarAnexos(r) {
    for (const a of r.anexos) await rm(join(this.dirAnexos, a.nome), { force: true });
    r.anexos = [];
  }

  async #apagar(r) {
    await this.#apagarAnexos(r);
    this.dados.relatos = this.dados.relatos.filter((x) => x.id !== r.id);
  }
}
