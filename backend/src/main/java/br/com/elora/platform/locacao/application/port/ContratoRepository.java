package br.com.elora.platform.locacao.application.port;

import br.com.elora.platform.locacao.domain.ContratoLocacao;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

public interface ContratoRepository {
    List<ContratoLocacao> listar(TenantId tenant);

    Optional<ContratoLocacao> buscar(TenantId tenant, String id);

    /** Há outro contrato ativo para o imóvel (ignorando o próprio contrato em edição)? */
    boolean imovelTemOutroAtivo(TenantId tenant, String imovelId, String excetoContratoId);

    /** Grava dados e reajustes novos, com concorrência otimista. planoId é obrigatório para contrato ativo. */
    ContratoLocacao salvar(TenantId tenant, ContratoLocacao contrato, String planoId);

    String novoId();
}
