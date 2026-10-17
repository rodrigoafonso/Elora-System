package br.com.elora.platform.divulgacao.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class DivulgacaoDominioTest {

    @Test
    void robosDePreviaNaoContamComoAbertura() {
        assertThat(new Visitante("WhatsApp/2.24.8.78 A").ehRobo()).isTrue();
        assertThat(new Visitante("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)").ehRobo()).isTrue();
        assertThat(new Visitante("TelegramBot (like TwitterBot)").ehRobo()).isTrue();
        assertThat(new Visitante(null).ehRobo()).isTrue();
        assertThat(new Visitante("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148").ehRobo()).isFalse();
        assertThat(new Visitante("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148").aparelho()).isEqualTo("celular");
        assertThat(new Visitante("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0").aparelho()).isEqualTo("computador");
    }

    @Test
    void aberturasSeguidasContamUmaVez() {
        Instant t0 = Instant.parse("2026-10-17T12:00:00Z");
        Envio e = new Envio("abcdefgh23", "im", "EL-0112", "L-02", "Eduardo", null, t0, List.of(t0));
        assertThat(e.contaComoNovaAbertura(t0.plusSeconds(60))).isFalse();
        assertThat(e.contaComoNovaAbertura(t0.plusSeconds(120))).isTrue();
        assertThat(new Envio("abcdefgh23", "im", "EL-0112", null, null, null, t0, null).contaComoNovaAbertura(t0)).isTrue();
    }

    @Test
    void tokenAleatorioNoFormato() {
        String a = TokenDeEnvio.novo(), b = TokenDeEnvio.novo();
        assertThat(TokenDeEnvio.valido(a)).isTrue();
        assertThat(a).isNotEqualTo(b);
        assertThat(TokenDeEnvio.valido("ABC")).isFalse();
        assertThat(TokenDeEnvio.valido("abcdefgh1o")).isFalse(); // sem 0/1/o/l/i
    }

    @Test
    void previaRespeitaValorSobConsultaEMostraSoOBairro() {
        PreviaDoImovel p = new PreviaDoImovel("id", "EL-0112", "Casa 3 dormitórios", "Centro", "Pindamonhangaba", 3, new BigDecimal("160"),
                new BigDecimal("5200"), null, false, null, true);
        assertThat(p.titulo()).isEqualTo("Casa 3 dormitórios · Centro");
        assertThat(p.resumo()).isEqualTo("Aluguel R$ 5.200,00 · 160 m² · 3 dormitórios · Centro, Pindamonhangaba");
        PreviaDoImovel oculto = new PreviaDoImovel("id", "EL-0112", "Casa", "Centro", "Pindamonhangaba", null, null, null, new BigDecimal("900000"), true,
                null, true);
        assertThat(oculto.resumo()).isEqualTo("Venda sob consulta · Centro, Pindamonhangaba");
    }
}
