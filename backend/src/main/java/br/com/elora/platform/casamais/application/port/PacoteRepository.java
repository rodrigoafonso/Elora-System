package br.com.elora.platform.casamais.application.port;

import br.com.elora.platform.casamais.domain.Pacote;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

public interface PacoteRepository {
    List<Pacote> listar(TenantId tenant);

    Optional<Pacote> buscar(TenantId tenant, String id);

    Pacote salvar(TenantId tenant, Pacote pacote);

    String novoId();
}
