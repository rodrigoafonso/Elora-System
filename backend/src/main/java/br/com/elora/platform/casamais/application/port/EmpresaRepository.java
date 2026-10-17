package br.com.elora.platform.casamais.application.port;

import br.com.elora.platform.casamais.domain.Empresa;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

public interface EmpresaRepository {
    List<Empresa> listar(TenantId tenant);

    Optional<Empresa> buscar(TenantId tenant, String id);

    Empresa salvar(TenantId tenant, Empresa empresa);

    String novoId();
}
