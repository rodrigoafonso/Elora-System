package br.com.elora.platform.casamais.application;

import br.com.elora.platform.casamais.domain.Categoria;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.shared.domain.Dinheiro;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

/** Entradas dos casos de uso (independentes de HTTP). */
public final class Comandos {
    private Comandos() {}

    public record NovoPedido(Categoria categoria, String subservico, boolean urgente, PerfilCliente perfil, String referencia, String descricao, LocalDate preferenciaEm) {}

    public record NovoOrcamento(String pedidoId, String parceiroId, Dinheiro valor, String prazo, String observacao) {}

    public record MargemRecebida(String pedidoId, Dinheiro valor, LocalDate recebidaEm) {}

    public record DadosParceiro(String id, String nome, Set<Categoria> categorias, BigDecimal comissaoPct, String whatsapp, String cidades, String prazo, String apresentacao, boolean ativo) {}

    public record NovasRegras(BigDecimal corretorPct, BigDecimal fundoBoaIdeiaPct, Dinheiro taxaPlugPlay) {}
}
