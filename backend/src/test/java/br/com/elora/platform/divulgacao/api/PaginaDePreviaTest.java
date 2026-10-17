package br.com.elora.platform.divulgacao.api;

import static org.assertj.core.api.Assertions.assertThat;

import br.com.elora.platform.divulgacao.domain.PreviaDoImovel;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class PaginaDePreviaTest {
    private final PreviaDoImovel casa = new PreviaDoImovel("id", "EL-0112", "Casa \"3\" <dorm>", "Centro", "Pindamonhangaba", 3, null,
            new BigDecimal("5200"), null, false, "https://fotos.exemplo/capa.jpg", true);

    @Test
    void metatagsParaOWhatsappERedirecionamento() {
        String h = new PaginaDePrevia("https://site.exemplo/", "Elora", "").html(casa, "https://site.exemplo/i/EL-0112?e=abcdefgh23");
        assertThat(h).contains("<meta property=\"og:title\" content=\"Casa &quot;3&quot; &lt;dorm&gt; · Centro\">")
                .contains("<meta property=\"og:image\" content=\"https://fotos.exemplo/capa.jpg\">")
                .contains("<meta http-equiv=\"refresh\" content=\"0;url=https://site.exemplo/imovel/EL-0112\">")
                .doesNotContain("<dorm>");
    }

    @Test
    void semSiteNaoRedirecionaEMostraOResumo() {
        PaginaDePrevia p = new PaginaDePrevia("", "Elora", "");
        assertThat(p.html(casa, "http://localhost:8080/i/EL-0112")).doesNotContain("http-equiv=\"refresh\"").contains("Aluguel R$ 5.200,00");
        assertThat(p.link("http://localhost:8080/", "EL-0112", "abcdefgh23")).isEqualTo("http://localhost:8080/i/EL-0112?e=abcdefgh23");
        assertThat(new PaginaDePrevia("https://site.exemplo", "Elora", "").link("http://interno:8080", "EL-0112", null)).isEqualTo("https://site.exemplo/i/EL-0112");
    }
}
