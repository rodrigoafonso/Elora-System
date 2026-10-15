package br.com.elora.platform.locacao.api;

import br.com.elora.platform.locacao.api.LocacaoDtos.ContratoDto;
import br.com.elora.platform.locacao.api.LocacaoDtos.ContratoRequest;
import br.com.elora.platform.locacao.api.LocacaoDtos.ImovelDto;
import br.com.elora.platform.locacao.api.LocacaoDtos.PessoaDto;
import br.com.elora.platform.locacao.api.LocacaoDtos.ReajusteRequest;
import br.com.elora.platform.locacao.application.LocacaoCasosDeUso;
import br.com.elora.platform.locacao.domain.ContratoLocacao;
import br.com.elora.platform.locacao.domain.Resumos;
import br.com.elora.platform.shared.api.TenantAtual;
import br.com.elora.platform.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/locacao")
@Tag(name = "Locação", description = "Contratos de locação, travas da Lei 8.245/91 e reajustes")
public class LocacaoController {
    private final LocacaoCasosDeUso casos;

    public LocacaoController(LocacaoCasosDeUso casos) {
        this.casos = casos;
    }

    @GetMapping("/contratos")
    public List<ContratoDto> contratos(@TenantAtual TenantId t) {
        Montador m = new Montador(t);
        return casos.listar(t).stream().map(m::dto).toList();
    }

    @PostMapping("/contratos")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Cadastra contrato. Problemas legais voltam todos juntos em \"problemas\" (422).")
    public ContratoDto criar(@TenantAtual TenantId t, @Valid @RequestBody ContratoRequest r) {
        return new Montador(t).dto(casos.criar(t, r.dados()));
    }

    @PutMapping("/contratos/{id}")
    public ContratoDto atualizar(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody ContratoRequest r) {
        return new Montador(t).dto(casos.atualizar(t, id, r.dados()));
    }

    @PostMapping("/contratos/{id}/reajustes")
    @Operation(summary = "Aplica o reajuste anual (Lei 10.192/2001, art. 2º, § 1º)")
    public ContratoDto reajustar(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody ReajusteRequest r) {
        return new Montador(t).dto(casos.reajustar(t, id, r.em(), r.pct(), r.para()));
    }

    @GetMapping("/imoveis")
    public List<ImovelDto> imoveis(@TenantAtual TenantId t) {
        return casos.imoveis(t).stream().map(ImovelDto::de).toList();
    }

    @GetMapping("/locatarios")
    public List<PessoaDto> locatarios(@TenantAtual TenantId t) {
        return casos.locatarios(t).stream().map(PessoaDto::de).toList();
    }

    @GetMapping("/corretores")
    public List<PessoaDto> corretores(@TenantAtual TenantId t) {
        return casos.corretores(t).stream().map(PessoaDto::de).toList();
    }

    /** Junta ao contrato o resumo do imóvel e do locatário (uma consulta por lista, não por contrato). */
    private final class Montador {
        private final Map<String, Resumos.Imovel> imoveis;
        private final Map<String, Resumos.Pessoa> pessoas;

        Montador(TenantId t) {
            imoveis = casos.imoveis(t).stream().collect(Collectors.toMap(Resumos.Imovel::id, Function.identity()));
            pessoas = casos.locatarios(t).stream().collect(Collectors.toMap(Resumos.Pessoa::id, Function.identity()));
        }

        ContratoDto dto(ContratoLocacao c) {
            var d = c.dados();
            return ContratoDto.de(c, imoveis.getOrDefault(d.imovelId(), new Resumos.Imovel(d.imovelId(), "—", "Imóvel", "", "")),
                    pessoas.getOrDefault(d.locatarioId(), new Resumos.Pessoa(d.locatarioId(), "—")));
        }
    }
}
