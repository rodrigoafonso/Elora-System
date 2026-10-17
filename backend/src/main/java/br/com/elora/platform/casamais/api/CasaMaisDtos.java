package br.com.elora.platform.casamais.api;

import br.com.elora.platform.casamais.domain.Categoria;
import br.com.elora.platform.casamais.domain.ClienteEmJornada;
import br.com.elora.platform.casamais.domain.Empresa;
import br.com.elora.platform.casamais.domain.ItemPacote;
import br.com.elora.platform.casamais.domain.Pacote;
import br.com.elora.platform.casamais.domain.Parceiro;
import br.com.elora.platform.casamais.domain.PedidoServico;
import br.com.elora.platform.casamais.domain.RegrasCasaMais;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Contratos JSON da API do Casa+ (espelham os esquemas zod do front-end: frontend/src/infrastructure/casamais/esquemas.ts).
 * Valores em reais com 2 casas; datas em ISO-8601. Campos nulos não são enviados.
 */
public final class CasaMaisDtos {
    private CasaMaisDtos() {}

    private static final String CATEGORIAS = "plugplay|manutencao|assistencia|mudanca|limpeza|moveis|clima|seguranca|jardim|juridico|reforma|administracao";

    // ---------- Respostas ----------
    public record ClienteDto(String perfil, String referencia, String nome, String telefone) {}

    public record OrcamentoDto(BigDecimal valor, String prazo, String observacao, LocalDate em) {}

    public record AvaliacaoDto(int nota, String comentario, LocalDate em) {}

    public record PedidoDto(
            String id, String categoria, String subservico, boolean urgente, String parceiroId, ClienteDto cliente, String imovelId,
            String corretorId, String corretorNome, String descricao, LocalDate preferenciaEm, String status, Instant criadoEm,
            LocalDate aprovadoEm, LocalDate executadoEm, OrcamentoDto orcamento, BigDecimal margemPct, BigDecimal margemRecebida,
            LocalDate recebidaEm, BigDecimal corretorPct, BigDecimal fundoPct, AvaliacaoDto avaliacao, String pacoteId) {

        static PedidoDto de(PedidoServico p) {
            var d = p.dados();
            var o = d.orcamento();
            var a = d.avaliacao();
            return new PedidoDto(d.id(), d.categoria().chave(), d.subservico(), d.urgente(), d.parceiroId(),
                    new ClienteDto(d.cliente().perfil().chave(), d.cliente().referencia(), d.cliente().nome(), d.cliente().telefone()),
                    d.imovelRef(), d.corretorRef(), d.corretorNome(), d.descricao(), d.preferenciaEm(), d.status().chave(), d.criadoEm(),
                    d.aprovadoEm(), d.executadoEm(), o == null ? null : new OrcamentoDto(o.valor().emReais(), o.prazo(), o.observacao(), o.em()),
                    d.margemPct(), d.margemRecebida() == null ? null : d.margemRecebida().emReais(), d.recebidaEm(), d.corretorPct(),
                    d.fundoPct(), a == null ? null : new AvaliacaoDto(a.nota(), a.comentario(), a.em()), d.pacoteId());
        }
    }

    public record ParceiroDto(String id, String nome, List<String> categorias, BigDecimal comissaoPct, String whatsapp, String cidades,
                              String prazo, String apresentacao, boolean ativo) {
        static ParceiroDto de(Parceiro p) {
            return new ParceiroDto(p.id(), p.nome(), p.chavesDasCategorias(), p.comissaoPct(), p.whatsapp(), p.cidades(), p.prazo(),
                    p.apresentacao(), p.ativo());
        }
    }

    public record RegrasDto(@NotNull BigDecimal corretorPct, @NotNull BigDecimal fundoBoaIdeiaPct, @NotNull BigDecimal taxaPlugPlay) {
        static RegrasDto de(RegrasCasaMais r) {
            return new RegrasDto(r.corretorPct(), r.fundoBoaIdeiaPct(), r.taxaPlugPlay().emReais());
        }
    }

