package br.com.elora.platform.casamais.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import br.com.elora.platform.shared.domain.Dinheiro;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;

/**
 * Pedido de serviço do Elora Casa+ (agregado). Todas as mudanças de estado passam por aqui,
 * então as regras valem igual para a equipe, o corretor, o app do cliente e as integrações.
 *
 * <pre>pedido → orcamento → aprovado → executado (→ margem recebida)   |   aberto → cancelado</pre>
 */
public final class PedidoServico {
    private final String id;
    private final Categoria categoria;
    private final String subservico;
    private final boolean urgente;
    private final Cliente cliente;
    private final String imovelRef;
    private final String corretorRef;
    private final String corretorNome;
    private final String descricao;
    private final LocalDate preferenciaEm;
    private final Instant criadoEm;

    private StatusPedido status;
    private String parceiroId;
    private LocalDate aprovadoEm;
    private LocalDate executadoEm;
    private Orcamento orcamento;
    private BigDecimal margemPct;
    private Dinheiro margemRecebida;
    private LocalDate recebidaEm;
    private BigDecimal corretorPct;
    private BigDecimal fundoPct;
    private Avaliacao avaliacao;
    private String motivoCancelamento;
    private final long versao;
    private final String pacoteId;

    /** Reconstrói um pedido já existente (usado pela persistência). */
    public PedidoServico(Dados d) {
        this.id = d.id();
        this.categoria = d.categoria();
        this.subservico = d.subservico();
        this.urgente = d.urgente();
        this.cliente = d.cliente();
        this.imovelRef = d.imovelRef();
        this.corretorRef = d.corretorRef();
        this.corretorNome = d.corretorNome();
        this.descricao = d.descricao();
        this.preferenciaEm = d.preferenciaEm();
        this.criadoEm = d.criadoEm();
        this.status = d.status();
        this.parceiroId = d.parceiroId();
        this.aprovadoEm = d.aprovadoEm();
        this.executadoEm = d.executadoEm();
        this.orcamento = d.orcamento();
        this.margemPct = d.margemPct();
        this.margemRecebida = d.margemRecebida();
        this.recebidaEm = d.recebidaEm();
        this.corretorPct = d.corretorPct();
        this.fundoPct = d.fundoPct();
        this.avaliacao = d.avaliacao();
        this.motivoCancelamento = d.motivoCancelamento();
        this.versao = d.versao();
        this.pacoteId = d.pacoteId();
    }

    /** Novo pedido, registrado pelo cliente no app ou pela equipe/corretor em nome dele. */
    public static PedidoServico novo(
            String id, Categoria categoria, String subservico, boolean urgente, Cliente cliente, String imovelRef,
            String corretorRef, String corretorNome, String descricao, LocalDate preferenciaEm, Instant agora) {
        exigir(cliente != null && cliente.referencia() != null && !cliente.referencia().isBlank(), "Escolha o cliente.");
        exigir(descricao != null && !descricao.isBlank(), "Explique o serviço.");
        exigir(subservico == null || subservico.length() <= 80, "Serviço específico inválido.");
        String desc = descricao.strip();
        return new PedidoServico(new Dados(
                id, categoria, blankToNull(subservico), urgente && categoria.aceitaUrgencia(), cliente, imovelRef, corretorRef, corretorNome,
                desc.length() > 500 ? desc.substring(0, 500) : desc, preferenciaEm, agora, StatusPedido.PEDIDO,
                null, null, null, null, null, null, null, null, null, null, null, 0, null));
    }

    /** Pedido gerado por um pacote do Casa+ (fica ligado a ele pelo pacoteId). */
    public static PedidoServico doPacote(
            String id, String pacoteId, Categoria categoria, String subservico, Cliente cliente, String imovelRef, String corretorRef,
            String corretorNome, String descricao, LocalDate data, Instant agora) {
        PedidoServico p = novo(id, categoria, subservico, false, cliente, imovelRef, corretorRef, corretorNome, descricao, data, agora);
        var d = p.dados();
        return new PedidoServico(new Dados(d.id(), d.categoria(), d.subservico(), false, d.cliente(), d.imovelRef(), d.corretorRef(), d.corretorNome(),
                d.descricao(), d.preferenciaEm(), d.criadoEm(), d.status(), null, null, null, null, null, null, null, null, null, null, null, 0, pacoteId));
    }

