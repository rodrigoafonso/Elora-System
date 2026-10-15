package br.com.elora.platform.locacao.infrastructure.config;

import br.com.elora.platform.locacao.application.LocacaoCasosDeUso;
import br.com.elora.platform.locacao.application.port.CadastrosLocacao;
import br.com.elora.platform.locacao.application.port.ContratoRepository;
import br.com.elora.platform.locacao.infrastructure.persistence.JdbcCadastrosLocacao;
import br.com.elora.platform.locacao.infrastructure.persistence.JdbcContratoRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

/** Composição do módulo Locação (mesmo padrão do Casa+). */
@Configuration(proxyBeanMethods = false)
public class LocacaoConfig {

    @Bean
    ContratoRepository contratoRepository(JdbcClient jdbc) {
        return new JdbcContratoRepository(jdbc);
    }

    @Bean
    CadastrosLocacao cadastrosLocacao(JdbcClient jdbc) {
        return new JdbcCadastrosLocacao(jdbc);
    }

    @Bean
    LocacaoCasosDeUso locacaoCasosDeUso(ContratoRepository contratos, CadastrosLocacao cadastros) {
        return new Transacional(contratos, cadastros);
    }

    @Transactional
    static class Transacional extends LocacaoCasosDeUso {
        Transacional(ContratoRepository contratos, CadastrosLocacao cadastros) {
            super(contratos, cadastros);
        }
    }
}
