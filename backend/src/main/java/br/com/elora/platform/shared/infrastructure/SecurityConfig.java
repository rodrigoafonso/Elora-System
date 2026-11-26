package br.com.elora.platform.shared.infrastructure;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * API sem estado (stateless): cada requisição traz um JWT do provedor de identidade (OIDC).
 * Sem sessão no servidor = qualquer instância atende qualquer requisição (escala horizontal).
 * Em desenvolvimento (elora.seguranca.desligada=true) tudo é liberado.
 */
@Configuration(proxyBeanMethods = false)
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http, @Value("${elora.seguranca.desligada:false}") boolean desligada) throws Exception {
        http.csrf(c -> c.disable()).cors(Customizer.withDefaults())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> {
                    a.requestMatchers("/actuator/health/**", "/actuator/info", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                    // Link público do imóvel (prévia no WhatsApp): sem login, só leitura e registro de abertura.
                    a.requestMatchers(org.springframework.http.HttpMethod.GET, "/i/*").permitAll();
                    // Endereço público das fontes de captação: sites e formulários enviam leads sem login (o código secreto identifica a fonte).
                    a.requestMatchers(org.springframework.http.HttpMethod.POST, "/api/v1/captacao/receber/*").permitAll();
                    a.requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/api/v1/captacao/receber/*").permitAll();
                    if (desligada) a.anyRequest().permitAll();
                    else a.anyRequest().authenticated();
                });
        if (!desligada) http.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
        return http.build();
    }
}
