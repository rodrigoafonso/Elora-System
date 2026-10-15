package br.com.elora.platform.shared.infrastructure;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Documentação da API em /swagger-ui.html (contrato para o front-end e integrações). */
@Configuration(proxyBeanMethods = false)
public class OpenApiConfig {
    @Bean
    OpenAPI eloraOpenApi() {
        return new OpenAPI().info(new Info().title("Elora Partner OS API").version("v1")
                .description("API da plataforma Elora. Todas as rotas exigem a imobiliária (claim \"tenant\" do token)."));
    }
}
