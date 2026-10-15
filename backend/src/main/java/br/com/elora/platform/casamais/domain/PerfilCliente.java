package br.com.elora.platform.casamais.domain;

import java.util.Locale;

public enum PerfilCliente {
    PROPRIETARIO, INQUILINO, COMPRADOR;

    public String chave() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static PerfilCliente daChave(String chave) {
        return valueOf(chave.toUpperCase(Locale.ROOT));
    }
}
