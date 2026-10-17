/**
 * Menu da equipe e do portal do corretor (mesma ordem e nomes do protótipo, versão 50).
 * Organizado pela pergunta do dia a dia: Hoje, Clientes, Imóveis, Operações, Equipe, Análises e Configurações.
 * Uma entrada pode reunir telas irmãs (grupo): o menu mostra uma linha e a tela mostra as abas.
 * "migrada: true" = tela já reescrita em React. As demais abrem a versão de referência (protótipo)
 * embutida, até serem migradas — ver docs/MIGRACAO.md.
 */
import type { NomeIcone } from '../components/Icone';

export interface ItemMenu {
  readonly id: string;
  readonly titulo: string;
  readonly migrada?: boolean;
  /** Fora do menu (ex.: chat, que fica no alto de cada tela), mas com rota. */
  readonly oculta?: boolean;
}

/** Uma linha do menu: uma tela, ou um grupo de telas irmãs (abas). */
export interface EntradaMenu {
  readonly titulo: string;
  readonly telas: readonly ItemMenu[];
}

export interface AreaMenu {
  readonly titulo: string;
  readonly icone: NomeIcone;
  readonly entradas: readonly EntradaMenu[];
}

export type Perfil = 'equipe' | 'corretor';

const tela = (id: string, titulo: string, extra: Partial<ItemMenu> = {}): EntradaMenu => ({
  titulo,
  telas: [{ id, titulo, ...extra }],
});
const grupo = (titulo: string, ...telas: ItemMenu[]): EntradaMenu => ({ titulo, telas });

export const MENU: Record<Perfil, readonly AreaMenu[]> = {
  equipe: [
    {
      titulo: 'Hoje',
      icone: 'hoje',
      entradas: [
        tela('central', 'Dashboard'),
        tela('agenda', 'Agenda'),
        tela('chat', 'Chat da equipe', { oculta: true }),
      ],
    },
    {
      titulo: 'Clientes',
      icone: 'clientes',
      entradas: [
        grupo(
          'Atendimentos',
          { id: 'comercial', titulo: 'Funil de atendimento' },
          { id: 'compradores', titulo: 'Compradores' },
          { id: 'flows', titulo: 'Sequências' },
        ),
        tela('pessoas', 'Pessoas'),
        tela('campanhas', 'Campanhas'),
      ],
    },
    {
      titulo: 'Imóveis',
      icone: 'imoveis',
      entradas: [
        grupo(
          'Imóveis',
          { id: 'im-locacao', titulo: 'Para locação' },
          { id: 'im-venda', titulo: 'À venda' },
          { id: 'im-cuidado', titulo: 'Recebimento e manutenção' },
        ),
        tela('prospeccao', 'Captação'),
      ],
    },
    {
      titulo: 'Operações',
      icone: 'operacoes',
      entradas: [
        tela('locacao', 'Locação', { migrada: true }),
        tela('financeiro', 'Financeiro'),
        tela('posvenda', 'Elora Casa+', { migrada: true }),
      ],
    },
    {
      titulo: 'Equipe',
      icone: 'equipe',
      entradas: [
        grupo('Corretores', { id: 'rede', titulo: 'Corretores' }, { id: 'rodizio', titulo: 'Rodízio e funil' }),
        tela('tickets', 'Tickets e Kanban'),
        tela('reunioes', 'Reuniões'),
        tela('ideias', 'Projeto Boa Ideia'),
      ],
    },
    {
      titulo: 'Análises',
      icone: 'analises',
      entradas: [
        grupo(
          'Relatórios',
          { id: 'desempenho', titulo: 'Comercial' },
          { id: 'resultados', titulo: 'Resultados e OKRs' },
        ),
        grupo(
          'Inteligência',
          { id: 'inteligencia', titulo: 'Inteligência' },
          { id: 'guerra', titulo: 'Sala de guerra' },
        ),
      ],
    },
    {
      titulo: 'Configurações',
      icone: 'configuracoes',
      entradas: [
        grupo(
          'Configurações',
          { id: 'juridico', titulo: 'Empresa e jurídico' },
          { id: 'acessos', titulo: 'Acessos' },
          { id: 'dados', titulo: 'Dados' },
        ),
      ],
    },
  ],
  corretor: [
    {
      titulo: 'Hoje',
      icone: 'hoje',
      entradas: [
        tela('inicio', 'Início'),
        tela('agenda-c', 'Agenda'),
        tela('flows-c', 'Mensagens do dia'),
        tela('chat-c', 'Chat da equipe', { oculta: true }),
      ],
    },
    {
      titulo: 'Clientes',
      icone: 'clientes',
      entradas: [
        grupo(
          'Atendimentos',
          { id: 'crm-c', titulo: 'Funil' },
          { id: 'leads-c', titulo: 'Meus leads' },
          { id: 'compradores-c', titulo: 'Compradores' },
        ),
      ],
    },
    {
      titulo: 'Imóveis',
      icone: 'imoveis',
      entradas: [
        tela('imoveis-c', 'Imóveis em oferta'),
        grupo('Captação', { id: 'capt-c', titulo: 'Minhas captações' }, { id: 'prosp-c', titulo: 'Prospecção' }),
      ],
    },
    {
      titulo: 'Meus ganhos',
      icone: 'meusganhos',
      entradas: [
        grupo('Carteira e extrato', { id: 'carteira', titulo: 'Carteira' }, { id: 'extrato', titulo: 'Extrato' }),
        tela('poschaves-c', 'Elora Casa+'),
      ],
    },
    {
      titulo: 'Elora',
      icone: 'elora',
      entradas: [tela('treino-c', 'Treinamento'), tela('ideias-c', 'Projeto Boa Ideia'), tela('ia', 'Elora AI')],
    },
  ],
};

export const todasAsTelas = (perfil: Perfil): ItemMenu[] =>
  MENU[perfil].flatMap((a) => a.entradas.flatMap((e) => e.telas));
export const perfilDaTela = (id: string): Perfil =>
  todasAsTelas('corretor').some((i) => i.id === id) ? 'corretor' : 'equipe';
export const telaMigrada = (id: string): boolean =>
  [...todasAsTelas('equipe'), ...todasAsTelas('corretor')].some((i) => i.id === id && i.migrada);

/** Entradas visíveis no menu (sem as ocultas). */
export const entradasVisiveis = (area: AreaMenu): EntradaMenu[] =>
  area.entradas.map((e) => ({ ...e, telas: e.telas.filter((t) => !t.oculta) })).filter((e) => e.telas.length > 0);

/** A entrada do menu (grupo ou tela) que contém a tela. */
export const entradaDaTela = (id: string): EntradaMenu | undefined =>
  (['equipe', 'corretor'] as const)
    .flatMap((p) => MENU[p].flatMap((a) => a.entradas))
    .find((e) => e.telas.some((t) => t.id === id));

/** Telas para a busca "Ir para": nome com o grupo e a área. */
export const telasParaBusca = (perfil: Perfil): { id: string; nome: string; area: string }[] =>
  MENU[perfil].flatMap((a) =>
    a.entradas.flatMap((e) =>
      e.telas.map((t) => ({
        id: t.id,
        nome: e.telas.length > 1 && e.titulo !== t.titulo ? `${e.titulo} · ${t.titulo}` : t.titulo,
        area: a.titulo,
      })),
    ),
  );
