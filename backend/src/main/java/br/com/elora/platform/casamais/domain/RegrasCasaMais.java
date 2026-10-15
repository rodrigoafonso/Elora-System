package br.com.elora.platform.casamais.domain;

import br.com.elora.platform.shared.domain.Dinheiro;
import java.math.BigDecimal;

/**
 * Regras de remuneração da imobiliária.
 *
 * @param corretorPct participação do corretor sobre o que sobra depois do fundo (0–100)
 * @param fundoBoaIdeiaPct parte de cada margem que vai para o fundo do Projeto Boa Ideia (0–50)
 * @param taxaPlugPlay taxa fixa da Mudança Plug & Play
 */
public record RegrasCasaMais(BigDecimal corretorPct, BigDecimal fundoBoaIdeiaPct, Dinheiro taxaPlugPlay) {
    public static final RegrasCasaMais PADRAO = new RegrasCasaMais(BigDecimal.valueOf(30), BigDecimal.TEN, Dinheiro.deReais("150"));

    /** Normaliza para os limites aceitos (mesma regra do front-end). */
    public static RegrasCasaMais limitadas(BigDecimal corretorPct, BigDecimal fundoPct, Dinheiro taxa) {
        return new RegrasCasaMais(
                limitar(corretorPct, 100), limitar(fundoPct, 50), taxa == null || taxa.centavos() < 0 ? Dinheiro.ZERO : new Dinheiro(Math.round(taxa.centavos() / 100.0) * 100));
    }

    private static BigDecimal limitar(BigDecimal v, int max) {
        if (v == null) return BigDecimal.ZERO;
        BigDecimal r = v.setScale(0, java.math.RoundingMode.HALF_UP);
        return r.max(BigDecimal.ZERO).min(BigDecimal.valueOf(max));
    }
}
