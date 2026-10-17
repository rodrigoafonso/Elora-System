package br.com.elora.platform.casamais.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.shared.domain.Dinheiro;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class PacoteTest {
    private static final Cliente FUNCIONARIO = new Cliente(PerfilCliente.EMPRESA, "EM-1", "Daniel", null);
    private static final LocalDate DATA = LocalDate.of(2026, 11, 20);

    private static Pacote pacote(Cliente c, List<ItemPacote> itens) {
        return new Pacote("PK-1", c, "EM-1", null, null, null, DATA, null, 2, false, null, null, itens, List.of(), null, Instant.EPOCH);
    }

    @Test
    void itensRepetidosViramUmSo() {
        assertThat(pacote(FUNCIONARIO, List.of(ItemPacote.GUIA, ItemPacote.LIMPEZA, ItemPacote.GUIA)).itens()).containsExactly(ItemPacote.GUIA, ItemPacote.LIMPEZA);
    }

    @Test
    void funcionarioDeEmpresaPrecisaDeNomeEPacotePrecisaDeItens() {
        assertThatThrownBy(() -> pacote(new Cliente(PerfilCliente.EMPRESA, "EM-1", " ", null), List.of(ItemPacote.GUIA)))
                .isInstanceOf(RegraVioladaException.class).hasMessage("Informe o nome do funcionário.");
        assertThatThrownBy(() -> pacote(FUNCIONARIO, List.of())).isInstanceOf(RegraVioladaException.class).hasMessage("Escolha ao menos um item do pacote.");
    }

    @Test
    void plugPlayDoPacoteNasceAprovadoComATaxa() {
        var p = PedidoServico.plugPlayDoPacote("SV-1", "PK-1", FUNCIONARIO, null, null, null, DATA, Dinheiro.deReais("150"), LocalDate.of(2026, 10, 17), Instant.EPOCH);
        assertThat(p.status()).isEqualTo(StatusPedido.APROVADO);
        assertThat(p.margemPrevista()).isEqualTo(Dinheiro.deReais("150"));
        assertThat(p.dados().pacoteId()).isEqualTo("PK-1");
    }

    @Test
    void guiaEnviadoUmaVezSo() {
        var pk = pacote(FUNCIONARIO, List.of(ItemPacote.GUIA)).comGuiaEnviado(LocalDate.of(2026, 10, 20));
        assertThat(pk.comGuiaEnviado(LocalDate.of(2026, 10, 25)).guiaEnviadoEm()).isEqualTo(LocalDate.of(2026, 10, 20));
    }
}
