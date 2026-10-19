# Cadastrar imóvel com IA

Status: **protótipo v52 pronto** (Imóveis da equipe, "Minhas captações" do corretor e App Elora do corretor: Início e Mais). Versão de produção: este documento.

## O que faz

O corretor cola anotações ou uma conversa e anexa prints, fotos e PDFs. A IA organiza um **rascunho** em que cada campo traz
a fonte, o trecho que o prova e a confiança. O corretor confere, ajusta a ordem das fotos, vê se já existe imóvel parecido e salva
como **Rascunho, revisão pendente**. Nada é publicado, enviado ou contado como origem de captação.

## Fluxo

1. **Informações**: anotações + arquivos (JPG, PNG, WebP, PDF; até 15 MB cada). Cada imagem é marcada como *Foto do imóvel*
   (vai para o cadastro, não é lida) ou *Print para ler*. Arrastar e Ctrl+V funcionam no computador.
2. **Leitura**: status por arquivo (pronto, lendo, lido, lido como imagem, não foi lido + motivo). PDF com texto é lido como texto;
   PDF digitalizado vira imagem (até 3 páginas). HEIC, DOCX, PDF com senha ou danificado = "não foi lido", com o motivo.
3. **Revisão em blocos**: Localização, Valores, Características, Descrição, Fotos, Conferir e salvar. Estados de campo:
   *Encontrado* (verde), *Conferir* (dourado, exige "Está certo", edição ou "Deixar em branco"), *Não encontrado* (tracejado),
   *Editado por você*. Cada campo mostra a fonte e o trecho.
4. **Conferir e salvar**: pendências clicáveis, rascunho incompleto (aviso, salva mesmo assim), possível duplicidade
   (exige marcar "é outro imóvel"), vínculo com proprietário existente, prévia do card e do anúncio.
5. **Salvo**: rascunho em Imóveis. **Concluir** abre o cadastro normal preenchido (equipe) ou o registro de captação (corretor);
   ao salvar, as fotos vão para o imóvel e o rascunho vira "convertido". Nenhum segundo imóvel é criado.

## Regras de IA

- A IA só **extrai**: valor fora da fonte = `null`. Ambíguo ou conflitante = confiança baixa + "dúvida".
- Verificação no código, não na palavra da IA: o trecho citado precisa existir no texto da fonte; se não existir, o campo cai para
  confiança baixa ("trecho não encontrado"). Fonte inexistente = baixa. Imagem não dá para verificar = aviso "lido de imagem".
- Fotos do imóvel **não** são enviadas para extração (nada de deduzir características por foto).
- Título e texto do anúncio: segunda chamada, só com os campos já preenchidos; chegam como "Conferir".
- Instruções dentro das fontes são ignoradas; CPF, RG, dados bancários e renda não são extraídos.
- Áudio: fora até existir transcrição. WhatsApp e portais: não há integração; nada é enviado.

## Produção (plataforma)

| Peça | Desenho |
|---|---|
| Tabelas | `rascunho_imovel` (tenant_id, status revisao/convertido/descartado, campos jsonb com fonte/trecho/confiança, criado_por, revisado_por, imovel_id) · `rascunho_fonte` (nome, tipo, lido, erro, storage_key, expira_em) · `rascunho_evento` (auditoria imutável: quem, quando, o quê) |
| Arquivos | Storage de objetos privado por tenant, URL assinada de curta duração; prints e PDFs apagados **90 dias** após concluir ou descartar (proposta); fotos seguem para o imóvel |
| IA | Chamada no servidor (API do Claude, saída JSON validada por esquema); limites por usuário e por imobiliária; nenhum dado de um tenant entra no pedido de outro |
| API | `POST /api/v1/imoveis/rascunhos` (multipart) · `GET/PUT /rascunhos/{id}` · `POST /rascunhos/{id}/concluir` · `POST /rascunhos/{id}/descartar` |
| Permissões | Corretor: só os próprios rascunhos; vínculo de proprietário só por telefone igual. Equipe: todos do tenant. Concluir exige as regras de sempre (autorização escrita, origem, recebimento) |
| Duplicidade | Mesmo endereço normalizado ou telefone do proprietário (regra da captação) + mesmo bairro, uso e dormitórios ou área ±10% |

## Componentes reutilizáveis (protótipo → React)

`EtapasDoFluxo` (passos) · `AreaDeArquivos` (soltar, colar, lista com status) · `CampoComFonte` (estado, fonte, trecho, "Está certo") ·
`AbasDeBlocos` (com contador de pendências) · `OrdenarFotos` · `AvisoDuplicidade` · `PreviaCardImovel` · `PreviaAnuncio` · `BarraDeAcoesFixa`.

## Limites do protótipo

O rascunho fica no banco do artefato (na conta do Claude de quem abre); a página é compartilhada por link, então quem tem o link
lê os dados. Restringir o compartilhamento antes de usar dados reais. Prints e PDFs não são guardados no protótipo.
