package br.com.elora.platform.shared.api;

import br.com.elora.platform.shared.domain.RegraVioladaException;
import br.com.elora.platform.shared.domain.TenantId;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Resolve o tenant. Com login (JWT), vale SEMPRE a claim do token — o cabeçalho é ignorado,
 * para que ninguém leia dados de outra imobiliária trocando o cabeçalho.
 */
public class TenantArgumentResolver implements HandlerMethodArgumentResolver {
    public static final String CABECALHO = "X-Tenant-Id";
    private final boolean aceitarCabecalho;

    public TenantArgumentResolver(boolean aceitarCabecalho) {
        this.aceitarCabecalho = aceitarCabecalho;
    }

    @Override
    public boolean supportsParameter(MethodParameter p) {
        return p.hasParameterAnnotation(TenantAtual.class) && p.getParameterType() == TenantId.class;
    }

    @Override
    public Object resolveArgument(MethodParameter p, ModelAndViewContainer m, NativeWebRequest req, WebDataBinderFactory f) {
        if (SecurityContextHolder.getContext().getAuthentication() instanceof JwtAuthenticationToken jwt) {
            String claim = jwt.getToken().getClaimAsString("tenant");
            if (claim != null) return new TenantId(claim);
        }
        String cabecalho = req.getHeader(CABECALHO);
        if (aceitarCabecalho && cabecalho != null) return new TenantId(cabecalho);
        throw new RegraVioladaException("Imobiliária não identificada.");
    }
}
