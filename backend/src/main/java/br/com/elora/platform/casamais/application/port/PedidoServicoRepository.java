package br.com.elora.platform.casamais.application.port;

import br.com.elora.platform.casamais.domain.PedidoServico;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

/** Porta de saída: persistência dos pedidos (implementada em infrastructure/persistence). */
public interface PedidoServicoRepository {
    List<PedidoServico> listar(TenantId tenant);

    Optional<PedidoServico> buscar(TenantId tenant, String id);

    /** Grava com controle de concorrência otimista (versão). */
    PedidoServico salvar(TenantId tenant, PedidoServico pedido);

    String novoId();
}
