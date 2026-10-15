package br.com.elora.platform.casamais.domain;

import java.util.Locale;

public enum StatusPedido {
    PEDIDO, ORCAMENTO, APROVADO, EXECUTADO, CANCELADO;

    public boolean aberto() {
        return this == PEDIDO || this == ORCAMENTO || this == APROVADO;
    }

    public String chave() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static StatusPedido daChave(String chave) {
        return valueOf(chave.toUpperCase(Locale.ROOT));
    }
}
