package br.com.elora.platform.shared.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Valor em centavos (inteiro), para que somas e divisões não percam centavos.
 * Arredondamento: meio para cima, igual ao front-end (Math.round em valores positivos).
 */
public record Dinheiro(long centavos) implements Comparable<Dinheiro> {
    public static final Dinheiro ZERO = new Dinheiro(0);

    public static Dinheiro deReais(BigDecimal reais) {
        if (reais == null) return ZERO;
        return new Dinheiro(reais.movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact());
    }

    public static Dinheiro deReais(String reais) {
        return deReais(new BigDecimal(reais));
    }

    public BigDecimal emReais() {
        return BigDecimal.valueOf(centavos, 2);
    }

    /** pct% deste valor, arredondado ao centavo. */
    public Dinheiro percentual(BigDecimal pct) {
        if (pct == null || pct.signum() == 0) return ZERO;
        return new Dinheiro(BigDecimal.valueOf(centavos).multiply(pct).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP).longValueExact());
    }

    public Dinheiro menos(Dinheiro outro) {
        return new Dinheiro(centavos - outro.centavos);
    }

    public Dinheiro mais(Dinheiro outro) {
        return new Dinheiro(centavos + outro.centavos);
    }

    public boolean positivo() {
        return centavos > 0;
    }

    @Override
    public int compareTo(Dinheiro o) {
        return Long.compare(centavos, o.centavos);
    }
}
