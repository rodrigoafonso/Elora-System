package br.com.elora.platform.captacao.application.port;

import br.com.elora.platform.captacao.domain.Fonte;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

public interface FonteRepository {
    void salvar(TenantId t, Fonte f, String hashDoCodigo);

    void atualizar(TenantId t, Fonte f);

    void trocarCodigo(TenantId t, String fonteId, String hashDoCodigo);

    Optional<Fonte> porId(TenantId t, String id);

    List<Fonte> listar(TenantId t);

    /** Busca pelo hash do código, sem tenant: é o código que diz de qual imobiliária e de qual fonte é o envio. */
    Optional<FonteDoCodigo> porCodigo(String hashDoCodigo);

    record FonteDoCodigo(TenantId tenant, Fonte fonte) {}

    boolean corretorExiste(TenantId t, String corretorId);
}
