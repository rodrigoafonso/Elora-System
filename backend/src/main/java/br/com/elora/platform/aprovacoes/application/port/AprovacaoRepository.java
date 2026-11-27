package br.com.elora.platform.aprovacoes.application.port;

import br.com.elora.platform.aprovacoes.domain.Aprovacao;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface AprovacaoRepository {
    void salvar(TenantId t, Aprovacao a);

    void atualizar(TenantId t, Aprovacao a);

    Optional<Aprovacao> porId(TenantId t, String id);

    List<Aprovacao> listar(TenantId t, Aprovacao.Situacao situacao, int limite);

    /** Trilha de auditoria: quem fez o quê e quando (sem senha nem token). */
    void registrarEvento(TenantId t, String aprovacaoId, String acao, String quem, String detalhe, Instant em);

    record Evento(String acao, String quem, String detalhe, Instant em) {}

    List<Evento> eventos(TenantId t, String aprovacaoId);
}
