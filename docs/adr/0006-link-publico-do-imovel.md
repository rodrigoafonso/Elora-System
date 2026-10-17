# ADR 0006 — Link público do imóvel com prévia e aviso de abertura

**Status:** aceito · **Data:** 2026-10-17

**Contexto.** O corretor manda o imóvel pelo WhatsApp. Sem prévia (foto, título e preço) o link chama pouca atenção, e sem
registro de abertura o corretor não sabe quando o cliente olhou o imóvel. Um brochure em PDF sozinho envelhece: o cliente
encaminha com preço antigo ou com o imóvel já alugado.

**Decisão.**
- O link é `/{site}/i/{código do imóvel}?e={código do envio}`. O código do envio tem 10 caracteres aleatórios (≈49 bits) e
  não carrega dados pessoais; corretor e cliente ficam na tabela `app.envio_imovel`. O mesmo cliente recebe sempre o mesmo link.
- `GET /i/{código}` é público e servido pelo backend (o proxy do site encaminha `/i/*`). Devolve HTML com metatags Open Graph
  e redireciona o cliente para `{site}/imovel/{código}`. Sem `elora.site.url`, a própria página mostra o resumo.
- Robôs de prévia (WhatsApp, Facebook, Telegram, buscadores) recebem a prévia mas **não contam** como abertura.
  Aberturas com menos de 2 minutos de intervalo contam uma vez.
- Imóvel sem autorização escrita do proprietário não tem link nem prévia (Lei 6.530/78, art. 20, III). Valor "sob consulta"
  e endereço oculto são respeitados (a prévia mostra só bairro e cidade).
- LGPD (art. 6º, III): a abertura guarda só data/hora e o tipo de aparelho. Nada de IP nem user agent completo.
- O brochure (PDF A4) e as imagens 4:5 para o WhatsApp são gerados no navegador a partir do cadastro, com a data dos valores
  e o QR Code do link do envio — o material impresso também leva ao link atualizado.

**Consequências.** O corretor recebe o aviso "cliente abriu o link" (bom momento para ligar) e a ficha do imóvel mostra
quantos links foram abertos. A resposta do `/i/*` não pode ir para cache (cada abertura precisa chegar ao servidor).
Quando houver um site por imobiliária, o tenant dos links sem código virá do domínio (hoje: `elora.publico.tenant-padrao`).
