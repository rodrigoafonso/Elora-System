package br.com.elora.platform.captacao.infrastructure.config;

import br.com.elora.platform.captacao.application.CaptacaoCasosDeUso;
import br.com.elora.platform.captacao.application.port.FonteRepository;
import br.com.elora.platform.captacao.application.port.LeadRecebidoRepository;
import br.com.elora.platform.captacao.infrastructure.persistence.JdbcFonteRepository;
import br.com.elora.platform.captacao.infrastructure.persistence.JdbcLeadRecebidoRepository;
import br.com.elora.platform.shared.domain.Relogio;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Composição do módulo Captação. O endereço público aceita envio de qualquer site (CORS aberto só para ele, sem cookies). */
@Configuration(proxyBeanMethods = false)
public class CaptacaoConfig {

    @Bean
    FonteRepository fonteRepository(JdbcClient jdbc) {
        return new JdbcFonteRepository(jdbc);
    }

    @Bean
    LeadRecebidoRepository leadRecebidoRepository(JdbcClient jdbc) {
        return new JdbcLeadRecebidoRepository(jdbc);
    }

    @Bean
    CaptacaoCasosDeUso captacaoCasosDeUso(FonteRepository fontes, LeadRecebidoRepository recebidos, Relogio relogio) {
        return new Transacional(fontes, recebidos, relogio);
    }

    @Bean
    WebMvcConfigurer corsDaCaptacao() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry r) {
                r.addMapping("/api/v1/captacao/receber/**").allowedOrigins("*").allowedMethods("POST", "OPTIONS").allowedHeaders("Content-Type").allowCredentials(false);
            }
        };
    }

    @Transactional
    static class Transacional extends CaptacaoCasosDeUso {
        Transacional(FonteRepository fontes, LeadRecebidoRepository recebidos, Relogio relogio) {
            super(fontes, recebidos, relogio);
        }
    }
}
