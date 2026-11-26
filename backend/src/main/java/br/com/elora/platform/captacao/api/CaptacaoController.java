package br.com.elora.platform.captacao.api;

import br.com.elora.platform.captacao.application.CaptacaoCasosDeUso;
import br.com.elora.platform.captacao.application.CaptacaoCasosDeUso.FonteCriada;
import br.com.elora.platform.captacao.application.CaptacaoCasosDeUso.NovaFonte;
import br.com.elora.platform.captacao.application.CaptacaoCasosDeUso.Recebimento;
import br.com.elora.platform.captacao.domain.Fonte;
import br.com.elora.platform.captacao.domain.LeadRecebido;
import br.com.elora.platform.shared.api.TenantAtual;
import br.com.elora.platform.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/v1/captacao")
@Tag(name = "Captação", description = "Fontes de captação e o endereço público que recebe leads de sites, portais e formulários")
public class CaptacaoController {
    private final CaptacaoCasosDeUso casos;

    public CaptacaoController(CaptacaoCasosDeUso casos) {
        this.casos = casos;
    }

    public record FonteRequest(@NotBlank @Size(max = 60) String nome, @NotBlank String tipo, @NotBlank String canal, @NotBlank String negocio, String corretorId,
            Boolean ativa) {}

    /** O código e o endereço completos só vêm na criação e na troca de código. */
    public record FonteCriadaDto(Fonte fonte, String codigo, String endereco) {}

    public record RecebidoDto(boolean recebido) {}

    @PostMapping("/fontes")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cria uma fonte. O código secreto aparece só nesta resposta: guarde-o como uma senha.")
    public FonteCriadaDto criar(@TenantAtual TenantId t, @Valid @RequestBody FonteRequest r) {
        return dto(casos.criarFonte(t, new NovaFonte(r.nome(), r.tipo(), r.canal(), r.negocio(), r.corretorId())));
    }

    @PutMapping("/fontes/{id}")
    @Operation(summary = "Altera a fonte (nome, canal, interesse, corretor, ativa)")
    public Fonte alterar(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody FonteRequest r) {
        return casos.alterarFonte(t, id, new NovaFonte(r.nome(), r.tipo(), r.canal(), r.negocio(), r.corretorId()), r.ativa() == null || r.ativa());
    }

    @PostMapping("/fontes/{id}/codigo")
    @Operation(summary = "Gera um código novo para a fonte. O anterior para de funcionar na hora.")
    public FonteCriadaDto trocarCodigo(@TenantAtual TenantId t, @PathVariable String id) {
        return dto(casos.trocarCodigo(t, id));
    }

    @GetMapping("/fontes")
    @Operation(summary = "Fontes da imobiliária (sem os códigos)")
    public List<Fonte> listar(@TenantAtual TenantId t) {
        return casos.listarFontes(t);
    }

    @GetMapping("/recebidos")
    @Operation(summary = "Caixa de entrada: leads recebidos pelas fontes (situação opcional: novo, duplicado, descartado, importado)")
    public List<LeadRecebido> recebidos(@TenantAtual TenantId t, @RequestParam(required = false) String situacao) {
        return casos.caixaDeEntrada(t, situacao);
    }

    @PostMapping("/recebidos/{id}/importado")
    @Operation(summary = "Marca o lead recebido como importado no funil")
    public void importado(@TenantAtual TenantId t, @PathVariable long id) {
        casos.marcarImportado(t, id);
    }

    @PostMapping(path = "/receber/{codigo}", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Operation(summary = "Endereço público da fonte (JSON). Sem login: o código identifica a imobiliária e a fonte.")
    public RecebidoDto receberJson(@PathVariable String codigo, @RequestBody Map<String, Object> corpo) {
        Map<String, String> campos = new LinkedHashMap<>();
        if (corpo != null) corpo.forEach((k, v) -> { if (v != null && !(v instanceof Map) && !(v instanceof List)) campos.put(k, String.valueOf(v)); });
        return resposta(casos.receber(codigo, campos));
    }

    @PostMapping(path = "/receber/{codigo}", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    @ResponseStatus(HttpStatus.ACCEPTED)
    @Operation(summary = "Endereço público da fonte (formulário HTML)")
    public RecebidoDto receberFormulario(@PathVariable String codigo, @RequestParam MultiValueMap<String, String> corpo) {
        Map<String, String> campos = new LinkedHashMap<>();
        corpo.forEach((k, v) -> { if (v != null && !v.isEmpty()) campos.put(k, v.get(0)); });
        return resposta(casos.receber(codigo, campos));
    }

    /** A mesma resposta para lead novo, repetido ou robô: quem envia não descobre o que já existe na base. */
    private static RecebidoDto resposta(Recebimento r) {
        return new RecebidoDto(r.id() > 0);
    }

    private FonteCriadaDto dto(FonteCriada c) {
        String base = ServletUriComponentsBuilder.fromCurrentContextPath().toUriString();
        return new FonteCriadaDto(c.fonte(), c.codigo(), base + "/api/v1/captacao/receber/" + c.codigo());
    }
}
