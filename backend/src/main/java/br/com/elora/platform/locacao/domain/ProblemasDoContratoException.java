package br.com.elora.platform.locacao.domain;

import java.util.List;

/** Lista de problemas do contrato, devolvida inteira para o formulário mostrar todos de uma vez. */
public class ProblemasDoContratoException extends RuntimeException {
    private static final long serialVersionUID = 1L;
    private final transient List<Problema> problemas;

    public ProblemasDoContratoException(List<Problema> problemas) {
        super(String.join(" ", problemas.stream().map(p -> p.titulo() + ". " + p.msg()).toList()));
        this.problemas = List.copyOf(problemas);
    }

    public List<Problema> problemas() {
        return problemas;
    }
}
