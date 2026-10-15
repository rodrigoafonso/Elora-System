package br.com.elora.platform.casamais.domain;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.elora.platform.shared.domain.Dinheiro;
import java.math.BigDecimal;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.Test;

class DivisaoMargemTest {
    private static final BigDecimal DEZ = BigDecimal.TEN;
    private static final BigDecimal TRINTA = BigDecimal.valueOf(30);

    @Test
    void exemploDoManual_margemDe180() {
        var d = DivisaoMargem.calcular(Dinheiro.deReais("180"), DEZ, TRINTA, true);
        assertThat(d.fundo()).isEqualTo(Dinheiro.deReais("18"));
        assertThat(d.corretor()).isEqualTo(Dinheiro.deReais("48.60"));
        assertThat(d.elora()).isEqualTo(Dinheiro.deReais("113.40"));
    }

    @Test
    void semCorretor_oRestanteFicaComAElora() {
        var d = DivisaoMargem.calcular(Dinheiro.deReais("180"), DEZ, TRINTA, false);
        assertThat(d.corretor()).isEqualTo(Dinheiro.ZERO);
        assertThat(d.elora()).isEqualTo(Dinheiro.deReais("162"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"0.01", "1", "33.33", "99.99", "1234.57"})
    void aSomaDasPartesEhSempreAMargem(String reais) {
        var d = DivisaoMargem.calcular(Dinheiro.deReais(reais), BigDecimal.valueOf(7), BigDecimal.valueOf(33), true);
        assertThat(d.fundo().mais(d.corretor()).mais(d.elora())).isEqualTo(d.margem());
    }
}
