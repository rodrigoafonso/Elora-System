// Gera dist/consulta-posto.html: o app inteiro num único arquivo, sem servidor, com a base DEMO embutida.
// Serve para publicar uma demonstração navegável. A versão completa (com relatos de verdade) precisa do servidor.
//
// Mini-empacotador: cada módulo vira uma função isolada; `import { a, b as c } from './x.js'` vira
// `const { a, b: c } = __m['x']`, e os nomes exportados são devolvidos pela função.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { filtrosDisponiveis } from '../server/dominio/busca.js';
import { LINKS_OFICIAIS } from '../server/config.js';
import { RETENCAO } from '../server/relatos/repositorio.js';
import { LIMITES, TIPOS_PROBLEMA } from '../server/relatos/validacao.js';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEAFLET_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';

const ENTRADAS = ['estatico/apiLocal.js', 'public/js/app.js'];
const modulos = new Map(); // caminho relativo -> { codigo, deps }

const RE_IMPORT = /import\s*\{([\s\S]*?)\}\s*from\s*'([^']+)';/g;

async function carregar(rel) {
  if (modulos.has(rel)) return;
  modulos.set(rel, null);
  let codigo = await readFile(join(raiz, rel), 'utf8');
  const deps = [];
  codigo = codigo.replace(RE_IMPORT, (_t, nomes, de) => {
    const alvo = relative(raiz, resolve(join(raiz, dirname(rel)), de));
    deps.push(alvo);
    const lista = nomes.split(',').map((n) => n.trim()).filter(Boolean).map((n) => n.replace(/\s+as\s+/, ': ')).join(', ');
    return `const { ${lista} } = __m[${JSON.stringify(alvo)}];`;
  });
  if (/^\s*import\s/m.test(codigo)) throw new Error(`${rel}: import não suportado pelo empacotador`);
  const exportados = [];
  codigo = codigo.replace(/^export\s+(async\s+function|function|const|let|class)\s+([\w$]+)/gm, (_t, tipo, nome) => {
    exportados.push(nome);
    return `${tipo} ${nome}`;
  });
  if (/^export\s/m.test(codigo)) throw new Error(`${rel}: export não suportado pelo empacotador`);
  for (const d of deps) await carregar(d);
  modulos.set(rel, { codigo, deps, exportados });
}

for (const e of ENTRADAS) await carregar(e);

// Ordem topológica (dependências primeiro)
const ordem = [];
const visitados = new Set();
const visitar = (rel) => {
  if (visitados.has(rel)) return;
  visitados.add(rel);
  modulos.get(rel).deps.forEach(visitar);
  ordem.push(rel);
};
ENTRADAS.forEach(visitar);

// --base data/importado/base.json gera a versão com dados oficiais em dist/real/ (página + arquivos de dados).
const { values: args } = parseArgs({ options: { base: { type: 'string', default: 'data/demo/base-demo.json' } } });
const base = JSON.parse(await readFile(resolve(raiz, args.base), 'utf8'));
const oficial = base.meta.tipo === 'oficial';
const dirSaida = join(raiz, oficial ? 'dist/real' : 'dist');
const status = {
  disponivel: true,
  erro: null,
  fonte: { tipo: base.meta.tipo, nome: base.meta.nome, aviso: base.meta.aviso, fontes: base.meta.fontes, totalPostos: base.postos.length },
  // Na versão estática o histórico é carregado só no detalhe, então o filtro por período fica de fora.
  filtros: oficial ? { ...filtrosDisponiveis(base), periodoFiscalizacao: null } : filtrosDisponiveis(base),
  ufs: 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '),
  linksOficiais: LINKS_OFICIAIS,
  relatos: { tiposProblema: TIPOS_PROBLEMA, limites: LIMITES, retencaoDias: RETENCAO },
};

const json = (v) => JSON.stringify(v).replace(/</g, '\\u003c');
const corpoModulos = ordem
  .map((rel) => {
    const { codigo, exportados } = modulos.get(rel);
    if (rel === 'public/js/app.js') return `// ${rel}\n(() => {\n${codigo}\n})();`;
    return `// ${rel}\n__m[${JSON.stringify(rel)}] = (() => {\n${codigo}\nreturn { ${exportados.join(', ')} };\n})();`;
  });
