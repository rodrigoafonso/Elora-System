package br.com.elora.platform.casamais.application.port;

import br.com.elora.platform.casamais.domain.RegrasCasaMais;
import br.com.elora.platform.shared.domain.TenantId;

public interface RegrasRepository {
    /** Regras da imobiliária; as padrão quando ainda não houver cadastro. */
    RegrasCasaMais obter(TenantId tenant);

    RegrasCasaMais salvar(TenantId tenant, RegrasCasaMais regras);
}
