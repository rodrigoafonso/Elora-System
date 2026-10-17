package br.com.elora.platform.divulgacao.api;

import br.com.elora.platform.divulgacao.domain.PreviaDoImovel;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * HTML do link público /i/{código}. O WhatsApp e as redes leem as metatags Open Graph (título, descrição, foto)
 * para montar a prévia; o cliente é levado na hora para a página do imóvel no site. Sem site configurado,
 * a própria página mostra o resumo do imóvel.
 */
public class PaginaDePrevia {
    private final String site;
    private final String nome;
    private final String imagemPadrao;

    public PaginaDePrevia(String site, String nome, String imagemPadrao) {
        this.site = site == null ? "" : site.replaceAll("/+$", "");
        this.nome = nome;
        this.imagemPadrao = imagemPadrao == null ? "" : imagemPadrao;
    }

    /** Endereço público do link: no site (o proxy leva /i/* ao backend) ou, sem site, o próprio backend. */
    public String link(String baseAtual, String codigo, String token) {
        String base = site.isEmpty() ? baseAtual.replaceAll("/+$", "") : site;
        return base + "/i/" + URLEncoder.encode(codigo, StandardCharsets.UTF_8) + (token == null ? "" : "?e=" + token);
    }

    public String destino(PreviaDoImovel p) {
        return site.isEmpty() ? null : site + "/imovel/" + URLEncoder.encode(p.codigo(), StandardCharsets.UTF_8);
    }

    public String html(PreviaDoImovel p, String urlDoLink) {
        String destino = destino(p), foto = p.fotoUrl() != null ? p.fotoUrl() : imagemPadrao, titulo = esc(p.titulo()), desc = esc(p.resumo());
        StringBuilder h = new StringBuilder(2048).append("<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\">")
                .append("<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">")
                .append("<meta name=\"robots\" content=\"noindex\">")
                .append("<title>").append(titulo).append(" · ").append(esc(nome)).append("</title>")
                .append("<meta name=\"description\" content=\"").append(desc).append("\">")
                .append("<meta property=\"og:type\" content=\"website\">")
                .append("<meta property=\"og:site_name\" content=\"").append(esc(nome)).append("\">")
                .append("<meta property=\"og:locale\" content=\"pt_BR\">")
                .append("<meta property=\"og:title\" content=\"").append(titulo).append("\">")
                .append("<meta property=\"og:description\" content=\"").append(desc).append("\">")
                .append("<meta property=\"og:url\" content=\"").append(esc(urlDoLink)).append("\">");
        if (!foto.isEmpty()) {
            h.append("<meta property=\"og:image\" content=\"").append(esc(foto)).append("\">")
                    .append("<meta property=\"og:image:alt\" content=\"").append(titulo).append("\">")
                    .append("<meta name=\"twitter:card\" content=\"summary_large_image\">");
        }
        if (destino != null) {
            h.append("<link rel=\"canonical\" href=\"").append(esc(destino)).append("\">")
                    .append("<meta http-equiv=\"refresh\" content=\"0;url=").append(esc(destino)).append("\">");
        }
        h.append("<style>body{margin:0;font:16px/1.5 system-ui,sans-serif;background:#F7F5EF;color:#1E2A1F}main{max-width:560px;margin:0 auto;padding:24px}")
                .append("img{width:100%;border-radius:12px;aspect-ratio:1.91/1;object-fit:cover}h1{font-weight:500;margin:16px 0 4px}a{color:#2E3C2B}</style>")
                .append("</head><body><main>");
        if (!foto.isEmpty()) h.append("<img src=\"").append(esc(foto)).append("\" alt=\"\">");
        h.append("<h1>").append(titulo).append("</h1><p>").append(desc).append("</p>");
        if (destino != null) h.append("<p><a href=\"").append(esc(destino)).append("\">Ver fotos e detalhes</a></p>");
        return h.append("<p><small>").append(esc(nome)).append(" · Cód. ").append(esc(p.codigo())).append("</small></p></main></body></html>").toString();
    }

    public String naoEncontrado() {
        return "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">"
                + "<meta name=\"robots\" content=\"noindex\"><title>Imóvel indisponível · " + esc(nome) + "</title>"
                + (site.isEmpty() ? "" : "<meta http-equiv=\"refresh\" content=\"3;url=" + esc(site) + "\">")
                + "</head><body style=\"font:16px system-ui,sans-serif;padding:24px\"><h1>Este imóvel não está mais disponível.</h1>"
                + (site.isEmpty() ? "" : "<p><a href=\"" + esc(site) + "\">Veja outros imóveis</a></p>") + "</body></html>";
    }

    static String esc(String s) {
        if (s == null) return "";
        StringBuilder b = new StringBuilder(s.length() + 16);
        for (char c : s.toCharArray()) {
            switch (c) {
                case '&' -> b.append("&amp;");
                case '<' -> b.append("&lt;");
                case '>' -> b.append("&gt;");
                case '"' -> b.append("&quot;");
                case '\'' -> b.append("&#39;");
                default -> b.append(c);
            }
        }
        return b.toString();
    }
}
