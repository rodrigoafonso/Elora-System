package br.com.elora.platform.divulgacao.api;

import br.com.elora.platform.divulgacao.application.DivulgacaoCasosDeUso;
import br.com.elora.platform.divulgacao.application.DivulgacaoCasosDeUso.NovoEnvio;
import br.com.elora.platform.divulgacao.domain.Envio;
import br.com.elora.platform.shared.api.TenantAtual;
import br.com.elora.platform.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/divulgacao")
@Tag(name = "Divulgação", description = "Link do imóvel com prévia e aviso de abertura")
public class DivulgacaoController {
    private final DivulgacaoCasosDeUso casos;
    private final PaginaDePrevia pagina;

    public DivulgacaoController(DivulgacaoCasosDeUso casos, PaginaDePrevia pagina) {
        this.casos = casos;
        this.pagina = pagina;
    }

    public record EnvioRequest(@NotBlank String imovelId, @Size(max = 60) String leadRef, @Size(max = 80) String leadNome, String corretorId) {}

    public record EnvioDto(String token, String url, String imovelId, String imovelCodigo, String leadRef, String leadNome, String corretorId,
            Instant criadoEm, int aberturas, Instant ultimaAbertura) {}

    @PostMapping("/envios")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria (ou devolve) o link do imóvel para um cliente. O mesmo cliente recebe sempre o mesmo link.")
    public EnvioDto criar(@TenantAtual TenantId t, @Valid @RequestBody EnvioRequest r) {
        return dto(casos.criarEnvio(t, new NovoEnvio(r.imovelId(), r.leadRef(), r.leadNome(), r.corretorId())));
    }

    @GetMapping("/envios")
    @Operation(summary = "Envios com o número de aberturas (filtros opcionais: imóvel e corretor)")
    public List<EnvioDto> listar(@TenantAtual TenantId t, @RequestParam(required = false) String imovelId, @RequestParam(required = false) String corretorId) {
        return casos.listar(t, imovelId, corretorId).stream().map(this::dto).toList();
    }

    private EnvioDto dto(Envio e) {
        String url = pagina.link(ServletUriComponentsBuilder.fromCurrentContextPath().toUriString(), e.imovelCodigo(), e.token());
        return new EnvioDto(e.token(), url, e.imovelId(), e.imovelCodigo(), e.leadRef(), e.leadNome(), e.corretorId(), e.criadoEm(), e.aberturas().size(),
                e.ultimaAbertura());
    }
}
