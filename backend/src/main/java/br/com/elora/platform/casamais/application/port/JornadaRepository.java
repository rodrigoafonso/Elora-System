package br.com.elora.platform.casamais.application.port;

import br.com.elora.platform.casamais.domain.ClienteEmJornada;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface JornadaRepository {
    /** Compras dos últimos 180 dias e locações iniciadas nos últimos 90, a partir de "hoje". */
    List<ClienteEmJornada> listar(TenantId tenant, LocalDate hoje);

    Optional<ClienteEmJornada> buscar(TenantId tenant, PerfilCliente perfil, String referencia);
}
