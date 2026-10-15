package br.com.elora.platform.shared.infrastructure;

import br.com.elora.platform.shared.api.TenantArgumentResolver;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration(proxyBeanMethods = false)
public class WebConfig implements WebMvcConfigurer {
    private final boolean aceitarCabecalhoDeTenant;

    public WebConfig(@Value("${elora.tenant.aceitar-cabecalho:false}") boolean aceitarCabecalhoDeTenant) {
        this.aceitarCabecalhoDeTenant = aceitarCabecalhoDeTenant;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(new TenantArgumentResolver(aceitarCabecalhoDeTenant));
    }
}
