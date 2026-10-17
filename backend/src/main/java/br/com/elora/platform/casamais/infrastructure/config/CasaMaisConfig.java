package br.com.elora.platform.casamais.infrastructure.config;

import br.com.elora.platform.casamais.application.CasaMaisCasosDeUso;
import br.com.elora.platform.casamais.application.port.EmpresaRepository;
import br.com.elora.platform.casamais.application.port.JornadaRepository;
import br.com.elora.platform.casamais.application.port.PacoteRepository;
import br.com.elora.platform.casamais.application.port.ParceiroRepository;
import br.com.elora.platform.casamais.application.port.PedidoServicoRepository;
import br.com.elora.platform.casamais.application.port.RegrasRepository;
import br.com.elora.platform.casamais.infrastructure.persistence.JdbcEmpresaRepository;
import br.com.elora.platform.casamais.infrastructure.persistence.JdbcJornadaRepository;
import br.com.elora.platform.casamais.infrastructure.persistence.JdbcPacoteRepository;
import br.com.elora.platform.casamais.infrastructure.persistence.JdbcParceiroRepository;
import br.com.elora.platform.casamais.infrastructure.persistence.JdbcPedidoServicoRepository;
import br.com.elora.platform.casamais.infrastructure.persistence.JdbcRegrasRepository;
import br.com.elora.platform.shared.domain.Relogio;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

/**
 * Composição do módulo: liga as portas às implementações. Os casos de uso continuam Java puro;
 * a transação é acrescentada aqui, por herança (proxy do Spring).
 */
@Configuration(proxyBeanMethods = false)
public class CasaMaisConfig {

    @Bean
    PedidoServicoRepository pedidoServicoRepository(JdbcClient jdbc) {
        return new JdbcPedidoServicoRepository(jdbc);
    }

    @Bean
    ParceiroRepository parceiroRepository(JdbcClient jdbc) {
        return new JdbcParceiroRepository(jdbc);
    }

    @Bean
    RegrasRepository regrasRepository(JdbcClient jdbc) {
        return new JdbcRegrasRepository(jdbc);
    }

    @Bean
    JornadaRepository jornadaRepository(JdbcClient jdbc) {
        return new JdbcJornadaRepository(jdbc);
    }

    @Bean
    PacoteRepository pacoteRepository(JdbcClient jdbc) {
        return new JdbcPacoteRepository(jdbc);
    }

    @Bean
    EmpresaRepository empresaRepository(JdbcClient jdbc) {
        return new JdbcEmpresaRepository(jdbc);
    }

    @Bean
    CasaMaisCasosDeUso casaMaisCasosDeUso(PedidoServicoRepository p, ParceiroRepository pa, RegrasRepository r, JornadaRepository j,
                                          PacoteRepository pk, EmpresaRepository e, Relogio relogio) {
        return new Transacional(p, pa, r, j, pk, e, relogio);
    }

    /** Transação por caso de uso: o pacote e os pedidos dele são gravados juntos ou nada é gravado. */
    @Transactional
    static class Transacional extends CasaMaisCasosDeUso {
        Transacional(PedidoServicoRepository p, ParceiroRepository pa, RegrasRepository r, JornadaRepository j, PacoteRepository pk,
                     EmpresaRepository e, Relogio relogio) {
            super(p, pa, r, j, pk, e, relogio);
        }
    }
}
