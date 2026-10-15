package br.com.elora.platform.casamais.domain;

import java.util.Arrays;
import java.util.Optional;

/** Categorias do Elora Casa+ (mesmas chaves do front-end). */
public enum Categoria {
    PLUGPLAY("plugplay", "Mudança Plug & Play", false),
    MANUTENCAO("manutencao", "Reparos, reformas e outros serviços", false),
    ASSISTENCIA("assistencia", "Assistência técnica", false),
    MUDANCA("mudanca", "Mudança e frete", false),
    LIMPEZA("limpeza", "Limpeza", false),
    MOVEIS("moveis", "Móveis planejados e montagem", false),
    CLIMA("clima", "Ar-condicionado", false),
    SEGURANCA("seguranca", "Segurança e automação", false),
    JARDIM("jardim", "Jardim e piscina", false),
    JURIDICO("juridico", "Jurídico", false),
    REFORMA("reforma", "Reforma e pintura", false),
    ADMINISTRACAO("administracao", "Alugar com a Elora", true);

    private final String chave;
    private final String nome;
    private final boolean daElora;

    Categoria(String chave, String nome, boolean daElora) {
        this.chave = chave;
        this.nome = nome;
        this.daElora = daElora;
    }

    public String chave() {
        return chave;
    }

    public String nome() {
        return nome;
    }

    /** Serviço prestado pela própria Elora (vira captação; não há parceiro nem margem). */
    public boolean daElora() {
        return daElora;
    }

    /** Advogado não pode pagar por indicação de clientes (Lei 8.906/94, art. 34, III e IV). */
    public boolean semComissao() {
        return this == JURIDICO;
    }

    /** Urgência não se aplica ao Jurídico nem aos serviços da própria Elora. */
    public boolean aceitaUrgencia() {
        return !daElora && this != JURIDICO;
    }

    public static Optional<Categoria> daChave(String chave) {
        return Arrays.stream(values()).filter(c -> c.chave.equals(chave)).findFirst();
    }
}
