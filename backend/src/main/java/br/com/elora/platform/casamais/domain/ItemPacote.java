package br.com.elora.platform.casamais.domain;

import java.util.Arrays;
import java.util.Optional;

/** Itens do Pacote Chegada (mesmas chaves do front-end). O guia do bairro não gera pedido: é tarefa da equipe. */
public enum ItemPacote {
    PLUGPLAY("plugplay", Categoria.PLUGPLAY, null, "Luz, água, gás e internet"),
    LIMPEZA("limpeza", Categoria.LIMPEZA, null, "Limpeza de entrada"),
    MUDANCA("mudanca", Categoria.MUDANCA, null, "Mudança e frete"),
    MONTAGEM("montagem", Categoria.MOVEIS, null, "Montagem de móveis"),
    INSTALACAO("instalacao", Categoria.MANUTENCAO, "Marido de aluguel", "Pequenas instalações"),
    CLIMA("clima", Categoria.CLIMA, null, "Ar-condicionado"),
    GUIA("guia", null, null, "Guia do bairro");

    private final String chave;
    private final Categoria categoria;
    private final String subservico;
    private final String titulo;

    ItemPacote(String chave, Categoria categoria, String subservico, String titulo) {
        this.chave = chave;
        this.categoria = categoria;
        this.subservico = subservico;
        this.titulo = titulo;
    }

    public String chave() {
        return chave;
    }

    /** Categoria do pedido gerado; vazio para o guia do bairro. */
    public Optional<Categoria> categoria() {
        return Optional.ofNullable(categoria);
    }

    public String subservico() {
        return subservico;
    }

    public String titulo() {
        return titulo;
    }

    public static Optional<ItemPacote> daChave(String chave) {
        return Arrays.stream(values()).filter(i -> i.chave.equals(chave)).findFirst();
    }
}
