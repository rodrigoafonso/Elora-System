package br.com.elora.platform.divulgacao.domain;

import java.security.SecureRandom;
import java.util.regex.Pattern;

/**
 * Código do envio no link (/i/{imóvel}?e={código}). Aleatório, curto e sem dados pessoais:
 * 10 caracteres de um alfabeto de 31 (sem 0/o, 1/l/i) ≈ 49 bits, impossível de adivinhar por tentativa.
 */
public final class TokenDeEnvio {
    static final String ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";
    private static final Pattern FORMATO = Pattern.compile("[abcdefghjkmnpqrstuvwxyz2-9]{10}");
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private TokenDeEnvio() {}

    public static String novo() {
        StringBuilder sb = new StringBuilder(10);
        for (int i = 0; i < 10; i++) sb.append(ALFABETO.charAt(ALEATORIO.nextInt(ALFABETO.length())));
        return sb.toString();
    }

    public static boolean valido(String token) {
        return token != null && FORMATO.matcher(token).matches();
    }
}
