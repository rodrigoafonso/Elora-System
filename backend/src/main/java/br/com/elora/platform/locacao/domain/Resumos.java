package br.com.elora.platform.locacao.domain;

/** Cadastros de outros módulos usados pela Locação (somente leitura). */
public final class Resumos {
    private Resumos() {}

    public record Imovel(String id, String codigo, String descricao, String bairro, String cidade) {}

    public record Pessoa(String id, String nome) {}
}
