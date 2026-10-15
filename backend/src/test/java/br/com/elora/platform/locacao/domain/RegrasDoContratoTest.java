package br.com.elora.platform.locacao.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.locacao.domain.Enums.FormaPagamento;
import br.com.elora.platform.locacao.domain.Enums.Garantia;
import br.com.elora.platform.locacao.domain.Enums.IndiceReajuste;
import br.com.elora.platform.locacao.domain.Enums.StatusContrato;
import br.com.elora.platform.locacao.domain.Enums.TipoLocacao;
import br.com.elora.platform.locacao.domain.Enums.Venia;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class RegrasDoContratoTest {
    static DadosContrato dados(Garantia g, BigDecimal caucao, boolean antecipada, LocalDate fim, Venia venia) {
        return new DadosContrato("im", "pe", TipoLocacao.residencial, LocalDate.of(2026, 1, 10), fim, new BigDecimal("2000"), BigDecimal.valueOf(8), 5,
                FormaPagamento.boleto, IndiceReajuste.IPCA, g, caucao, null, null, null, null, antecipada, venia, null, null, null, null, null, null,
                null, null, null, null, false, false, false, false, StatusContrato.ativo, null,
                g == Garantia.caucao_dinheiro || g == Garantia.caucao_bens ? LocalDate.of(2026, 1, 5) : null, "Seguradora Exemplo", null,
                LocalDate.of(2027, 1, 9));
    }

    static DadosContrato regular() {
        return dados(Garantia.seguro_fianca, null, false, LocalDate.of(2028, 7, 9), Venia.na);
    }

    private static List<String> titulos(DadosContrato d) {
        return RegrasDoContrato.validar(d, false, true).stream().map(Problema::titulo).toList();
    }

    @Test
    void contratoRegularNaoTemProblemas() {
        assertThat(titulos(regular())).isEmpty();
    }

    @Test
    void art38_caucaoEmDinheiroAteTresAlugueis() {
        assertThat(titulos(dados(Garantia.caucao_dinheiro, new BigDecimal("6000"), false, LocalDate.of(2028, 7, 9), Venia.na))).isEmpty();
        assertThat(titulos(dados(Garantia.caucao_dinheiro, new BigDecimal("6000.01"), false, LocalDate.of(2028, 7, 9), Venia.na)))
                .containsExactly("Caução acima de três aluguéis");
    }

    @Test
    void art20_antecipadoSoSemGarantia() {
        assertThat(titulos(dados(Garantia.seguro_fianca, null, true, LocalDate.of(2028, 7, 9), Venia.na))).containsExactly("Cobrança antecipada com garantia");
        // A lei permite antecipado sem garantia, mas a política da Elora não aceita contrato novo sem garantia.
        assertThat(titulos(dados(Garantia.nenhuma, null, true, LocalDate.of(2028, 7, 9), Venia.na))).containsExactly("Garantia fora da política da Elora");
    }

    @Test
    void art3_dezAnosExigemVenia() {
        assertThat(titulos(dados(Garantia.seguro_fianca, null, false, LocalDate.of(2036, 1, 9), Venia.pendente))).containsExactly("Falta a vênia conjugal");
        assertThat(titulos(dados(Garantia.seguro_fianca, null, false, LocalDate.of(2036, 1, 8), Venia.pendente))).isEmpty();
    }

    @Test
    void politicaDaElora_seguroFiancaOuCaucaoComConsentimento() {
        assertThat(titulos(dados(Garantia.fianca, null, false, LocalDate.of(2028, 7, 9), Venia.na))).containsExactly("Garantia fora da política da Elora");
        DadosContrato semConsentimento = new DadosContrato("im", "pe", TipoLocacao.residencial, LocalDate.of(2026, 1, 10), LocalDate.of(2028, 7, 9),
                new BigDecimal("2000"), BigDecimal.valueOf(8), 5, FormaPagamento.boleto, IndiceReajuste.IPCA, Garantia.caucao_bens, null, null, null, null,
                null, false, Venia.na, null, null, null, null, null, null, null, null, null, null, false, false, false, false, StatusContrato.ativo, null,
                null, "Seguradora Exemplo", null, LocalDate.of(2027, 1, 9));
        assertThat(titulos(semConsentimento)).containsExactly("Falta o consentimento do locador");
        // Contrato antigo, garantia não trocada: a política não se aplica.
        assertThat(RegrasDoContrato.validar(semConsentimento, false, false)).isEmpty();
    }

    @Test
    void seguroDoImovelObrigatorioEmContratoAtivo() {
        DadosContrato semSeguro = new DadosContrato("im", "pe", TipoLocacao.residencial, LocalDate.of(2026, 1, 10), LocalDate.of(2028, 7, 9),
                new BigDecimal("2000"), BigDecimal.valueOf(8), 5, FormaPagamento.boleto, IndiceReajuste.IPCA, Garantia.seguro_fianca, null, null, null,
                null, null, false, Venia.na, null, null, null, null, null, null, null, null, null, null, false, false, false, false, StatusContrato.ativo,
                null, null, null, null, null);
        assertThat(titulos(semSeguro)).containsExactly("Falta o seguro do imóvel");
    }

    @Test
    void reajusteSoDepoisDeUmAno() {
        var c = ContratoLocacao.novo("ct", regular(), false);
        assertThatThrownBy(() -> c.reajustar(LocalDate.of(2027, 1, 9), new BigDecimal("4.5"), new BigDecimal("2090")))
                .isInstanceOf(ProblemasDoContratoException.class).hasMessageContaining("Reajuste antes de um ano");
        c.reajustar(LocalDate.of(2027, 1, 10), new BigDecimal("4.5"), new BigDecimal("2090"));
        assertThat(c.dados().aluguel()).isEqualByComparingTo("2090");
        assertThat(c.ultimoMarco()).isEqualTo(LocalDate.of(2027, 1, 10));
    }

    @Test
    void imovelJaAlugadoNaoAceitaOutroContratoAtivo() {
        assertThatThrownBy(() -> ContratoLocacao.novo("ct", regular(), true)).isInstanceOf(ProblemasDoContratoException.class)
                .hasMessageContaining("Imóvel já alugado");
    }
}
