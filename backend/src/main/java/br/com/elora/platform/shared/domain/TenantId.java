package br.com.elora.platform.shared.domain;

import java.util.regex.Pattern;

/**
 * Identifica a imobiliária (cliente da plataforma). Toda tabela de negócio tem tenant_id,
 * o que permite atender várias imobiliárias no mesmo banco hoje e particionar/fragmentar por tenant amanhã.
 */
public record TenantId(String valor) {
    private static final Pattern FORMATO = Pattern.compile("[a-z0-9][a-z0-9-]{1,39}");

    public TenantId {
        if (valor == null || !FORMATO.matcher(valor).matches()) throw new RegraVioladaException("Imobiliária inválida.");
    }
}
