import type { LocacaoRepositories } from '@/application/ports/locacao';
import type {
  ContratoLocacao,
  CorretorResumo,
  DadosContrato,
  ImovelResumo,
  PessoaResumo,
} from '@/domain/locacao/contrato';
import { hojeISO, somaDias, somaMeses } from '@/domain/shared/datas';

/** Dados FICTÍCIOS para desenvolver sem o back-end (VITE_DATA_SOURCE=mock) e para os testes. */
const IMOVEIS: ImovelResumo[] = [
  {
    id: 'im-101',
    codigo: 'EL-0101',
    descricao: 'Apartamento 2 dormitórios',
    bairro: 'Jardim Aquarius',
    cidade: 'São José dos Campos',
  },
  {
    id: 'im-107',
    codigo: 'EL-0107',
    descricao: 'Galpão logístico 1.200 m²',
    bairro: 'Eugênio de Melo',
    cidade: 'São José dos Campos',
  },
  { id: 'im-112', codigo: 'EL-0112', descricao: 'Casa 3 dormitórios', bairro: 'Centro', cidade: 'Pindamonhangaba' },
];
const LOCATARIOS: PessoaResumo[] = [
  { id: 'pe-1', nome: 'Bruna Teles' },
  { id: 'pe-2', nome: 'Componentes Mantiqueira S.A.' },
  { id: 'pe-3', nome: 'Rafael Nogueira' },
];
const CORRETORES: CorretorResumo[] = [
  { id: 'caio', nome: 'Caio Bittencourt' },
  { id: 'helena', nome: 'Helena Sakamoto' },
];

const semDocs = { docContrato: false, docVistoria: false, docGarantia: false, docSeguro: false };

function exemplos(hoje: string): ContratoLocacao[] {
  const inicio1 = somaMeses(hoje, -11);
  const inicio2 = somaMeses(hoje, -52);
  return [
    {
      id: 'ct-1',
      imovelId: 'im-101',
      locatarioId: 'pe-1',
      imovel: IMOVEIS[0]!,
      locatario: LOCATARIOS[0]!,
      corretorOrigemId: 'caio',
      tipo: 'residencial',
      inicio: inicio1,
      fim: somaMeses(inicio1, 30),
      aluguel: 2400,
      taxa: 8,
      venc: 5,
      formaPagamento: 'boleto',
      indice: 'IPCA',
      garantia: 'seguro_fianca',
      seguradora: 'Seguradora Exemplo',
      seguroImovelSeguradora: 'Seguradora Exemplo',
      seguroImovelApolice: 'INC-000123',
      seguroImovelFim: somaDias(hoje, 20),
      antecipada: false,
      venia: 'na',
      cond: 480,
      ...semDocs,
      docContrato: true,
      docVistoria: true,
      docGarantia: true,
      status: 'ativo',
      reajustes: [],
    },
    {
      id: 'ct-2',
      imovelId: 'im-107',
      locatarioId: 'pe-2',
      imovel: IMOVEIS[1]!,
      locatario: LOCATARIOS[1]!,
      corretorOrigemId: 'helena',
      tipo: 'nao_residencial',
      inicio: inicio2,
      fim: somaMeses(inicio2, 60),
      aluguel: 18500,
      taxa: 6,
      venc: 10,
      formaPagamento: 'transferencia',
      indice: 'IGPM',
      garantia: 'caucao_dinheiro',
      caucao: 55500,
      consentimentoCaucaoEm: inicio2,
      seguroImovelSeguradora: 'Seguradora Exemplo',
      seguroImovelFim: somaMeses(hoje, 7),
      antecipada: false,
      venia: 'na',
      ...semDocs,
      docContrato: true,
      docVistoria: true,
      docGarantia: true,
      docSeguro: true,
      status: 'ativo',
      reajustes: [],
    },
  ];
}

export function criarLocacaoMemoria(semente?: { contratos?: ContratoLocacao[]; hoje?: string }): LocacaoRepositories {
  let contratos = structuredClone(semente?.contratos ?? exemplos(semente?.hoje ?? hojeISO()));
  const completar = (id: string, d: DadosContrato, antes?: ContratoLocacao): ContratoLocacao => ({
    ...d,
    id,
    imovel: IMOVEIS.find((i) => i.id === d.imovelId) ?? {
      id: d.imovelId,
      codigo: d.imovelId,
      descricao: 'Imóvel',
      bairro: '',
      cidade: '',
    },
    locatario: LOCATARIOS.find((p) => p.id === d.locatarioId) ?? { id: d.locatarioId, nome: '—' },
    reajustes: antes?.reajustes ?? [],
    ...(antes?.corretorOrigemId ? { corretorOrigemId: antes.corretorOrigemId } : {}),
  });
  const achar = (id: string) => {
    const c = contratos.find((x) => x.id === id);
    if (!c) throw new Error('Contrato não encontrado.');
    return c;
  };
  return {
    contratos: {
      listar: () => Promise.resolve(structuredClone(contratos)),
      criar: (d) => {
        const novo = completar(`ct-${Date.now().toString(36)}`, d);
        contratos = [...contratos, novo];
        return Promise.resolve(structuredClone(novo));
      },
      atualizar: (id, d) => {
        // O imóvel não muda depois do cadastro (campo travado, como no protótipo).
        const novo = completar(id, { ...d, imovelId: achar(id).imovelId }, achar(id));
        contratos = contratos.map((c) => (c.id === id ? novo : c));
        return Promise.resolve(structuredClone(novo));
      },
      reajustar: (id, r) => {
        const c = achar(id);
        const novo: ContratoLocacao = {
          ...c,
          aluguel: r.para,
          reajustes: [...c.reajustes, { ...r, indice: c.indice, de: c.aluguel }],
        };
        contratos = contratos.map((x) => (x.id === id ? novo : x));
        return Promise.resolve(structuredClone(novo));
      },
    },
    cadastros: {
      imoveis: () => Promise.resolve([...IMOVEIS]),
      locatarios: () => Promise.resolve([...LOCATARIOS]),
      corretores: () => Promise.resolve([...CORRETORES]),
    },
  };
}
