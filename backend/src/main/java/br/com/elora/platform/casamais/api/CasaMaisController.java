package br.com.elora.platform.casamais.api;

import br.com.elora.platform.casamais.api.CasaMaisDtos.CancelamentoRequest;
import br.com.elora.platform.casamais.api.CasaMaisDtos.JornadaDto;
import br.com.elora.platform.casamais.api.CasaMaisDtos.MargemRequest;
import br.com.elora.platform.casamais.api.CasaMaisDtos.NovoPedidoRequest;
import br.com.elora.platform.casamais.api.CasaMaisDtos.OrcamentoRequest;
import br.com.elora.platform.casamais.api.CasaMaisDtos.ParceiroDto;
import br.com.elora.platform.casamais.api.CasaMaisDtos.ParceiroRequest;
import br.com.elora.platform.casamais.api.CasaMaisDtos.PedidoDto;
import br.com.elora.platform.casamais.api.CasaMaisDtos.RegrasDto;
import br.com.elora.platform.casamais.application.CasaMaisCasosDeUso;
import br.com.elora.platform.casamais.application.Comandos;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.shared.api.TenantAtual;
import br.com.elora.platform.shared.domain.Dinheiro;
import br.com.elora.platform.shared.domain.TenantId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
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

/** Adaptador HTTP do Elora Casa+. Só traduz JSON ⇄ comandos; nenhuma regra de negócio aqui. */
@RestController
@RequestMapping("/api/v1/casamais")
@Tag(name = "Elora Casa+", description = "Marketplace de serviços depois das chaves")
public class CasaMaisController {
    private final CasaMaisCasosDeUso casos;

    public CasaMaisController(CasaMaisCasosDeUso casos) {
        this.casos = casos;
    }

    @GetMapping("/pedidos")
    @Operation(summary = "Pedidos de serviço da imobiliária (mais recentes primeiro)")
    public List<PedidoDto> pedidos(@TenantAtual TenantId t) {
        return casos.listarPedidos(t).stream().map(PedidoDto::de).toList();
    }

    @PostMapping("/pedidos")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Registra um pedido em nome de um cliente em jornada")
    public PedidoDto novoPedido(@TenantAtual TenantId t, @Valid @RequestBody NovoPedidoRequest r) {
        return PedidoDto.de(casos.registrarPedido(t, new Comandos.NovoPedido(CasaMaisDtos.categoria(r.categoria()), r.subservico(), r.urgente(),
                PerfilCliente.daChave(r.cliente().perfil()), r.cliente().referencia(), r.descricao(), r.preferenciaEm())));
    }

    @PostMapping("/pedidos/{id}/orcamento")
    public PedidoDto orcamento(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody OrcamentoRequest r) {
        return PedidoDto.de(casos.registrarOrcamento(t, new Comandos.NovoOrcamento(id, r.parceiroId(), Dinheiro.deReais(r.valor()), r.prazo(), r.observacao())));
    }

    @PostMapping("/pedidos/{id}/aprovacao")
    public PedidoDto aprovacao(@TenantAtual TenantId t, @PathVariable String id) {
        return PedidoDto.de(casos.aprovar(t, id));
    }

    @PostMapping("/pedidos/{id}/conclusao")
    public PedidoDto conclusao(@TenantAtual TenantId t, @PathVariable String id) {
        return PedidoDto.de(casos.concluir(t, id));
    }

    @PostMapping("/pedidos/{id}/margem")
    @Operation(summary = "Registra a margem efetivamente recebida do parceiro (congela fundo% e corretor%)")
    public PedidoDto margem(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody MargemRequest r) {
        return PedidoDto.de(casos.registrarMargem(t, new Comandos.MargemRecebida(id, Dinheiro.deReais(r.valor()), r.recebidaEm())));
    }

    @PostMapping("/pedidos/{id}/cancelamento")
    public PedidoDto cancelamento(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody CancelamentoRequest r) {
        return PedidoDto.de(casos.cancelar(t, id, r.motivo()));
    }

    @GetMapping("/parceiros")
    public List<ParceiroDto> parceiros(@TenantAtual TenantId t) {
        return casos.listarParceiros(t).stream().map(ParceiroDto::de).toList();
    }

    @PostMapping("/parceiros")
    @ResponseStatus(HttpStatus.CREATED)
    public ParceiroDto novoParceiro(@TenantAtual TenantId t, @Valid @RequestBody ParceiroRequest r) {
        return ParceiroDto.de(casos.salvarParceiro(t, comando(null, r)));
    }

    @PutMapping("/parceiros/{id}")
    public ParceiroDto parceiro(@TenantAtual TenantId t, @PathVariable String id, @Valid @RequestBody ParceiroRequest r) {
        return ParceiroDto.de(casos.salvarParceiro(t, comando(id, r)));
    }

    @GetMapping("/regras")
    public RegrasDto regras(@TenantAtual TenantId t) {
        return RegrasDto.de(casos.obterRegras(t));
    }

    @PutMapping("/regras")
    public RegrasDto salvarRegras(@TenantAtual TenantId t, @Valid @RequestBody RegrasDto r) {
        return RegrasDto.de(casos.salvarRegras(t, new Comandos.NovasRegras(r.corretorPct(), r.fundoBoaIdeiaPct(), Dinheiro.deReais(r.taxaPlugPlay()))));
    }

    @GetMapping("/jornadas")
    @Operation(summary = "Clientes em jornada: compras dos últimos 180 dias e locações dos últimos 90")
    public List<JornadaDto> jornadas(@TenantAtual TenantId t) {
        return casos.listarJornadas(t).stream().map(JornadaDto::de).toList();
    }

    private static Comandos.DadosParceiro comando(String id, ParceiroRequest r) {
        return new Comandos.DadosParceiro(id, r.nome(), r.categorias().stream().map(CasaMaisDtos::categoria).collect(Collectors.toSet()),
                r.comissaoPct(), r.whatsapp(), r.cidades(), r.prazo(), r.apresentacao(), r.ativo());
    }
}
