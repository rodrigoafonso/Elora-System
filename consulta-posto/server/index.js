import { lerConfig } from './config.js';
import { criarApp } from './app.js';
import { FonteArquivo } from './fontes/fonteArquivo.js';
import { RepositorioRelatos } from './relatos/repositorio.js';

const config = lerConfig();
const fonte = await new FonteArquivo(config.caminhoBase).carregar();
const relatos = await new RepositorioRelatos(config.dirPrivado).iniciar();

const info = fonte.info();
if (info.disponivel) {
  console.log(`Fonte: ${info.meta.nome} (${info.meta.tipo}) — ${info.totalPostos} postos.`);
  if (info.meta.tipo === 'demo') console.log('Atenção: base DEMO — não são dados reais.');
} else {
  console.warn(`Fonte indisponível: ${info.erro} A interface mostrará o aviso e o link para a consulta oficial.`);
}
if (!config.tokenModeracao) console.log('Moderação desligada (defina MODERACAO_TOKEN com 24+ caracteres para ligar).');

// Retenção: aplica ao iniciar e a cada 24 h.
setInterval(() => relatos.aplicarRetencao().catch(console.error), 24 * 60 * 60 * 1000).unref();

criarApp({ fonte, relatos, config }).listen(config.porta, config.host, () => {
  console.log(`Raio-X do Posto em http://${config.host}:${config.porta}`);
});
