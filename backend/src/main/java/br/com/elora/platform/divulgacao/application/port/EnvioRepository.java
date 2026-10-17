package br.com.elora.platform.divulgacao.application.port;

import br.com.elora.platform.divulgacao.domain.Envio;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EnvioRepository {
    void salvar(TenantId t, Envio e);

    /** Busca pelo código, sem tenant: é o código que diz de qual imobiliária é o link público. */
    Optional<Envio> porToken(String token);

    Optional<Envio> doCliente(TenantId t, String imovelId, String leadRef);

    List<Envio> listar(TenantId t, String imovelId, String corretorId, int limite);

    void registrarAbertura(String token, String tenant, Instant em, String aparelho);

    /** Tenant dono do código (para o link público). */
    Optional<TenantId> tenantDo(String token);
}
