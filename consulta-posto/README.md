# Consulta Posto (MVP)

App web responsivo, em português, para consultar **informações públicas sobre postos de combustíveis**
(cadastro e histórico de fiscalizações), sempre com **fonte e data** visíveis.

> **Projeto independente.** Não é um serviço da ANP. **A base que vem com o projeto é DEMO: os dados não são reais.**

## Rodar

Precisa só de **Node.js 22+**. Não há dependências para instalar.

```bash
cd consulta-posto
npm start            # http://127.0.0.1:3000 (base DEMO)
npm test             # 33 testes: domínio, importador, relatos e API
```

| Variável | Padrão | Para quê |
|---|---|---|
| `PORT` / `HOST` | `3000` / `127.0.0.1` | Endereço do servidor |
| `FONTE_DADOS` | `demo` | `demo` ou `importada` (lê `data/importado/base.json`) |
| `CAMINHO_BASE` | — | Caminho de outra base normalizada |
| `DIR_PRIVADO` | `data/privado` | Onde ficam relatos e anexos (fora do git) |
| `MODERACAO_TOKEN` | — | Liga as rotas de moderação (mín. 24 caracteres) |
| `CONFIAR_PROXY` | — | `1` para usar `X-Forwarded-For` no limite de envios |

### Versão de demonstração sem servidor

`npm run pagina-estatica` gera `dist/consulta-posto.html`: o app inteiro num único arquivo, com a base DEMO
embutida e as mesmas regras de busca rodando no navegador. Serve para publicar uma demonstração. Nela o envio de
relatos é **simulado** (nada é gravado) e o fundo do mapa pode não aparecer, conforme o local onde for aberta.

## Telas

| Rota | O que tem |
|---|---|
| `/` | Busca por cidade, nome ou CNPJ. Os filtros (UF, combustível, situação, período) só aparecem quando a base declara esses dados como confiáveis. Texto curto sobre origem e limites. |
| `/resultados` | Lista e mapa (Leaflet servido localmente). Ordenar por distância só depois de a pessoa autorizar a localização. Todos os pontos do mapa têm a **mesma cor** (sem nota de “bom/ruim”). Se o mapa falha, a lista continua funcionando. |
| `/posto/:id` | Dados cadastrais e histórico de fiscalizações, cada bloco com a própria linha de fonte, licença e data. Aviso sobre infrações, estado “nenhum registro encontrado” sem afirmar ausência de problemas, botão **Consultar na fonte oficial**, e a seção **Relatos de usuários — não verificados**, separada dos registros oficiais. |
| `/relatar` | Formulário: posto, data aproximada, tipo, descrição, imagens (opcional) e e-mail (opcional, anônimo por padrão), com consentimentos separados e orientação para a denúncia oficial. |
| `/remover` | Autor apaga o relato com protocolo + código; terceiros pedem a remoção para a moderação. |
| `/sobre`, `/privacidade`, `/termos` | Origem dos dados, LGPD/retenção e termos de uso. |

## API

| Método e rota | Descrição |
|---|---|
| `GET /api/status` | Fonte em uso (tipo `demo`/`oficial`, licença, datas), filtros disponíveis, links oficiais, regras de relatos |
| `GET /api/postos?q=&uf=&combustivel=&situacao=&desde=&ate=&lat=&lon=&ordenar=&pagina=&porPagina=` | Busca. `ordenar=distancia` só com `lat`/`lon` |
| `GET /api/postos/:id` | Cadastro + fiscalizações + fonte |
| `GET /api/postos/:id/relatos` | Relatos **publicados** (sem e-mail, sem anexos, dados pessoais ocultados, `verificado: false`) |
| `POST /api/relatos` | Cria um relato (fica `em_moderacao`); devolve protocolo e código de remoção |
| `POST /api/relatos/remocao` | Autor apaga o relato (`protocolo`, `codigo`) |
| `POST /api/solicitacoes-remocao` | Pedido de remoção feito por terceiros |
| `GET /api/moderacao/pendentes` · `POST /api/moderacao/relatos/:id` (`publicar`/`rejeitar`/`remover`) · `GET /api/moderacao/relatos/:id/anexos/:nome` · `POST /api/moderacao/solicitacoes/:protocolo/fechar` | Moderação, com `Authorization: Bearer $MODERACAO_TOKEN` |

