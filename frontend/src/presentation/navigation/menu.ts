/**
 * Menu da equipe e do portal do corretor (mesma ordem e nomes do protótipo).
 * "migrada: true" = tela já reescrita em React. As demais abrem a versão de referência
 * (protótipo) embutida, até serem migradas — ver docs/MIGRACAO.md.
 */
export interface ItemMenu {
  readonly id: string;
  readonly titulo: string;
  readonly migrada?: boolean;
}

export interface PastaMenu {
  readonly titulo: string | null;
  readonly itens: readonly ItemMenu[];
}

export type Perfil = 'equipe' | 'corretor';

export const MENU: Record<Perfil, readonly PastaMenu[]> = {
  equipe: [
    {
      titulo: null,
      itens: [
        { id: 'central', titulo: 'Dashboard' },
        { id: 'agenda', titulo: 'Agenda' },
        { id: 'chat', titulo: 'Chat da equipe' },
      ],
    },
    {
      titulo: 'Comercial',
      itens: [
        { id: 'comercial', titulo: 'Atendimentos' },
        { id: 'flows', titulo: 'Sequências' },
        { id: 'campanhas', titulo: 'Campanhas' },
        { id: 'compradores', titulo: 'Banco de compradores' },
        { id: 'prospeccao', titulo: 'Prospecção' },
        { id: 'rede', titulo: 'Corretores Elora' },
        { id: 'desempenho', titulo: 'Relatórios' },
        { id: 'rodizio', titulo: 'Rodízio e funil' },
      ],
    },
    {
      titulo: 'Imóveis',
      itens: [
        { id: 'im-venda', titulo: 'Imóveis à venda' },
        { id: 'im-locacao', titulo: 'Imóveis para locação' },
        { id: 'im-cuidado', titulo: 'Recebimento e manutenção' },
      ],
    },
    {
      titulo: 'Operações',
      itens: [
        { id: 'locacao', titulo: 'Locação' },
        { id: 'financeiro', titulo: 'Financeiro' },
        { id: 'posvenda', titulo: 'Elora Casa+', migrada: true },
        { id: 'pessoas', titulo: 'Pessoas' },
      ],
    },
    {
      titulo: 'Gestão',
      itens: [
        { id: 'reunioes', titulo: 'Reuniões' },
        { id: 'tickets', titulo: 'Tickets e Kanban' },
        { id: 'resultados', titulo: 'Resultados e OKRs' },
        { id: 'ideias', titulo: 'Projeto Boa Ideia' },
      ],
    },
    {
      titulo: 'Diretoria',
      itens: [
        { id: 'guerra', titulo: 'Sala de guerra' },
        { id: 'inteligencia', titulo: 'Inteligência' },
        { id: 'juridico', titulo: 'Jurídico' },
        { id: 'acessos', titulo: 'Acessos' },
      ],
    },
    { titulo: 'Tecnologia', itens: [{ id: 'dados', titulo: 'Dados' }] },
  ],
  corretor: [
    { titulo: null, itens: [{ id: 'inicio', titulo: 'Início' }] },
    {
      titulo: 'CRM de Atendimento',
      itens: [
        { id: 'crm-c', titulo: 'Atendimentos' },
        { id: 'flows-c', titulo: 'Mensagens do dia' },
        { id: 'leads-c', titulo: 'Meus leads' },
        { id: 'imoveis-c', titulo: 'Imóveis' },
        { id: 'capt-c', titulo: 'Minhas captações' },
        { id: 'prosp-c', titulo: 'Prospecção' },
        { id: 'compradores-c', titulo: 'Compradores' },
        { id: 'agenda-c', titulo: 'Agenda' },
      ],
    },
    {
      titulo: 'Meus ganhos',
      itens: [
        { id: 'carteira', titulo: 'Carteira' },
        { id: 'extrato', titulo: 'Extrato' },
        { id: 'poschaves-c', titulo: 'Elora Casa+' },
      ],
    },
    {
      titulo: 'Elora',
      itens: [
        { id: 'chat-c', titulo: 'Chat da equipe' },
        { id: 'treino-c', titulo: 'Treinamento' },
        { id: 'ideias-c', titulo: 'Projeto Boa Ideia' },
        { id: 'ia', titulo: 'Elora AI' },
      ],
    },
  ],
};

export const todasAsTelas = (perfil: Perfil): ItemMenu[] => MENU[perfil].flatMap((p) => p.itens);
export const perfilDaTela = (id: string): Perfil =>
  todasAsTelas('corretor').some((i) => i.id === id) ? 'corretor' : 'equipe';
export const telaMigrada = (id: string): boolean =>
  [...todasAsTelas('equipe'), ...todasAsTelas('corretor')].some((i) => i.id === id && i.migrada);