// apiLocal precisa ser instalada antes de app.js rodar
const idxApp = corpoModulos.findIndex((c) => c.startsWith('// public/js/app.js'));
const arquivosDados = new Map(); // caminho publicado -> conteúdo
if (oficial) {
  const CAMPOS = ['cnpj', 'razaoSocial', 'logradouro', 'complemento', 'bairro', 'cep', 'municipio', 'uf', 'bandeira', 'bandeiraDesde', 'autorizacaoNumero', 'autorizacaoData', 'totalFisc', 'ultimaFisc'];
  const fiscPorPosto = new Map();
  for (const f of base.fiscalizacoes) {
    if (!fiscPorPosto.has(f.postoId)) fiscPorPosto.set(f.postoId, []);
    fiscPorPosto.get(f.postoId).push(f);
  }
  const porUf = new Map();
  const linhas = base.postos.map((p) => {
    const fisc = (fiscPorPosto.get(p.id) ?? []).sort((a, b) => String(b.data).localeCompare(String(a.data)));
    if (fisc.length) {
      const uf = p.endereco.uf;
      if (!porUf.has(uf)) porUf.set(uf, {});
      porUf.get(uf)[p.cnpj] = fisc.map((f) => [f.data, f.tipo, f.resultado, f.documento, f.ocorrencias.length ? f.ocorrencias.map((o) => o.descricao) : undefined]);
    }
    const e = p.endereco;
    return [p.cnpj, p.razaoSocial, e.logradouro, e.complemento, e.bairro, e.cep, e.municipio, e.uf, p.bandeira, p.bandeiraDesde, p.autorizacao?.numero, p.autorizacao?.data, fisc.length, fisc[0]?.data ?? null];
  });
  arquivosDados.set('dados/postos.json', JSON.stringify({ meta: base.meta, campos: CAMPOS, postos: linhas }));
  for (const [uf, dados] of porUf) arquivosDados.set(`dados/fisc-${uf}.json`, JSON.stringify(dados));
  corpoModulos.splice(idxApp, 0, `__m["estatico/apiLocal.js"].instalarApiLocal({ status: ${json(status)}, dados: { postos: 'dados/postos.json', fiscalizacoes: 'dados/fisc-{uf}.json' } });`);
} else {
  corpoModulos.splice(idxApp, 0, `__m["estatico/apiLocal.js"].instalarApiLocal({ base: ${json(base)}, status: ${json(status)} });`);
}

const script = `window.__CONSULTA_POSTO_ESTATICO__ = true;\nwindow.__LEAFLET_URL__ = ${JSON.stringify(LEAFLET_CDN)};\nconst __m = {};\n${corpoModulos.join('\n\n')}`;

const icone = await readFile(join(raiz, 'public/img/icone.svg'), 'utf8');
const iconeDataUri = `data:image/svg+xml;base64,${Buffer.from(icone).toString('base64')}`;
const css = (await readFile(join(raiz, 'public/css/app.css'), 'utf8')).replace("url('/img/icone.svg')", `url('${iconeDataUri}')`);
const leafletCss = await readFile(join(raiz, 'public/vendor/leaflet/leaflet.css'), 'utf8');
const html = await readFile(join(raiz, 'public/index.html'), 'utf8');
const corpoHtml = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  .replace('<a class="pular" href="#conteudo">', '<a class="pular" href="#conteudo">');

const pagina = `<title>Consulta Posto</title>
<meta name="description" content="Consulta Posto: projeto independente para consultar informações públicas sobre postos de combustíveis no Brasil. Versão de demonstração." />
<style>
/* Leaflet 1.9.4 — BSD-2-Clause, (c) Volodymyr Agafonkin */
${leafletCss}
</style>
<style>
${css}
</style>
${corpoHtml.trim()}
<script>
${script.replace(/<\/script/gi, '<\\/script')}
</script>
`;

const destino = join(dirSaida, 'consulta-posto.html');
await mkdir(join(dirSaida, 'dados'), { recursive: true });
await writeFile(destino, pagina);
let totalDados = 0;
for (const [caminho, conteudo] of arquivosDados) {
  await writeFile(join(dirSaida, caminho), conteudo);
  totalDados += conteudo.length;
}
console.log(`Página estática gerada (${(pagina.length / 1024).toFixed(0)} KB, ${ordem.length} módulos) -> ${destino}`);
if (arquivosDados.size) console.log(`${arquivosDados.size} arquivos de dados (${(totalDados / 1e6).toFixed(1)} MB) em ${join(dirSaida, 'dados')}`);
