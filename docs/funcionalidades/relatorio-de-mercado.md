# Relatório de mercado para o cliente (protótipo v54)

Relatório em PDF (A4, 1 ou 2 páginas) que mostra se um valor de aluguel ou de venda está justo. Usa **só dados da Elora**:
contratos de locação (aluguel do início, antes dos reajustes), vendas fechadas e imóveis em oferta hoje. Nada vem de portal.

## Onde aparece
- Ficha do imóvel (equipe), em Divulgação: abre para o **proprietário** ("por quanto anunciar?").
- "Enviar ao cliente" e Raio-X do imóvel no app do corretor: abre para o **cliente** ("o valor está justo?").
  Para o cliente, exige a autorização escrita do proprietário (Lei 6.530/78, art. 20, III), como o brochure.

## Regras de cálculo (`relatorioMercado`)
- Comparável: mesmo uso (residencial, comercial...), mesma cidade, mesma categoria pela descrição (apartamento × casa ×
  galpão × sala × loja × terreno) e área entre metade e o dobro. Ordem: mesmo bairro, área mais parecida, quartos, negócio fechado.
- Um comparável por imóvel (o negócio fechado mais recente; senão a oferta). Até 6; o corretor desmarca os que não servem.
- Faixa: percentis 25 e 75 do valor por m² dos comparáveis × área do imóvel; referência na mediana. Só com 3 ou mais comparáveis com área.
- Tempo até alugar ou vender e desconto na negociação: mediana, só com 2 ou mais negócios.
- Histórico: mediana do m² dos negócios fechados por trimestre, últimos 24 meses, mesmo uso, categoria e cidade; gráfico com 2 ou mais trimestres.
- A Elora AI só sugere o comentário do corretor, com os números já calculados; não cria números.
- O PDF não leva endereço, código nem nomes dos comparáveis. Aviso: não é laudo de avaliação (PTAM).

## Na plataforma
Endpoint `GET /imoveis/{id}/relatorio-mercado?negocio=locacao|venda` com o mesmo cálculo no domínio (função pura,
testável), e o histórico lido de `contrato` e `venda`. O preço fechado de cada contrato alimenta a base automaticamente.
