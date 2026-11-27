package br.com.elora.platform.aprovacoes.api;

import br.com.elora.platform.aprovacoes.application.AprovacoesCasosDeUso;
import br.com.elora.platform.aprovacoes.application.AprovacoesCasosDeUso.NovoPedido;
import br.com.elora.platform.aprovacoes.application.port.AprovacaoRepository.Evento;
import br.com.elora.platform.aprovacoes.domain.Aprovacao;
import br.com.elora.platform.shared.api.TenantAtual;
import br.com.elora.platform.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/aprovacoes")
@Tag(name = "Aprovações", description = "Fila de aprovação: mensagens, publicações, pagamentos e campanhas só saem depois da decisão de uma pessoa")
public class AprovacoesController {
    private final AprovacoesCasosDeUso casos;

    public AprovacoesController(AprovacoesCasosDeUso casos) {
        this.casos = casos;
    }

    public record PedidoRequest(@NotBlank String tipo, @NotBlank String canal, @NotBlank @Size(max = 120) String titulo, @NotBlank @Size(max = 4000) String conteudo,
            @Size(max = 200) String destino, @Size(max = 80) String referencia, @NotBlank @Size(max = 60) String pedidoPor) {}

    public record DecisaoRequest(@NotBlank @Size(max = 60) String quem, @Size(max = 4000) String texto, @Size(max = 300) String motivo) {}

    public record ExecucaoRequest(@NotBlank @Size(max = 60) String quem) {}

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria um pedido de aprovação (nada é enviado)")
    public Aprovacao pedir(@TenantAtual TenantId t, @Valid @RequestBody PedidoRequest r) {
        return casos.pedir(t, new NovoPedido(r.tipo(), r.canal(), r.titulo(), r.conteudo(), r.destino(), r.referencia(), r.pedidoPor()));
    }

    @GetMapping
    @Operation(summary = "Lista os pedidos (filtro opcional por situação: PENDENTE, APROVADA, RECUSADA, ENVIADA)")
    public List<Aprovacao> listar(@TenantAtual TenantId t, @RequestParam(required = false) Aprovacao.Situacao situacao) {
        return casos.listar(t, situacao);
    }

    @PostMapping("/{id}/aprovar")
    @Operation(summary = "Aprova (o texto pode ser ajustado; o aprovado é guardado exatamente)")
    public Aprovacao aprovar(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody DecisaoRequest r) {
        return casos.aprovar(t, id, r.quem(), r.texto());
    }

    @PostMapping("/{id}/recusar")
    @Operation(summary = "Recusa com motivo")
    public Aprovacao recusar(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody DecisaoRequest r) {
        return casos.recusar(t, id, r.quem(), r.motivo());
    }

    @PostMapping("/{id}/executar")
    @Operation(summary = "Envia um pedido aprovado pelo canal. Canal não conectado responde em modo demonstração: nada sai.")
    public Aprovacao executar(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody ExecucaoRequest r) {
        return casos.executar(t, id, r.quem());
    }

    @GetMapping("/{id}/historico")
    @Operation(summary = "Trilha de auditoria do pedido")
    public List<Evento> historico(@TenantAtual TenantId t, @PathVariable String id) {
        return casos.historico(t, id);
    }
}
