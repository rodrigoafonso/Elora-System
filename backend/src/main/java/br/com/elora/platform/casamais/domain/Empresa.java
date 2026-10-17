package br.com.elora.platform.casamais.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

/** Empresa cliente do Casa+ Empresas: RH que transfere funcionários para a região. */
public record Empresa(String id, String nome, String cidade, String contato, String whatsapp, String email, String auxilio, String observacao) {
    public Empresa {
        exigir(nome != null && !nome.isBlank(), "Informe o nome da empresa.");
        nome = nome.strip();
        if (nome.length() > 100) nome = nome.substring(0, 100);
    }
}
