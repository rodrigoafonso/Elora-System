package br.com.elora.platform.casamais.domain;

import br.com.elora.platform.shared.domain.Dinheiro;
import java.math.BigDecimal;

/**
 * Divisão de uma margem recebida.
 * 1) Fundo do Projeto Boa Ideia = fundo% da margem. 2) Corretor = corretor% do restante. 3) Elora = o que sobra.
 */
public record DivisaoMargem(Dinheiro margem, Dinheiro fundo, Dinheiro corretor, Dinheiro elora) {
    public static DivisaoMargem calcular(Dinheiro margem, BigDecimal fundoPct, BigDecimal corretorPct, boolean temCorretor) {
        Dinheiro fundo = margem.percentual(fundoPct);
        Dinheiro corretor = temCorretor ? margem.menos(fundo).percentual(corretorPct) : Dinheiro.ZERO;
        return new DivisaoMargem(margem, fundo, corretor, margem.menos(fundo).menos(corretor));
    }
}