Se a base não carrega, a API responde **503** com o link da consulta oficial, e a interface mostra esse aviso.

## Estrutura

```
server/
  dominio/     regras puras: normalização, CNPJ, distância, busca e filtros
  fontes/      FonteArquivo + validação da base (exige origem, licença e data de obtenção)
  importador/  CSV/JSON oficiais -> base normalizada (mapeamento de colunas configurável)
  relatos/     validação, saneamento, remoção de EXIF, armazenamento, moderação e retenção
  api/ app.js  HTTP sem framework, CSP e cabeçalhos de segurança
public/        interface (JS puro, sem innerHTML com dados) + Leaflet 1.9.4 (BSD-2)
scripts/       gerar-demo.js (base fictícia determinística)
```

**Trocar a fonte de dados:** qualquer objeto com `info()`, `buscar()`, `obterPosto()` e `postoExiste()`
serve (ver o contrato em `server/fontes/fonteArquivo.js`). Uma integração com uma API oficial, se um dia
existir, entra como outra classe com o mesmo contrato, sem mexer na interface.

## Dados oficiais: situação e próximos passos

Antes de apresentar qualquer dado como real, é preciso confirmar **origem, licença e data**. Status em 13/11/2026:

| Item | Situação |
|---|---|
| API pública documentada da ANP para consulta por posto | **Não encontrada.** Não há integração ao vivo, scraping nem chamadas simuladas. |
| Ferramenta oficial **ANP com VC – Postos** (lançada em 13/07/2026, com nota de 0 a 5 e mapa colorido) | Usada só como link (“Consultar na fonte oficial”). O app **não** reproduz a nota nem as cores: as regras são da ANP e não estão numa base aberta conferida. |
| Conjunto **Ações de Fiscalização** (portal de dados abertos da ANP; metadados citam o sistema SIGAF e atualização mensal) | Candidato para o histórico. **Colunas, formato (CSV x XLSX, os metadados divergem) e licença não confirmados**: o domínio gov.br estava bloqueado no ambiente de desenvolvimento. |
| Cadastro de revendedores varejistas (endereço, CNPJ, coordenadas) | Candidato para o cadastro. **Conjunto e colunas não confirmados.** |

### Como importar quando os arquivos estiverem conferidos

1. Baixe os arquivos e os **metadados** no [portal de dados abertos da ANP](https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos).
2. Copie `server/importador/mapeamento.exemplo.json` e troque os nomes **candidatos** pelos nomes exatos das colunas.
3. Rode (a importação é recusada sem URL https, licença e data de obtenção):

```bash
npm run importar -- \
  --cadastro cadastro.csv --fiscalizacoes acoes.csv --mapeamento meu-mapeamento.json --encoding latin1 \
  --fonte-cadastro-nome "ANP — <nome do conjunto>" --fonte-cadastro-url "https://..." \
  --fonte-cadastro-licenca "<licença do portal>" --fonte-cadastro-obtido-em 2026-11-13 \
  --fonte-fisc-nome "ANP — Ações de Fiscalização" --fonte-fisc-url "https://..." \
  --fonte-fisc-licenca "<licença>" --fonte-fisc-obtido-em 2026-11-13
FONTE_DADOS=importada npm start
```

O importador liga fiscalizações ao posto pelo CNPJ, agrupa várias infrações da mesma ação e informa as
linhas ignoradas. Os filtros de combustível e situação só aparecem se as colunas existirem e vierem preenchidas.

## Privacidade e moderação (resumo)

- Relato pode ser anônimo; o e-mail é opcional, exige consentimento e nunca é publicado.
- Imagens: só JPEG/PNG (conferidos pelos bytes), até 3 × 2 MB, **metadados EXIF/textos removidos**, nunca publicadas.
- E-mails, CPFs, telefones e placas na descrição são ocultados na exibição pública.
- Retenção: em moderação 90 dias · rejeitado 30 · publicado 24 meses · imagens e e-mail apagados na decisão (ou 90 dias).
- O IP só é usado em memória para limitar envios (5 a cada 10 min).
- Armazenamento em arquivo JSON local: adequado ao MVP. Em produção, use um banco de dados com backup e criptografia.

**Antes de lançar ao público:** revisar política e termos com assessoria jurídica (LGPD), definir o
responsável (controlador) e um canal de contato, e criar a tela de moderação (hoje só pela API).