    public record JornadaDto(String perfil, String referencia, String nome, String telefone, String imovelId, String corretorId,
                             String corretorNome, LocalDate desde, String rotulo, int pedidos) {
        static JornadaDto de(ClienteEmJornada j) {
            return new JornadaDto(j.perfil().chave(), j.referencia(), j.nome(), j.telefone(), j.imovelRef(), j.corretorRef(),
                    j.corretorNome(), j.desde(), j.rotulo(), j.pedidos());
        }
    }

    public record PacoteDto(
            String id, String tipo, ClienteDto cliente, String empresaId, String imovelId, String corretorId, String corretorNome, LocalDate data,
            String origem, int pessoas, boolean pet, String observacao, String buscaImovel, List<String> itens, List<String> pedidos,
            LocalDate guiaEnviadoEm, Instant criadoEm) {
        static PacoteDto de(Pacote pk) {
            var c = pk.cliente();
            return new PacoteDto(pk.id(), "chegada", new ClienteDto(c.perfil().chave(), c.referencia(), c.nome(), c.telefone()), pk.empresaId(),
                    pk.imovelRef(), pk.corretorRef(), pk.corretorNome(), pk.data(), pk.origem(), pk.pessoas(), pk.pet(), pk.observacao(),
                    pk.buscaImovel(), pk.itens().stream().map(ItemPacote::chave).toList(), pk.pedidos(), pk.guiaEnviadoEm(), pk.criadoEm());
        }
    }

    public record EmpresaDto(String id, String nome, String cidade, String contato, String whatsapp, String email, String auxilio, String observacao) {
        static EmpresaDto de(Empresa e) {
            return new EmpresaDto(e.id(), e.nome(), e.cidade(), e.contato(), e.whatsapp(), e.email(), e.auxilio(), e.observacao());
        }
    }

    // ---------- Requisições ----------
    private static final String ITENS = "plugplay|limpeza|mudanca|montagem|instalacao|clima|guia";

    public record ClientePacote(@NotNull @Pattern(regexp = "proprietario|inquilino|comprador|empresa") String perfil,
                                @NotBlank @Size(max = 60) String referencia, @Size(max = 100) String nome, @Size(max = 30) String telefone) {}

    public record NovoPacoteRequest(
            @NotNull @Valid ClientePacote cliente, @NotNull LocalDate data, @Size(max = 80) String origem, int pessoas, boolean pet,
            boolean gasEncanado, @Size(max = 400) String observacao, @Pattern(regexp = "Locação|Compra") String buscaImovel,
            @NotEmpty List<@Pattern(regexp = ITENS) String> itens) {}

    public record EmpresaRequest(@NotBlank @Size(max = 100) String nome, @Size(max = 80) String cidade, @Size(max = 80) String contato,
                                 @Size(max = 30) String whatsapp, @Size(max = 120) String email, @Size(max = 80) String auxilio,
                                 @Size(max = 400) String observacao) {}

    public record ClienteRef(@NotNull @Pattern(regexp = "proprietario|inquilino|comprador") String perfil, @NotBlank @Size(max = 60) String referencia) {}

    public record NovoPedidoRequest(
            @NotNull @Pattern(regexp = CATEGORIAS) String categoria, @Size(max = 80) String subservico, boolean urgente,
            @NotNull @Valid ClienteRef cliente, @NotBlank @Size(max = 500) String descricao, LocalDate preferenciaEm) {}

    public record OrcamentoRequest(@NotBlank String parceiroId, @NotNull @DecimalMin("0.01") BigDecimal valor, @Size(max = 60) String prazo,
                                   @Size(max = 160) String observacao) {}

    public record MargemRequest(@NotNull @DecimalMin("0.01") BigDecimal valor, @NotNull LocalDate recebidaEm) {}

    public record CancelamentoRequest(@Size(max = 200) String motivo) {}

    public record ParceiroRequest(
            @NotBlank @Size(max = 80) String nome, @NotEmpty List<@Pattern(regexp = CATEGORIAS) String> categorias,
            @NotNull BigDecimal comissaoPct, @Size(max = 30) String whatsapp, @Size(max = 80) String cidades, @Size(max = 40) String prazo,
            @Size(max = 160) String apresentacao, boolean ativo) {}

    static Categoria categoria(String chave) {
        return Categoria.daChave(chave).orElseThrow(() -> new IllegalArgumentException("Categoria inválida."));
    }
}
