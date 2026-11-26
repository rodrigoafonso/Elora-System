package br.com.elora.platform.captacao.domain;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.regex.Pattern;

/**
 * Código secreto de uma fonte de captação (vai no endereço que o site usa para enviar leads).
 * 32 caracteres de um alfabeto de 31 (≈ 158 bits). O banco guarda só o hash SHA-256: o código aparece uma vez, ao ser criado.
 */
public final class CodigoDaFonte {
    static final String ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";
    static final int TAMANHO = 32;
    private static final Pattern FORMATO = Pattern.compile("[abcdefghjkmnpqrstuvwxyz2-9]{" + TAMANHO + "}");
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private CodigoDaFonte() {}

    public static String novo() {
        StringBuilder sb = new StringBuilder(TAMANHO);
        for (int i = 0; i < TAMANHO; i++) sb.append(ALFABETO.charAt(ALEATORIO.nextInt(ALFABETO.length())));
        return sb.toString();
    }

    public static boolean valido(String codigo) {
        return codigo != null && FORMATO.matcher(codigo).matches();
    }

    public static String hash(String codigo) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(codigo.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
