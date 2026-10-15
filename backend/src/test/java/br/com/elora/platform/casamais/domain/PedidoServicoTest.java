package br.com.elora.platform.casamais.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.shared.domain.Dinheiro;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import org.junit.jupiter.api.Test;

class PedidoServicoTest {
    private static final LocalDate HOJE = LocalDate.of(2026, 10, 15);
    private static final Cliente CLIENTE = new Cliente(PerfilCliente.COMPRADOR, "EL-1", "Tatiana", null);
    private static final Parceiro MUDANCAS = new Parceiro("PA-1", "Mudanças", Set.of(Categoria.MUDANCA), BigDecimal.valueOf(12), null, null, null, null, true);

    private static PedidoServico novo(Categoria c, String corretor) {
        return PedidoServico.novo("SV-1", c, null, true, CLIENTE, "EL-1", corretor, corretor, "Mudança", null, Instant.parse("2026-10-10T10:00:00Z"));
    }

    @Test
    void fluxoCompleto_congelaComissaoERegras() {
        var p = novo(Categoria.MUDANCA, "caio");
        p.registrarOrcamento(MUDANCAS, Dinheiro.deReais("1500"), "dia 20", null, HOJE);
        assertThat(p.margemPrevista()).isEqualTo(Dinheiro.deReais("180"));
        p.aprovar(HOJE);
        p.concluir(HOJE);
        p.registrarMargem(Dinheiro.deReais("180"), HOJE, RegrasCasaMais.PADRAO, HOJE);
        assertThat(p.dados().fundoPct()).isEqualByComparingTo("10");
        assertThat(p.dados().corretorPct()).isEqualByComparingTo("30");
        assertThat(p.divisao()).get().extracting(DivisaoMargem::corretor).isEqualTo(Dinheiro.deReais("48.60"));
    }

    @Test
    void margemSoDepoisDoServicoFeito() {
        var p = novo(Categoria.MUDANCA, null);
        assertThatThrownBy(() -> p.registrarMargem(Dinheiro.deReais("10"), HOJE, RegrasCasaMais.PADRAO, HOJE))
                .isInstanceOf(RegraVioladaException.class).hasMessageContaining("depois do serviço feito");
    }

    @Test
    void juridicoNaoTemComissaoNemUrgencia() {
        var adv = new Parceiro("PA-9", "Advocacia", Set.of(Categoria.JURIDICO), BigDecimal.TEN, null, null, null, null, true);
        assertThat(adv.comissaoPct()).isEqualByComparingTo("0");
        var p = novo(Categoria.JURIDICO, null);
        assertThat(p.dados().urgente()).isFalse();
        p.registrarOrcamento(adv, Dinheiro.deReais("800"), null, null, HOJE);
        assertThat(p.dados().margemPct()).isEqualByComparingTo("0");
    }

    @Test
    void parceiroPrecisaAtenderACategoria() {
        var p = novo(Categoria.LIMPEZA, null);
        assertThatThrownBy(() -> p.registrarOrcamento(MUDANCAS, Dinheiro.deReais("100"), null, null, HOJE))
                .isInstanceOf(RegraVioladaException.class);
    }

    @Test
    void cancelamentoSoEmAberto() {
        var p = novo(Categoria.MUDANCA, null);
        p.cancelar("cliente desistiu");
        assertThat(p.status()).isEqualTo(StatusPedido.CANCELADO);
        assertThatThrownBy(() -> p.cancelar("de novo")).isInstanceOf(RegraVioladaException.class);
    }
}
