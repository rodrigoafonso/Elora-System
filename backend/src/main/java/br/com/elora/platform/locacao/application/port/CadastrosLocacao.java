package br.com.elora.platform.locacao.application.port;

import br.com.elora.platform.locacao.domain.Resumos;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/** Leitura de cadastros de outros módulos (imóveis, pessoas, corretores e plano de remuneração). */
public interface CadastrosLocacao {
    List<Resumos.Imovel> imoveis(TenantId tenant);

    List<Resumos.Pessoa> locatarios(TenantId tenant);

    List<Resumos.Pessoa> corretores(TenantId tenant);

    Optional<Resumos.Imovel> imovel(TenantId tenant, String id);

    boolean locatarioExiste(TenantId tenant, String id);

    /** Plano de remuneração vigente no início do contrato, conforme o nível do corretor de origem do imóvel. */
    Optional<String> planoVigente(TenantId tenant, String imovelId, LocalDate inicio);
}
