import { describe, expect, it } from 'vitest';
import { PADRAO_CONTRATO, type ContratoLocacao, type DadosContrato } from '../contrato';
import { aniversarios, documentosDoContrato, reajustePendente, validarContrato, validarReajuste } from '../regras';
import { agendaLegal } from '../agenda';

const dados = (extra: Partial<DadosContrato> = {}): DadosContrato => ({
  ...PADRAO_CONTRATO,
  imovelId: 'im-1',
  locatarioId: 'pe-1',
  inicio: '2026-01-10',
  fim: '2028-07-09',
  aluguel: 2000,
  docContrato: false,
  docVistoria: false,
  docGarantia: false,
  docSeguro: false,
  ...extra,
});

const contrato = (extra: Partial<ContratoLocacao> = {}): ContratoLocacao => ({
  ...dados(),
  id: 'ct-1',
  imovel: { id: 'im-1', codigo: 'EL-0001', descricao: 'Apartamento', bairro: 'Centro', cidade: 'SJC' },
  locatario: { id: 'pe-1', nome: 'Ana' },
  reajustes: [],
  ...extra,
});

const titulos = (d: DadosContrato, imovelJaAlugado = false) =>
  validarContrato(d, { novo: true, imovelJaAlugado }).map((p) => p.titulo);

describe('validarContrato (Lei 8.245/91)', () => {
  it('aceita um contrato regular', () => {
    expect(titulos(dados())).toEqual([]);
  });

  it('art. 38, § 2º: caução em dinheiro até três aluguéis', () => {
    expect(titulos(dados({ garantia: 'caucao_dinheiro', caucao: 6000 }))).toEqual([]);
    expect(titulos(dados({ garantia: 'caucao_dinheiro', caucao: 6000.01 }))).toEqual(['Caução acima de três aluguéis']);
    expect(titulos(dados({ garantia: 'caucao_dinheiro' }))).toEqual(['Informe o valor da caução']);
  });

  it('arts. 20 e 43, III: aluguel antecipado só sem garantia', () => {
    expect(titulos(dados({ antecipada: true }))).toEqual(['Cobrança antecipada com garantia']);
    expect(titulos(dados({ antecipada: true, garantia: 'nenhuma' }))).toEqual([]);
  });

  it('art. 3º: dez anos ou mais exigem vênia conjugal', () => {
    expect(titulos(dados({ fim: '2036-01-09', venia: 'pendente' }))).toEqual(['Falta a vênia conjugal']);
    expect(titulos(dados({ fim: '2036-01-08', venia: 'pendente' }))).toEqual([]);
  });

  it('prazo inválido e imóvel já alugado', () => {
    expect(titulos(dados({ fim: '2026-01-10' }))).toEqual(['Prazo inválido']);
    expect(titulos(dados(), true)).toEqual(['Imóvel já alugado']);
  });
});

describe('reajuste (Lei 10.192/2001, art. 2º, § 1º)', () => {
  it('não permite reajuste antes de um ano do último marco', () => {
    expect(validarReajuste(contrato(), '2027-01-09', 4.5, 2090).map((p) => p.titulo)).toEqual([
      'Reajuste antes de um ano',
    ]);
    expect(validarReajuste(contrato(), '2027-01-10', 4.5, 2090)).toEqual([]);
  });

  it('aniversário vencido nos últimos 90 dias fica pendente até o reajuste', () => {
    expect(aniversarios('2026-01-10', '2027-02-01')).toEqual({ ant: '2027-01-10', prox: '2028-01-10' });
    expect(reajustePendente(contrato(), '2027-02-01')).toBe('2027-01-10');
    expect(
      reajustePendente(
        contrato({ reajustes: [{ em: '2027-01-10', indice: 'IPCA', pct: 4, de: 2000, para: 2080 }] }),
        '2027-02-01',
      ),
    ).toBeNull();
    expect(reajustePendente(contrato(), '2027-05-01')).toBeNull();
  });
});

describe('documentos e agenda', () => {
  it('sem garantia, o comprovante de garantia não é exigido', () => {
    expect(documentosDoContrato(dados({ garantia: 'nenhuma', docContrato: true })).exigidos).toHaveLength(3);
    expect(documentosDoContrato(dados({ docContrato: true })).arquivados).toBe(1);
  });

  it('avisa o reajuste, o fim do prazo e a janela da renovatória', () => {
    const c = contrato({ tipo: 'nao_residencial', inicio: '2022-06-01', fim: '2027-05-31' });
    expect(agendaLegal([c], '2026-10-15')).toEqual([
      expect.objectContaining({
        titulo: 'Janela da ação renovatória aberta',
        data: '2026-11-30',
        sev: 'atencao',
        lei: 'Lei 8.245/91, art. 51, § 5º',
      }),
    ]);
    const fim = agendaLegal([contrato({ inicio: '2024-02-01', fim: '2026-12-31' })], '2026-10-15');
    expect(fim.map((e) => e.titulo)).toEqual(['Fim do prazo do contrato', 'Reajuste anual']);
    expect(fim[0]?.lei).toBe('Lei 8.245/91, art. 46');
    const r = agendaLegal([contrato({ inicio: '2025-12-01', fim: '2028-05-31' })], '2026-10-15');
    expect(r[0]).toMatchObject({ titulo: 'Reajuste anual', data: '2026-12-01', sev: 'info' });
  });
});
