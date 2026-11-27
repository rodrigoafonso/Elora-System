package br.com.elora.platform.aprovacoes.infrastructure.config;

import br.com.elora.platform.aprovacoes.application.AprovacoesCasosDeUso;
import br.com.elora.platform.aprovacoes.application.port.AprovacaoRepository;
import br.com.elora.platform.aprovacoes.infrastructure.persistence.JdbcAprovacaoRepository;
import br.com.elora.platform.integracoes.application.Integracoes;
import br.com.elora.platform.integracoes.infrastructure.CanaisPadrao;
import br.com.elora.platform.shared.domain.Relogio;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

/** Composição da fila de aprovação e do catálogo de integrações (credenciais lidas só de variáveis de ambiente). */
@Configuration(proxyBeanMethods = false)
public class AprovacoesConfig {

    @Bean
    Integracoes integracoes(Environment env) {
        return new Integracoes(CanaisPadrao.padrao(env::getProperty));
    }

    @Bean
    AprovacaoRepository aprovacaoRepository(JdbcClient jdbc) {
        return new JdbcAprovacaoRepository(jdbc);
    }

    @Bean
    AprovacoesCasosDeUso aprovacoesCasosDeUso(AprovacaoRepository repo, Integracoes integracoes, Relogio relogio) {
        return new Transacional(repo, integracoes, relogio);
    }

    @Transactional
    static class Transacional extends AprovacoesCasosDeUso {
        Transacional(AprovacaoRepository repo, Integracoes integracoes, Relogio relogio) {
            super(repo, integracoes, relogio);
        }
    }
}
