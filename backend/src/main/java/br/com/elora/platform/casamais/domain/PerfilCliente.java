package br.com.elora.platform.casamais.domain;

import java.util.Locale;

public enum PerfilCliente {
    PROPRIETARIO, INQUILINO, COMPRADOR,
    /** Funcionário de uma empresa cliente (Casa+ Empresas); a referência é o id da empresa. */
    EMPRESA;

    public String chave() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static PerfilCliente daChave(String chave) {
        return valueOf(chave.toUpperCase(Locale.ROOT));
    }
}
