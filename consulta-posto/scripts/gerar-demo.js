// Gera data/demo/base-demo.json com dados FICTÍCIOS para demonstrar a interface.
// Nada aqui é dado da ANP: nomes, endereços, CNPJs e fiscalizações são inventados e rotulados como DEMO.
// Os CNPJs são gerados com dígitos verificadores propositalmente INVÁLIDOS para não coincidir com empresas reais.
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cnpjValido } from '../server/dominio/texto.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_GERACAO = '2026-11-13';

let semente = 20261113;
const aleatorio = () => {
  semente = (semente * 1103515245 + 12345) % 2147483648;
  return semente / 2147483648;
};
const escolher = (lista) => lista[Math.floor(aleatorio() * lista.length)];

// Coordenadas aproximadas do centro de cada município (os pontos são deslocados aleatoriamente).
const MUNICIPIOS = [
  { municipio: 'São Paulo', uf: 'SP', lat: -23.5505, lon: -46.6333 },
  { municipio: 'Campinas', uf: 'SP', lat: -22.9056, lon: -47.0608 },
  { municipio: 'Rio de Janeiro', uf: 'RJ', lat: -22.9068, lon: -43.1729 },
  { municipio: 'Belo Horizonte', uf: 'MG', lat: -19.9167, lon: -43.9345 },
  { municipio: 'Curitiba', uf: 'PR', lat: -25.4284, lon: -49.2733 },
  { municipio: 'Recife', uf: 'PE', lat: -8.0476, lon: -34.877 },
  { municipio: 'Goiânia', uf: 'GO', lat: -16.6869, lon: -49.2648 },
  { municipio: 'Porto Alegre', uf: 'RS', lat: -30.0346, lon: -51.2177 },
];
const LOGRADOUROS = ['Avenida Exemplo', 'Rua Fictícia', 'Rodovia Demonstração', 'Avenida Modelo', 'Rua do Teste'];
const BAIRROS = ['Centro', 'Bairro Exemplo', 'Jardim Demonstração', 'Vila Fictícia'];
const BANDEIRAS = ['Bandeira Fictícia A', 'Bandeira Fictícia B', 'Bandeira Branca (DEMO)'];
const COMBUSTIVEIS = ['Gasolina comum', 'Gasolina aditivada', 'Etanol hidratado', 'Diesel S10', 'Diesel S500', 'GNV'];
const SITUACOES = ['Autorizado (DEMO)', 'Autorizado (DEMO)', 'Autorizado (DEMO)', 'Revogado (DEMO)'];
const TIPOS_FISC = ['Fiscalização de rotina (DEMO)', 'Coleta de amostra para análise de qualidade (DEMO)', 'Apuração de denúncia (DEMO)'];
const OCORRENCIAS = [
  { categoria: 'Qualidade do combustível', descricao: 'Exemplo fictício: amostra com parâmetro fora da especificação em ensaio de laboratório.' },
  { categoria: 'Qualidade do combustível', descricao: 'Exemplo fictício: teor de etanol na gasolina diferente do especificado.' },
  { categoria: 'Informação ao consumidor', descricao: 'Exemplo fictício: painel de preços sem as informações obrigatórias.' },
  { categoria: 'Volume (bomba medidora)', descricao: 'Exemplo fictício: diferença de volume acima da tolerância em uma bomba.' },
  { categoria: 'Documentação', descricao: 'Exemplo fictício: documento fiscal de aquisição não apresentado no momento da ação.' },
];

function cnpjFicticio() {
  for (;;) {
    let d = '99';
    for (let i = 0; i < 12; i++) d += Math.floor(aleatorio() * 10);
    if (!cnpjValido(d)) return d;
  }
}

function dataAleatoria(anoMin, anoMax) {
  const ano = anoMin + Math.floor(aleatorio() * (anoMax - anoMin + 1));
  const mes = 1 + Math.floor(aleatorio() * 12);
  const dia = 1 + Math.floor(aleatorio() * 28);
  const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
  return iso > DATA_GERACAO ? DATA_GERACAO : iso;
}

