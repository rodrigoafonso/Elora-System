package br.com.elora.platform.captacao.application.port;

import br.com.elora.platform.captacao.domain.LeadRecebido;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface LeadRecebidoRepository {
    long salvar(TenantId t, LeadRecebido l);

    /** Último lead recebido (não descartado) com o mesmo telefone ou e-mail, desde a data. */
    Optional<Long> mesmoContato(TenantId t, String chaveTelefone, String email, Instant desde);

    int recebidosDaFonteDesde(TenantId t, String fonteId, Instant desde);

    List<LeadRecebido> listar(TenantId t, String situacao, int limite);

    void marcar(TenantId t, long id, String situacao);
}
