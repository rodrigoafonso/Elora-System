# Financeiro em escala: teste com 200 aluguéis (protótipo v56 → v57)

Massa fictícia gerada por `gerar-carteira-200-alugueis.py`: 200 locações ativas (175 residenciais, 25 comerciais),
12 encerradas no ano, 20 vagas, 100 casas à venda e 12 vendidas, 15 corretores, 394 pessoas, 150 leads,
12 meses de pagamentos com atrasos e inadimplência, despesas fixas hipotéticas de R$ 99.500/mês.

## Conferência dos números (out/2026), sistema × conta independente
Emitido R$ 865.260,00 · recebido R$ 763.700,00 · taxa de administração R$ 72.143,40 · em atraso R$ 101.560,00.
Iguais ao centavo antes e depois das mudanças de desempenho.

## Desempenho
| Medida | v56 | v57 |
|---|---|---|
| Primeira abertura | 5–10 s | 1,3 s |
| Abertura seguinte | 2,5 s | 0,6 s |
| Dashboard (cada clique) | 1,1 s | 0,03 s |
| Atendimentos | 2,4 s | 0,3 s |
| Fluxo de caixa | 1,0 s | 0,04 s |

Causas e correções:
- `lista()` ordenava a coleção inteira a cada chamada → cache pela identidade do objeto da coleção
  (toda gravação troca o objeto, então o cache não envelhece) e cópia rasa no retorno.
- `contratoAtivoDo` e `disponivelDesde` varriam todos os contratos para cada imóvel → índices por imóvel.
- `alertas()` recalculava tudo a cada tela → memorizado pelos mesmos dados, data e perfil (até 15 s).
- Monitoramento criava 142 tickets gravando a base inteira 142 vezes → `store.salvarVarios` (uma gravação local;
  na nuvem, 8 escritas em paralelo).

## Teto de registros
A assinatura do banco usava `.limit(1000)` por coleção: acima de 1.000 pessoas ou leads, o excedente sumia sem aviso.
Removido. Aviso de capacidade aos gestores quando uma coleção passa de 1.600 registros ou o banco passa de 20.000
(o banco da página guarda no máximo 25.000 documentos e recomenda coleções de centenas a poucos milhares).

## Repasse em lote com aprovação de duas pessoas
Financeiro → Cobrança e repasses → "Repasse em lote". Quem prepara escolhe os proprietários (gastos e créditos
continuam no repasse individual). Outra pessoa aprova e registra a data do pagamento no banco; a mesma conta (id da
capacidade `user`) ou o mesmo nome não aprova. Na aprovação, só entram os itens que ainda conferem; o que mudou fica
fora e volta ao repasse individual. Planilha CSV do lote para conferência. Coleção `lotes`, gravação só para gestores
(regra do banco). Teste: 110 repasses aprovados em 0,9 s.

## Ainda falta (plataforma)
Boleto/Pix registrado com baixa automática, conciliação bancária, conta de terceiros separada, multa e juros por
atraso, inadimplência por idade e provisão, DRE e impostos, IRRF e CPF/CNPJ para a DIMOB, fechamento do mês.