const postos = [];
const fiscalizacoes = [];
let n = 0;
for (const m of MUNICIPIOS) {
  const qtd = 4 + Math.floor(aleatorio() * 3);
  for (let i = 0; i < qtd; i++) {
    n++;
    const id = `demo-${String(n).padStart(3, '0')}`;
    const semCoordenadas = n % 9 === 0; // alguns sem coordenadas, para exercitar a lista sem mapa
    const combustiveis = COMBUSTIVEIS.filter(() => aleatorio() > 0.4);
    postos.push({
      id,
      cnpj: cnpjFicticio(),
      razaoSocial: `Empresa Fictícia ${n} Ltda (DEMO)`,
      nomeFantasia: `Posto Demonstração ${String(n).padStart(2, '0')}`,
      endereco: {
        logradouro: escolher(LOGRADOUROS),
        numero: String(10 + Math.floor(aleatorio() * 3000)),
        complemento: null,
        bairro: escolher(BAIRROS),
        cep: null,
        municipio: m.municipio,
        uf: m.uf,
      },
      coordenadas: semCoordenadas
        ? null
        : {
            lat: Math.round((m.lat + (aleatorio() - 0.5) * 0.12) * 1e5) / 1e5,
            lon: Math.round((m.lon + (aleatorio() - 0.5) * 0.12) * 1e5) / 1e5,
          },
      bandeira: escolher(BANDEIRAS),
      situacaoCadastral: escolher(SITUACOES),
      combustiveis: combustiveis.length ? combustiveis : ['Gasolina comum'],
      autorizacao: { numero: `DEMO-${100000 + n}`, data: dataAleatoria(2005, 2020) },
    });

    const qtdFisc = Math.floor(aleatorio() * 4); // 0 a 3 — alguns postos ficam sem registros
    for (let k = 0; k < qtdFisc; k++) {
      const comIrregularidade = aleatorio() < 0.35;
      const ocorrencias = comIrregularidade
        ? Array.from({ length: 1 + Math.floor(aleatorio() * 2) }, () => escolher(OCORRENCIAS))
        : [];
      fiscalizacoes.push({
        id: `${id}-f${k + 1}`,
        postoId: id,
        data: dataAleatoria(2019, 2026),
        tipo: escolher(TIPOS_FISC),
        resultado: comIrregularidade ? 'Auto de infração lavrado (DEMO)' : 'Sem irregularidade constatada (DEMO)',
        ocorrencias,
        documento: comIrregularidade ? `DEMO-AI-${1000 + fiscalizacoes.length}` : null,
      });
    }
  }
}

const fonteDemo = {
  nome: 'Dados de demonstração gerados pelo projeto Consulta Posto — DEMO, não são dados reais',
  url: 'https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos',
  licenca: 'Dados fictícios criados para teste da interface. Não representam postos, empresas ou fiscalizações reais.',
  obtidoEm: DATA_GERACAO,
  atualizadoEm: DATA_GERACAO,
  observacao: 'O link aponta para o portal de dados abertos da ANP, onde estão as bases oficiais a importar.',
};

const base = {
  meta: {
    tipo: 'demo',
    nome: 'Base de demonstração',
    aviso: 'DEMO — não são dados reais. Postos, CNPJs, endereços e fiscalizações são fictícios.',
    camposConfiaveis: { combustiveis: true, situacaoCadastral: true, fiscalizacoes: true },
    fontes: { cadastro: fonteDemo, fiscalizacoes: fonteDemo },
    geradoEm: DATA_GERACAO,
  },
  postos,
  fiscalizacoes,
};

const destino = join(raiz, 'data/demo/base-demo.json');
await mkdir(dirname(destino), { recursive: true });
await writeFile(destino, `${JSON.stringify(base, null, 1)}\n`);
console.log(`Base DEMO gerada: ${postos.length} postos, ${fiscalizacoes.length} fiscalizações -> ${destino}`);
