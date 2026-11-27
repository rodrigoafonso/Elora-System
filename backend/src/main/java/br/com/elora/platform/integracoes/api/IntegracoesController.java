package br.com.elora.platform.integracoes.api;

import br.com.elora.platform.integracoes.application.Integracoes;
import br.com.elora.platform.integracoes.domain.SituacaoCanal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/integracoes")
@Tag(name = "Integrações", description = "Situação de cada canal externo. Nunca devolve valores de credenciais.")
public class IntegracoesController {
    private final Integracoes integracoes;

    public IntegracoesController(Integracoes integracoes) {
        this.integracoes = integracoes;
    }

    public record CanalDto(String canal, String nome, SituacaoCanal situacao, List<String> faltando, String comoConectar) {}

    @GetMapping
    @Operation(summary = "Lista os canais, se estão em demonstração e o que falta para conectar")
    public List<CanalDto> listar() {
        return integracoes.todos().stream().map(c -> new CanalDto(c.canal(), c.nome(), c.situacao(), c.faltando(), c.comoConectar())).toList();
    }
}
