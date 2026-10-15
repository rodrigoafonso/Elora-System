package br.com.elora.platform.casamais.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

/** Profissional ou empresa que atende os clientes depois das chaves. */
public record Parceiro(
        String id,
        String nome,
        Set<Categoria> categorias,
        BigDecimal comissaoPct,
        String whatsapp,
        String cidades,
        String prazo,
        String apresentacao,
        boolean ativo) {

    private static final BigDecimal MAXIMO = BigDecimal.valueOf(50);

    public Parceiro {
        exigir(nome != null && !nome.isBlank() && categorias != null && !categorias.isEmpty(), "Informe o nome e ao menos um serviço.");
        exigir(categorias.stream().noneMatch(Categoria::daElora), "Serviços da própria Elora não têm parceiro.");
        nome = nome.strip();
        categorias = Set.copyOf(categorias);
        // Jurídico: sem comissão (Lei 8.906/94, art. 34). Demais: entre 0% e 50%.
        BigDecimal pct = comissaoPct == null ? BigDecimal.ZERO : comissaoPct;
        comissaoPct = categorias.stream().allMatch(Categoria::semComissao) ? BigDecimal.ZERO : pct.max(BigDecimal.ZERO).min(MAXIMO);
    }

    public boolean atende(Categoria c) {
        return categorias.contains(c);
    }

    public List<String> chavesDasCategorias() {
        return categorias.stream().map(Categoria::chave).sorted().toList();
    }
}
