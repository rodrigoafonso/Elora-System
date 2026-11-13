#!/usr/bin/env bash
# Baixa os arquivos oficiais da ANP e gera data/importado/base.json.
# Fontes e licenças conferidas em 13/11/2026 (ver README). Rode de novo para atualizar.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

PAG_CAD="https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/dados-cadastrais-dos-revendedores-varejistas-de-combustiveis-automotivos"
PAG_FISC="https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/acoes-de-fiscalizacao"
URL_CAD="https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/arquivos/arquivos-dados-cadastrais-dos-revendedores-varejistas-de-combustiveis-automotivos/dados-cadastrais-revendedores-varejistas-combustiveis-automoveis.csv"
URL_FISC="https://www.gov.br/anp/pt-br/centrais-de-conteudo/paineis-dinamicos-da-anp/arquivos-dados-brutos-do-painel-dinamico-da-fiscalizacao-do-abastecimento-da-sfi/dados-fisc-a-partir-2019.xlsx"

baixar() { curl -fsSL --retry 4 --retry-all-errors --retry-delay 3 -m 600 -o "$2" "$1"; }
echo "Baixando cadastro…";      baixar "$URL_CAD" "$TMP/cadastro.csv"
echo "Baixando fiscalizações…"; baixar "$URL_FISC" "$TMP/fiscalizacoes.xlsx"

# Datas de atualização informadas nas páginas oficiais ("atualizado em DD/MM/AAAA").
data_pagina() {
  curl -fsSL --retry 4 --retry-all-errors --retry-delay 3 -m 60 "$1" | sed -e 's/<[^>]*>//g' | tr -s ' \n\t' ' ' \
    | grep -oE "$2 ?[0-9]{1,2}/[0-9]{1,2}/ ?[0-9]{4}" | head -1 \
    | grep -oE '[0-9]{1,2}/[0-9]{1,2}/ ?[0-9]{4}' | tr -d ' ' | awk -F/ '{printf "%04d-%02d-%02d", $3, $2, $1}'
}
ATU_CAD="$(data_pagina "$PAG_CAD" 'csv\)[^0-9]{0,8}atualizado em' || true)"
ATU_FISC="$(data_pagina "$PAG_FISC" '\(atualizado em' || true)"
HOJE="$(date -u +%F)"

node server/importador/cli.js \
  --cadastro "$TMP/cadastro.csv" --fiscalizacoes "$TMP/fiscalizacoes.xlsx" \
  --mapeamento server/importador/mapeamento.anp.json \
  --nome "Dados abertos da ANP (cadastro de revendedores e ações de fiscalização)" \
  --fonte-cadastro-nome "ANP — Dados Cadastrais dos Revendedores Varejistas de Combustíveis Automotivos" \
  --fonte-cadastro-url "$PAG_CAD" \
  --fonte-cadastro-licenca "Dados abertos da ANP; licença não especificada nos metadados do conjunto — uso com citação da fonte" \
  --fonte-cadastro-obtido-em "$HOJE" ${ATU_CAD:+--fonte-cadastro-atualizado-em "$ATU_CAD"} \
  --fonte-cadastro-observacao "Lista os revendedores em operação. A ANP atualiza o arquivo diariamente." \
  --fonte-fisc-nome "ANP — Ações de Fiscalização do Abastecimento (SIGAF), segmento Revenda de Combustíveis" \
  --fonte-fisc-url "$PAG_FISC" \
  --fonte-fisc-licenca "Licença aberta indicada nos metadados (Creative Commons Atribuição, CC0, ODbL ou PDDL)" \
  --fonte-fisc-obtido-em "$HOJE" ${ATU_FISC:+--fonte-fisc-atualizado-em "$ATU_FISC"} \
  --fonte-fisc-observacao "Segundo a ANP, os agentes autuados têm direito ao contraditório e à ampla defesa; somente após o julgamento definitivo do processo administrativo fica comprovado se o estabelecimento cometeu ou não as infrações indicadas. Os dados são publicados com cerca de dois meses de defasagem." \
  --saida data/importado/base.json
