package br.com.elora.platform.divulgacao.application.port;

import br.com.elora.platform.divulgacao.domain.PreviaDoImovel;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.Optional;

/** Leitura dos dados públicos do imóvel (cadastro do núcleo). */
public interface ImoveisPublicos {
    Optional<PreviaDoImovel> porId(TenantId t, String imovelId);

    Optional<PreviaDoImovel> porCodigo(TenantId t, String codigo);

    boolean corretorExiste(TenantId t, String corretorId);
}
