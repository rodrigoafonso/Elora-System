package br.com.elora.platform.casamais.application;

import br.com.elora.platform.casamais.application.port.EmpresaRepository;
import br.com.elora.platform.casamais.application.port.JornadaRepository;
import br.com.elora.platform.casamais.application.port.PacoteRepository;
import br.com.elora.platform.casamais.application.port.ParceiroRepository;
import br.com.elora.platform.casamais.application.port.PedidoServicoRepository;
import br.com.elora.platform.casamais.application.port.RegrasRepository;
import br.com.elora.platform.casamais.domain.Cliente;
import br.com.elora.platform.casamais.domain.ClienteEmJornada;
import br.com.elora.platform.casamais.domain.Empresa;
import br.com.elora.platform.casamais.domain.ItemPacote;
import br.com.elora.platform.casamais.domain.Pacote;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.casamais.domain.Parceiro;
import br.com.elora.platform.casamais.domain.PedidoServico;
import br.com.elora.platform.casamais.domain.RegrasCasaMais;
import br.com.elora.platform.shared.domain.Dinheiro;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.Instant;
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
    private final PacoteRepository pacotes;
    private final EmpresaRepository empresas;
    private final Relogio relogio;

    public CasaMaisCasosDeUso(PedidoServicoRepository pedidos, ParceiroRepository parceiros, RegrasRepository regras, JornadaRepository jornadas,
                              PacoteRepository pacotes, EmpresaRepository empresas, Relogio relogio) {
        this.pedidos = pedidos;
        this.parceiros = parceiros;
        this.regras = regras;
        this.jornadas = jornadas;
        this.pacotes = pacotes;
        this.empresas = empresas;
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

    // ---------- Pacotes e Casa+ Empresas ----------
    public List<Pacote> listarPacotes(TenantId t) {
        return pacotes.listar(t);
    }

    public List<Empresa> listarEmpresas(TenantId t) {
        return empresas.listar(t);
    }

    public Empresa salvarEmpresa(TenantId t, Comandos.DadosEmpresa c) {
        String id = c.id();
        if (id != null) empresas.buscar(t, id).orElseThrow(() -> new NaoEncontradoException("Empresa não encontrada."));
        return empresas.salvar(t, new Empresa(id != null ? id : empresas.novoId(), c.nome(), corta(c.cidade(), 80), corta(c.contato(), 80),
                corta(c.whatsapp(), 30), corta(c.email(), 120), corta(c.auxilio(), 80), corta(c.observacao(), 400)));
    }

    /** Cria o pacote e um pedido do Casa+ para cada item com serviço (o guia do bairro fica como tarefa da equipe). */
    public Pacote registrarPacote(TenantId t, Comandos.NovoPacote c) {
        RegraVioladaException.exigir(c.perfil() != null && c.referencia() != null, "Escolha para quem é o pacote.");
        Cliente cliente;
        String empresaId = null, imovel = null, corretor = null, corretorNome = null;
        if (c.perfil() == PerfilCliente.EMPRESA) {
            Empresa e = empresas.buscar(t, c.referencia()).orElseThrow(() -> new RegraVioladaException("Empresa não encontrada."));
            empresaId = e.id();
            cliente = new Cliente(PerfilCliente.EMPRESA, e.id(), c.nome() == null ? null : c.nome().strip(), corta(c.telefone(), 30));
        } else {
            ClienteEmJornada j = jornadas.buscar(t, c.perfil(), c.referencia()).orElseThrow(() -> new RegraVioladaException("Escolha o cliente."));
            cliente = new Cliente(j.perfil(), j.referencia(), j.nome(), c.telefone() != null && !c.telefone().isBlank() ? corta(c.telefone(), 30) : j.telefone());
            imovel = j.imovelRef();
            corretor = j.corretorRef();
            corretorNome = j.corretorNome();
        }
        Instant agora = relogio.agora();
        Pacote pacote = pacotes.salvar(t, new Pacote(pacotes.novoId(), cliente, empresaId, imovel, corretor, corretorNome, c.data(), corta(c.origem(), 80),
                c.pessoas(), c.pet(), corta(c.observacao(), 400), c.buscaImovel(), c.itens(), List.of(), null, agora));
        Dinheiro taxa = regras.obter(t).taxaPlugPlay();
        for (ItemPacote item : pacote.itens()) {
            if (item.categoria().isEmpty()) continue;
            PedidoServico p = item == ItemPacote.PLUGPLAY
                    ? PedidoServico.plugPlayDoPacote(pedidos.novoId(), pacote.id(), cliente, imovel, corretor, corretorNome, c.data(), taxa, relogio.hoje(), agora)
                    : PedidoServico.doPacote(pedidos.novoId(), pacote.id(), item.categoria().get(), item.subservico(), cliente, imovel, corretor, corretorNome,
                            "Pacote Chegada · " + item.titulo() + (pacote.observacao() != null ? ". " + pacote.observacao() : ""), c.data(), agora);
            pedidos.salvar(t, p);
        }
        return pacotes.buscar(t, pacote.id()).orElseThrow();
    }

    public Pacote marcarGuiaEnviado(TenantId t, String pacoteId) {
        Pacote pk = pacotes.buscar(t, pacoteId).orElseThrow(() -> new NaoEncontradoException("Pacote não encontrado."));
        RegraVioladaException.exigir(pk.itens().contains(ItemPacote.GUIA), "Este pacote não tem o guia do bairro.");
        return pacotes.salvar(t, pk.comGuiaEnviado(relogio.hoje()));
    }

    private static String corta(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String v = s.strip();
        return v.length() > max ? v.substring(0, max) : v;
    }

    private PedidoServico alterar(TenantId t, String id, Consumer<PedidoServico> mudanca) {
        PedidoServico p = pedidos.buscar(t, id).orElseThrow(() -> new NaoEncontradoException("Pedido não encontrado."));
        mudanca.accept(p);
        return pedidos.salvar(t, p);
    }
}
