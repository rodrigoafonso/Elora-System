# Motor de demanda (versão 71)

## Parcerias de relocação (Marketing > Parcerias de relocação)
- Tarefa agendada "Agente de relocação Elora (empresas)", todo dia às 6h31 (São Paulo): procura empresas contratando,
  expandindo, abrindo unidade ou transferindo equipes no Vale e grava em `empresas` (nome, setor, cidade, evento,
  resumo, vagas, fonte https, site). Só empresas e canais institucionais; nenhum dado de pessoa física.
- A tela tem a proposta de parceria pronta, as etapas (nova, contatada, reunião, parceira, descartada) e, ao virar
  parceira, cria a fonte de captação "Relocação · Empresa" para os leads dela entrarem com o canal da parceria.

## Páginas de bairro (Marketing > Páginas de bairro)
- Bairros com oferta e procura (carteira e leads). "Gerar página" baixa um HTML próprio para anúncio: números do bairro,
  até 6 imóveis da carteira, simulador "quanto posso pagar" (aluguel até 1/3 da renda; financiamento com parcela de
  30% da renda, 30 anos, 11% a.a.) e formulário com consentimento LGPD e campo-isca contra robôs.
- O formulário envia para `POST {siteUrl}/api/v1/captacao/receber/{código}` (a mensagem leva interesse, prazo e renda).
  Sem código ou com falha, abre o WhatsApp da Elora com o texto pronto.

## Formulário do Meta (Fontes de captação > Formulário do Meta)
- Modelo com 10 perguntas que já qualificam (alugar ou comprar, bairro, tipo, quartos, orçamento, renda, prazo).
- O CSV baixado da Central de leads do Meta é colado em "Receber leads" da fonte "Meta Lead Ads": o sistema reconhece as
  colunas pelo texto da pergunta e cria o lead com `qualif.renda`, `qualif.muda`, `quartosMin`, `valorMax`, `regiao` e
  tipo. O lead chega pronto para o corretor e o casamenteiro já prepara as opções.

Testes: `docs/testes/demanda.cjs` (18 verificações, inclusive a página carregada no navegador e o envio para a
plataforma simulada).
