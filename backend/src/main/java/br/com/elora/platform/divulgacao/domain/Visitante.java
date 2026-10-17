package br.com.elora.platform.divulgacao.domain;

import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Quem abriu o link. Os robôs que montam a prévia (WhatsApp, Facebook, Telegram...) e os buscadores
 * leem a página antes do cliente: eles recebem a prévia, mas não contam como abertura.
 */
public record Visitante(String userAgent) {
    private static final Pattern ROBO = Pattern.compile(
            "whatsapp|facebookexternalhit|facebot|meta-externalagent|telegrambot|twitterbot|slackbot|linkedinbot|discordbot|skypeuripreview"
                    + "|googlebot|bingbot|applebot|\\bbot\\b|crawler|spider|preview");
    private static final Pattern CELULAR = Pattern.compile("iphone|android|mobile|ipad");

    public boolean ehRobo() {
        return userAgent == null || userAgent.isBlank() || ROBO.matcher(ua()).find();
    }

    public String aparelho() {
        if (userAgent == null) return "outro";
        if (CELULAR.matcher(ua()).find()) return "celular";
        return ua().contains("windows") || ua().contains("macintosh") || ua().contains("linux") ? "computador" : "outro";
    }

    private String ua() {
        return userAgent.toLowerCase(Locale.ROOT);
    }
}
