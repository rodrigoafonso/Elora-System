package br.com.elora.platform.divulgacao.domain;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * O que a prévia do link mostra: só dados públicos do imóvel. Respeita o "valor sob consulta"
 * e nunca mostra o endereço (só bairro e cidade). Imóvel sem autorização escrita não tem prévia
 * (Lei 6.530/78, art. 20, III).
 */
public record PreviaDoImovel(String id, String codigo, String descricao, String bairro, String cidade, Integer quartos, BigDecimal areaM2,
        BigDecimal aluguel, BigDecimal venda, boolean sobConsulta, String fotoUrl, boolean autorizado) {

    public String titulo() {
        return descricao + (bairro == null || bairro.isBlank() ? "" : " · " + bairro);
    }

    public String resumo() {
        List<String> partes = new ArrayList<>();
        String preco = preco();
        if (preco != null) partes.add(preco);
        if (areaM2 != null) partes.add(NumberFormat.getNumberInstance(Locale.of("pt", "BR")).format(areaM2) + " m²");
        if (quartos != null) partes.add(quartos + (quartos == 1 ? " dormitório" : " dormitórios"));
        partes.add((bairro == null || bairro.isBlank() ? "" : bairro + ", ") + cidade);
        return String.join(" · ", partes);
    }

    String preco() {
        if (aluguel == null && venda == null) return null;
        String rotulo = aluguel != null ? "Aluguel" : "Venda";
        if (sobConsulta) return rotulo + " sob consulta";
        NumberFormat f = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));
        return rotulo + " " + f.format(aluguel != null ? aluguel : venda).replace(' ', ' ');
    }
}