    /**
     * Mudança Plug & Play dentro de um pacote: serviço da própria Elora, por taxa fixa. Nasce aprovado,
     * com a taxa como orçamento e margem de 100% (a taxa inteira é receita da Elora).
     */
    public static PedidoServico plugPlayDoPacote(
            String id, String pacoteId, Cliente cliente, String imovelRef, String corretorRef, String corretorNome, LocalDate data,
            Dinheiro taxa, LocalDate hoje, Instant agora) {
        exigir(cliente != null && cliente.referencia() != null, "Escolha o cliente.");
        return new PedidoServico(new Dados(id, Categoria.PLUGPLAY, null, false, cliente, imovelRef, corretorRef, corretorNome,
                "Pacote Chegada · luz, água, gás e internet", data, agora, StatusPedido.APROVADO, null, hoje, null,
                new Orcamento(taxa, data == null ? null : "até " + data.format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")), null, hoje),
                BigDecimal.valueOf(100), null, null, null, null, null, null, 0, pacoteId));
    }

    public void registrarOrcamento(Parceiro parceiro, Dinheiro valor, String prazo, String observacao, LocalDate hoje) {
        exigir(!categoria.daElora(), "Este serviço é feito pela própria Elora.");
        exigir(status == StatusPedido.PEDIDO || status == StatusPedido.ORCAMENTO, "O orçamento só pode ser registrado antes da aprovação.");
        exigir(parceiro != null, "Escolha o parceiro.");
        exigir(parceiro.atende(categoria) || parceiro.id().equals(parceiroId), "Este parceiro não presta este serviço.");
        exigir(valor != null && valor.positivo(), "Informe o valor.");
        this.parceiroId = parceiro.id();
        // A comissão do parceiro fica congelada no pedido (mudanças no cadastro não afetam pedidos já orçados).
        this.margemPct = categoria.semComissao() ? BigDecimal.ZERO : parceiro.comissaoPct();
        this.orcamento = new Orcamento(valor, limitar(prazo, 60), limitar(observacao, 160), hoje);
        this.status = StatusPedido.ORCAMENTO;
    }

    public void aprovar(LocalDate hoje) {
        exigir(status == StatusPedido.ORCAMENTO, "Só um orçamento enviado pode ser aprovado.");
        this.status = StatusPedido.APROVADO;
        this.aprovadoEm = hoje;
    }

    public void concluir(LocalDate hoje) {
        exigir(status == StatusPedido.APROVADO, "Só um serviço aprovado pode ser marcado como feito.");
        this.status = StatusPedido.EXECUTADO;
        this.executadoEm = hoje;
    }

    /**
     * Margem efetivamente recebida do parceiro. Os percentuais do dia ficam congelados no pedido:
     * mudanças futuras nas regras não alteram participações já geradas.
     */
    public void registrarMargem(Dinheiro valor, LocalDate recebidaEm, RegrasCasaMais regras, LocalDate hoje) {
        exigir(!categoria.daElora(), "Este serviço é feito pela própria Elora.");
        exigir(status == StatusPedido.EXECUTADO, "A margem só é registrada depois do serviço feito.");
        exigir(!margemFoiRecebida(), "A margem deste pedido já foi registrada.");
        exigir(valor != null && valor.positivo(), "Informe o valor recebido.");
        exigir(recebidaEm != null && !recebidaEm.isAfter(hoje), "Informe a data do recebimento.");
        this.margemRecebida = valor;
        this.recebidaEm = recebidaEm;
        this.fundoPct = regras.fundoBoaIdeiaPct();
        this.corretorPct = temCorretor() ? regras.corretorPct() : BigDecimal.ZERO;
    }

    public void cancelar(String motivo) {
        exigir(status.aberto(), "Só pedidos em aberto podem ser cancelados.");
        this.status = StatusPedido.CANCELADO;
        this.motivoCancelamento = limitar(motivo, 200);
    }

    public void avaliar(int nota, String comentario, LocalDate hoje) {
        exigir(status == StatusPedido.EXECUTADO && !categoria.daElora(), "Só serviços feitos podem ser avaliados.");
        exigir(nota >= 0 && nota <= 10, "Escolha uma nota de 0 a 10.");
        this.avaliacao = new Avaliacao(nota, limitar(comentario, 200), hoje);
    }

    public boolean margemFoiRecebida() {
        return margemRecebida != null && margemRecebida.positivo();
    }

    public boolean temCorretor() {
        return corretorRef != null && !corretorRef.isBlank();
    }

    /** Divisão da margem recebida (vazia enquanto não houver margem). */
    public Optional<DivisaoMargem> divisao() {
        if (!margemFoiRecebida()) return Optional.empty();
        return Optional.of(DivisaoMargem.calcular(margemRecebida, Objects.requireNonNullElse(fundoPct, BigDecimal.ZERO),
                Objects.requireNonNullElse(corretorPct, BigDecimal.ZERO), temCorretor()));
    }

    /** Margem prevista pelo orçamento (valor × comissão do parceiro). */
    public Dinheiro margemPrevista() {
        return orcamento == null ? Dinheiro.ZERO : orcamento.valor().percentual(margemPct);
    }

    public Dados dados() {
        return new Dados(id, categoria, subservico, urgente, cliente, imovelRef, corretorRef, corretorNome, descricao, preferenciaEm, criadoEm,
                status, parceiroId, aprovadoEm, executadoEm, orcamento, margemPct, margemRecebida, recebidaEm, corretorPct, fundoPct,
                avaliacao, motivoCancelamento, versao, pacoteId);
    }

    public String id() {
        return id;
    }

    public StatusPedido status() {
        return status;
    }

    public Categoria categoria() {
        return categoria;
    }

    private static String limitar(String s, int max) {
        String v = blankToNull(s);
        return v == null ? null : v.length() > max ? v.substring(0, max) : v;
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }

    /** Estado completo do pedido (para persistência e leitura). */
    public record Dados(
            String id, Categoria categoria, String subservico, boolean urgente, Cliente cliente, String imovelRef,
            String corretorRef, String corretorNome, String descricao, LocalDate preferenciaEm, Instant criadoEm,
            StatusPedido status, String parceiroId, LocalDate aprovadoEm, LocalDate executadoEm, Orcamento orcamento,
            BigDecimal margemPct, Dinheiro margemRecebida, LocalDate recebidaEm, BigDecimal corretorPct, BigDecimal fundoPct,
            Avaliacao avaliacao, String motivoCancelamento, long versao, String pacoteId) {}
}
