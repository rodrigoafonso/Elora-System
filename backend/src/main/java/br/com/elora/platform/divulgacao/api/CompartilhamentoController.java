package br.com.elora.platform.divulgacao.api;

import br.com.elora.platform.divulgacao.application.DivulgacaoCasosDeUso;
import br.com.elora.platform.divulgacao.domain.TokenDeEnvio;
import br.com.elora.platform.divulgacao.domain.Visitante;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.nio.charset.StandardCharsets;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

/** Link público do imóvel (sem login): prévia para o WhatsApp e registro de abertura. */
@RestController
@Tag(name = "Divulgação", description = "Link do imóvel com prévia e aviso de abertura")
public class CompartilhamentoController {
    private static final MediaType HTML = new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8);
    private final DivulgacaoCasosDeUso casos;
    private final PaginaDePrevia pagina;

    public CompartilhamentoController(DivulgacaoCasosDeUso casos, PaginaDePrevia pagina) {
        this.casos = casos;
        this.pagina = pagina;
    }

    @GetMapping(value = "/i/{codigo}", produces = MediaType.TEXT_HTML_VALUE)
    @Operation(summary = "Página do link: metatags Open Graph para a prévia e redirecionamento ao site. Robôs de prévia não contam como abertura.")
    public ResponseEntity<String> abrir(@PathVariable String codigo, @RequestParam(name = "e", required = false) String token,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent, UriComponentsBuilder base) {
        var r = casos.abrir(codigo, token, new Visitante(userAgent));
        // Cada abertura precisa chegar ao servidor: nada de cache intermediário.
        CacheControl semCache = CacheControl.noStore();
        if (r.previa().isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).cacheControl(semCache).contentType(HTML).body(pagina.naoEncontrado());
        String url = pagina.link(base.toUriString(), r.previa().get().codigo(), TokenDeEnvio.valido(token) ? token : null);
        return ResponseEntity.ok().cacheControl(semCache).header("Referrer-Policy", "no-referrer").header("X-Robots-Tag", "noindex")
                .contentType(HTML).body(pagina.html(r.previa().get(), url));
    }
}
