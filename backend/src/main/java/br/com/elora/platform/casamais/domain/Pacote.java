package br.com.elora.platform.casamais.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Pacote Chegada do Elora Casa+: vários serviços num pedido só. Cada item com categoria vira um {@link PedidoServico}
 * comum (mesmas regras de orçamento, margem, fundo Boa Ideia e participação); o guia do bairro é tarefa da equipe.
 */
public record Pacote(
        String id, Cliente cliente, String empresaId, String imovelRef, String corretorRef, String corretorNome, LocalDate data, String origem,
        int pessoas, boolean pet, String observacao, String buscaImovel, List<ItemPacote> itens, List<String> pedidos, LocalDate guiaEnviadoEm,
        Instant criadoEm) {

    private static final Set<String> BUSCAS = Set.of("Locação", "Compra");

    public Pacote {
        exigir(data != null, "Informe a data da mudança.");
        exigir(itens != null && !itens.isEmpty(), "Escolha ao menos um item do pacote.");
        exigir(cliente != null && cliente.referencia() != null && !cliente.referencia().isBlank(), "Escolha para quem é o pacote.");
        exigir(cliente.perfil() != PerfilCliente.EMPRESA || (cliente.nome() != null && !cliente.nome().isBlank()), "Informe o nome do funcionário.");
        exigir(buscaImovel == null || BUSCAS.contains(buscaImovel), "Busca de imóvel inválida.");
        itens = List.copyOf(new java.util.LinkedHashSet<>(itens));
        pedidos = pedidos == null ? List.of() : List.copyOf(pedidos);
        pessoas = Math.max(1, Math.min(20, pessoas));
    }

    public Pacote comGuiaEnviado(LocalDate hoje) {
        return guiaEnviadoEm != null ? this : new Pacote(id, cliente, empresaId, imovelRef, corretorRef, corretorNome, data, origem, pessoas, pet,
                observacao, buscaImovel, itens, pedidos, hoje, criadoEm);
    }
}
