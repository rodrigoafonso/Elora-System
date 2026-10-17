package br.com.elora.platform.divulgacao.infrastructure.config;

import br.com.elora.platform.divulgacao.api.PaginaDePrevia;
import br.com.elora.platform.divulgacao.application.DivulgacaoCasosDeUso;
import br.com.elora.platform.divulgacao.application.port.EnvioRepository;
import br.com.elora.platform.divulgacao.application.port.ImoveisPublicos;
import br.com.elora.platform.divulgacao.infrastructure.persistence.JdbcEnvioRepository;
import br.com.elora.platform.divulgacao.infrastructure.persistence.JdbcImoveisPublicos;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

/**
 * Composição do módulo Divulgação.
 * elora.site.url: endereço do site público (para onde o link leva o cliente).
 * elora.publico.tenant-padrao: imobiliária dos links sem código de envio (enquanto houver um site por imobiliária).
 */
@Configuration(proxyBeanMethods = false)
public class DivulgacaoConfig {

    @Bean
    EnvioRepository envioRepository(JdbcClient jdbc) {
        return new JdbcEnvioRepository(jdbc);
    }

    @Bean
    ImoveisPublicos imoveisPublicos(JdbcClient jdbc) {
        return new JdbcImoveisPublicos(jdbc);
    }

    @Bean
    DivulgacaoCasosDeUso divulgacaoCasosDeUso(EnvioRepository envios, ImoveisPublicos imoveis, Relogio relogio,
            @Value("${elora.publico.tenant-padrao:elora}") String tenantPadrao) {
        return new Transacional(envios, imoveis, relogio, new TenantId(tenantPadrao));
    }

    @Bean
    PaginaDePrevia paginaDePrevia(@Value("${elora.site.url:}") String site,
            @Value("${elora.site.nome:Elora Inteligência Imobiliária}") String nome, @Value("${elora.site.imagem-padrao:}") String imagemPadrao) {
        return new PaginaDePrevia(site, nome, imagemPadrao);
    }

    @Transactional
    static class Transacional extends DivulgacaoCasosDeUso {
        Transacional(EnvioRepository envios, ImoveisPublicos imoveis, Relogio relogio, TenantId tenantPadrao) {
            super(envios, imoveis, relogio, tenantPadrao);
        }
    }
}
