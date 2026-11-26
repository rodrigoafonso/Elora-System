package br.com.elora.platform.captacao.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.shared.domain.RegraVioladaException;
import java.math.BigDecimal;
import java.util.Map;
import org.junit.jupiter.api.Test;

class CaptacaoDominioTest {

    @Test
    void codigoTemFormatoEHashFixo() {
        String c = CodigoDaFonte.novo();
        assertThat(CodigoDaFonte.valido(c)).isTrue();
        assertThat(CodigoDaFonte.valido("curto")).isFalse();
        assertThat(CodigoDaFonte.hash(c)).hasSize(64).isEqualTo(CodigoDaFonte.hash(c));
        assertThat(CodigoDaFonte.novo()).isNotEqualTo(c);
    }

    @Test
    void leCamposComNomesDiferentes() {
        var d = LeadRecebido.ler(Map.of("Name", "Maria Souza", "Phone", "(12) 99999-0000", "E-mail", "Maria@Exemplo.com", "message", "Apto 2 dorm",
                "Orçamento", "R$ 3.000,00", "ref", "el-0101", "lgpd", "sim"));
        assertThat(d.nome()).isEqualTo("Maria Souza");
        assertThat(d.telefone()).isEqualTo("12999990000");
        assertThat(d.email()).isEqualTo("maria@exemplo.com");
        assertThat(d.valorMax()).isEqualByComparingTo(new BigDecimal("3000.00"));
        assertThat(d.imovelCodigo()).isEqualTo("EL-0101");
        assertThat(d.consentimento()).isTrue();
        assertThat(d.robo()).isFalse();
    }

    @Test
    void exigeNomeEContatoValido() {
        assertThatThrownBy(() -> LeadRecebido.ler(Map.of("telefone", "12999990000"))).isInstanceOf(RegraVioladaException.class).hasMessageContaining("nome");
        assertThatThrownBy(() -> LeadRecebido.ler(Map.of("nome", "Ana"))).hasMessageContaining("telefone ou o e-mail");
        assertThatThrownBy(() -> LeadRecebido.ler(Map.of("nome", "Ana", "telefone", "1234"))).hasMessageContaining("Telefone inválido");
        assertThatThrownBy(() -> LeadRecebido.ler(Map.of("nome", "Ana", "email", "ana@"))).hasMessageContaining("E-mail inválido");
    }

    @Test
    void campoArmadilhaMarcaRobo() {
        assertThat(LeadRecebido.ler(Map.of("nome", "Bot", "email", "bot@x.com", "website", "http://spam")).robo()).isTrue();
    }

    @Test
    void chaveDoTelefoneIgnoraPaisEFormatacao() {
        assertThat(LeadRecebido.chaveTelefone("+55 (12) 99999-0000")).isEqualTo("12999990000");
        assertThat(LeadRecebido.chaveTelefone("12 99999-0000")).isEqualTo("12999990000");
    }

    @Test
    void fonteValidaCampos() {
        assertThatThrownBy(() -> new Fonte("x", " ", "site", "Site", "Locação", null, true, null)).hasMessageContaining("nome");
        assertThatThrownBy(() -> new Fonte("x", "Site", "tv", "Site", "Locação", null, true, null)).hasMessageContaining("Tipo");
    }
}
