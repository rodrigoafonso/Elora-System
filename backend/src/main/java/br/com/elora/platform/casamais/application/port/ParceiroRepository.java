package br.com.elora.platform.casamais.application.port;

import br.com.elora.platform.casamais.domain.Parceiro;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

public interface ParceiroRepository {
    List<Parceiro> listar(TenantId tenant);

    Optional<Parceiro> buscar(TenantId tenant, String id);

    Parceiro salvar(TenantId tenant, Parceiro parceiro);

    String novoId();
}
