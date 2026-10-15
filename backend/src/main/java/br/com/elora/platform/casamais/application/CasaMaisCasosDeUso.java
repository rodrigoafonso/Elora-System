package br.com.elora.platform.casamais.application;

import br.com.elora.platform.casamais.application.port.JornadaRepository;
import br.com.elora.platform.casamais.application.port.ParceiroRepository;
import br.com.elora.platform.casamais.application.port.PedidoServicoRepository;
import br.com.elora.platform.casamais.application.port.RegrasRepository;
import br.com.elora.platform.casamais.domain.Cliente;
import br.com.elora.platform.casamais.domain.ClienteEmJornada;
import br.com.elora.platform.casamais.domain.Parceiro;
import br.com.elora.platform.casamais.domain.PedidoServico;
import br.com.elora.platform.casamais.domain.RegrasCasaMais;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.Comparator;
import java.util.List;
import java.util.function.Consumer;

/**
 * Casos de uso do Elora Casa+. Java puro: não conhece Spring, HTTP nem SQL.
 * A transação é aberta pela camada de infraestrutura (ver CasaMaisConfig).
 */
public class CasaMaisCasosDeUso {
    private final PedidoServicoRepository pedidos;
    private final ParceiroRepository parceiros;
    private final RegrasRepository regras;
    private final JornadaRepository jornadas;
    private final Relogio relogio;

    public CasaMaisCasosDeUso(PedidoServicoRepository pedidos, ParceiroRepository parceiros, RegrasRepository regras, JornadaRepository jornadas, Relogio relogio) {
        this.pedidos = pedidos;
        this.parceiros = parceiros;
        this.regras = regras;
        this.jornadas = jornadas;
        this.relogio = relogio;
    }

    // ---------- Consultas ----------
    public List<PedidoServico> listarPedidos(TenantId t) {
        return pedidos.listar(t).stream().sorted(Comparator.comparing((PedidoServico p) -> p.dados().criadoEm()).reversed()).toList();
    }

    public List<Parceiro> listarParceiros(TenantId t) {
        return parceiros.listar(t);
    }

    public RegrasCasaMais obterRegras(TenantId t) {
        return regras.obter(t);
    }

    public List<ClienteEmJornada> listarJornadas(TenantId t) {
        return jornadas.listar(t, relogio.hoje());
    }

    // ---------- Comandos ----------
    public PedidoServico registrarPedido(TenantId t, Comandos.NovoPedido c) {
        RegraVioladaException.exigir(c.categoria() != null, "Escolha o serviço.");
        ClienteEmJornada j = jornadas.buscar(t, c.perfil(), c.referencia()).orElseThrow(() -> new RegraVioladaException("Escolha o cliente."));
        PedidoServico p = PedidoServico.novo(pedidos.novoId(), c.categoria(), c.subservico(), c.urgente(),
                new Cliente(j.perfil(), j.referencia(), j.nome(), j.telefone()), j.imovelRef(), j.corretorRef(), j.corretorNome(),
                c.descricao(), c.preferenciaEm(), relogio.agora());
        return pedidos.salvar(t, p);
    }

    public PedidoServico registrarOrcamento(TenantId t, Comandos.NovoOrcamento c) {
        Parceiro parceiro = c.parceiroId() == null || c.parceiroId().isBlank() ? null : parceiros.buscar(t, c.parceiroId()).orElse(null);
        return alterar(t, c.pedidoId(), p -> p.registrarOrcamento(parceiro, c.valor(), c.prazo(), c.observacao(), relogio.hoje()));
    }

    public PedidoServico aprovar(TenantId t, String pedidoId) {
        return alterar(t, pedidoId, p -> p.aprovar(relogio.hoje()));
    }

    public PedidoServico concluir(TenantId t, String pedidoId) {
        return alterar(t, pedidoId, p -> p.concluir(relogio.hoje()));
    }

    public PedidoServico registrarMargem(TenantId t, Comandos.MargemRecebida c) {
        RegrasCasaMais r = regras.obter(t);
        return alterar(t, c.pedidoId(), p -> p.registrarMargem(c.valor(), c.recebidaEm(), r, relogio.hoje()));
    }

    public PedidoServico cancelar(TenantId t, String pedidoId, String motivo) {
        return alterar(t, pedidoId, p -> p.cancelar(motivo));
    }

    public Parceiro salvarParceiro(TenantId t, Comandos.DadosParceiro c) {
        String id = c.id();
        if (id != null) parceiros.buscar(t, id).orElseThrow(() -> new NaoEncontradoException("Parceiro não encontrado."));
        return parceiros.salvar(t, new Parceiro(id != null ? id : parceiros.novoId(), c.nome(), c.categorias(), c.comissaoPct(),
                c.whatsapp(), c.cidades(), c.prazo(), c.apresentacao(), c.ativo()));
    }

    public RegrasCasaMais salvarRegras(TenantId t, Comandos.NovasRegras c) {
        return regras.salvar(t, RegrasCasaMais.limitadas(c.corretorPct(), c.fundoBoaIdeiaPct(), c.taxaPlugPlay()));
    }

    private PedidoServico alterar(TenantId t, String id, Consumer<PedidoServico> mudanca) {
        PedidoServico p = pedidos.buscar(t, id).orElseThrow(() -> new NaoEncontradoException("Pedido não encontrado."));
        mudanca.accept(p);
        return pedidos.salvar(t, p);
    }
}
