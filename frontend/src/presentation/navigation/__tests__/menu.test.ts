import { describe, expect, it } from 'vitest';
import { MENU, entradaDaTela, entradasVisiveis, perfilDaTela, telasParaBusca, todasAsTelas } from '../menu';

// Todas as telas que existiam antes da reorganização do menu (nenhuma pode sumir: os endereços continuam).
const EQUIPE = [
  'central',
  'agenda',
  'chat',
  'comercial',
  'flows',
  'campanhas',
  'compradores',
  'prospeccao',
  'rede',
  'desempenho',
  'rodizio',
  'im-venda',
  'im-locacao',
  'im-cuidado',
  'locacao',
  'financeiro',
  'posvenda',
  'pessoas',
  'reunioes',
  'tickets',
  'resultados',
  'ideias',
  'guerra',
  'inteligencia',
  'juridico',
  'acessos',
  'dados',
];
const CORRETOR = [
  'inicio',
  'crm-c',
  'flows-c',
  'leads-c',
  'imoveis-c',
  'capt-c',
  'prosp-c',
  'compradores-c',
  'agenda-c',
  'carteira',
  'extrato',
  'poschaves-c',
  'chat-c',
  'treino-c',
  'ideias-c',
  'ia',
];

describe('menu por áreas', () => {
  it('mantém todas as telas, sem repetição', () => {
    expect(
      todasAsTelas('equipe')
        .map((t) => t.id)
        .sort(),
    ).toEqual([...EQUIPE].sort());
    expect(
      todasAsTelas('corretor')
        .map((t) => t.id)
        .sort(),
    ).toEqual([...CORRETOR].sort());
    expect(perfilDaTela('extrato')).toBe('corretor');
  });

  it('usa as áreas combinadas e tira o chat do menu', () => {
    expect(MENU.equipe.map((a) => a.titulo)).toEqual([
      'Hoje',
      'Clientes',
      'Imóveis',
      'Operações',
      'Equipe',
      'Análises',
      'Configurações',
    ]);
    const linhas = MENU.equipe.flatMap(entradasVisiveis);
    expect(linhas.some((e) => e.telas.some((t) => t.id === 'chat'))).toBe(false);
    expect(linhas.length).toBeLessThan(EQUIPE.length);
  });

  it('agrupa telas irmãs numa linha só', () => {
    expect(entradaDaTela('compradores')?.titulo).toBe('Atendimentos');
    expect(entradaDaTela('rodizio')?.titulo).toBe('Corretores');
    expect(entradaDaTela('dados')?.titulo).toBe('Configurações');
    expect(telasParaBusca('equipe').find((t) => t.id === 'guerra')?.nome).toBe('Inteligência · Sala de guerra');
  });
});
