package br.com.elora.platform.casamais.infrastructure.persistence;

import br.com.elora.platform.casamais.application.port.PedidoServicoRepository;
import br.com.elora.platform.casamais.domain.Avaliacao;
import br.com.elora.platform.casamais.domain.Categoria;
import br.com.elora.platform.casamais.domain.Cliente;
import br.com.elora.platform.casamais.domain.Orcamento;
import br.com.elora.platform.casamais.domain.PedidoServico;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.casamais.domain.StatusPedido;
import br.com.elora.platform.shared.domain.Dinheiro;
import br.com.elora.platform.shared.domain.TenantId;
import java.math.BigDecimal;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Adaptador JDBC (SQL explícito, sem ORM): previsível e fácil de otimizar quando o volume crescer. */
public class JdbcPedidoServicoRepository implements PedidoServicoRepository {
    private static final String COLUNAS = """
            id, categoria, subservico, urgente, cliente_perfil, cliente_ref, cliente_nome, cliente_telefone, imovel_ref,
            corretor_ref, corretor_nome, descricao, preferencia_em, status, criado_em, parceiro_id, aprovado_em, executado_em,
            orc_valor, orc_prazo, orc_observacao, orc_em, margem_pct, margem_recebida, recebida_em, corretor_pct, fundo_pct,
            aval_nota, aval_comentario, aval_em, motivo_cancelamento, versao""";

    private final JdbcClient jdbc;

    public JdbcPedidoServicoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<PedidoServico> listar(TenantId tenant) {
        return jdbc.sql("select " + COLUNAS + " from app.cm_pedido where tenant_id = ? order by criado_em desc limit 500")
                .param(tenant.valor()).query((rs, n) -> mapear(rs)).list();
    }

    @Override
    public Optional<PedidoServico> buscar(TenantId tenant, String id) {
        return jdbc.sql("select " + COLUNAS + " from app.cm_pedido where tenant_id = ? and id = ?")
                .param(tenant.valor()).param(id).query((rs, n) -> mapear(rs)).optional();
    }

    @Override
    public PedidoServico salvar(TenantId tenant, PedidoServico pedido) {
        var d = pedido.dados();
        var o = d.orcamento();
        var a = d.avaliacao();
        int linhas = jdbc.sql("""
                insert into app.cm_pedido (tenant_id, %s)
                values (:tenant, :id, :categoria, :subservico, :urgente, :perfil, :clienteRef, :clienteNome, :clienteTel, :imovel,
                        :corretorRef, :corretorNome, :descricao, :preferencia, :status, :criadoEm, :parceiro, :aprovadoEm, :executadoEm,
                        :orcValor, :orcPrazo, :orcObs, :orcEm, :margemPct, :margemRecebida, :recebidaEm, :corretorPct, :fundoPct,
                        :avalNota, :avalComentario, :avalEm, :motivo, 0)
                on conflict (tenant_id, id) do update set
                  status = excluded.status, parceiro_id = excluded.parceiro_id, aprovado_em = excluded.aprovado_em,
                  executado_em = excluded.executado_em, orc_valor = excluded.orc_valor, orc_prazo = excluded.orc_prazo,
                  orc_observacao = excluded.orc_observacao, orc_em = excluded.orc_em, margem_pct = excluded.margem_pct,
                  margem_recebida = excluded.margem_recebida, recebida_em = excluded.recebida_em, corretor_pct = excluded.corretor_pct,
                  fundo_pct = excluded.fundo_pct, aval_nota = excluded.aval_nota, aval_comentario = excluded.aval_comentario,
                  aval_em = excluded.aval_em, motivo_cancelamento = excluded.motivo_cancelamento, versao = app.cm_pedido.versao + 1
                where app.cm_pedido.versao = :versao
                """.formatted(COLUNAS))
                .param("tenant", tenant.valor()).param("id", d.id()).param("categoria", d.categoria().chave())
                .param("subservico", d.subservico()).param("urgente", d.urgente()).param("perfil", d.cliente().perfil().chave())
                .param("clienteRef", d.cliente().referencia()).param("clienteNome", d.cliente().nome())
                .param("clienteTel", d.cliente().telefone()).param("imovel", d.imovelRef()).param("corretorRef", d.corretorRef())
                .param("corretorNome", d.corretorNome()).param("descricao", d.descricao()).param("preferencia", data(d.preferenciaEm()))
                .param("status", d.status().chave()).param("criadoEm", Timestamp.from(d.criadoEm())).param("parceiro", d.parceiroId())
                .param("aprovadoEm", data(d.aprovadoEm())).param("executadoEm", data(d.executadoEm()))
                .param("orcValor", o == null ? null : o.valor().emReais()).param("orcPrazo", o == null ? null : o.prazo())
                .param("orcObs", o == null ? null : o.observacao()).param("orcEm", o == null ? null : data(o.em()))
                .param("margemPct", d.margemPct()).param("margemRecebida", d.margemRecebida() == null ? null : d.margemRecebida().emReais())
                .param("recebidaEm", data(d.recebidaEm())).param("corretorPct", d.corretorPct()).param("fundoPct", d.fundoPct())
                .param("avalNota", a == null ? null : a.nota()).param("avalComentario", a == null ? null : a.comentario())
                .param("avalEm", a == null ? null : data(a.em())).param("motivo", d.motivoCancelamento()).param("versao", d.versao())
                .update();
        if (linhas == 0) throw new OptimisticLockingFailureException("O pedido foi alterado por outra pessoa. Atualize a tela.");
        return buscar(tenant, d.id()).orElseThrow();
    }

    @Override
    public String novoId() {
        return "SV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(java.util.Locale.ROOT);
    }

    private static Date data(LocalDate d) {
        return d == null ? null : Date.valueOf(d);
    }

    private static LocalDate data(ResultSet rs, String c) throws SQLException {
        Date d = rs.getDate(c);
        return d == null ? null : d.toLocalDate();
    }

    private static PedidoServico mapear(ResultSet rs) throws SQLException {
        BigDecimal orc = rs.getBigDecimal("orc_valor");
        BigDecimal margem = rs.getBigDecimal("margem_recebida");
        int nota = rs.getInt("aval_nota");
        boolean temNota = !rs.wasNull();
        return new PedidoServico(new PedidoServico.Dados(
                rs.getString("id"), Categoria.daChave(rs.getString("categoria")).orElseThrow(), rs.getString("subservico"),
                rs.getBoolean("urgente"),
                new Cliente(PerfilCliente.daChave(rs.getString("cliente_perfil")), rs.getString("cliente_ref"), rs.getString("cliente_nome"),
                        rs.getString("cliente_telefone")),
                rs.getString("imovel_ref"), rs.getString("corretor_ref"), rs.getString("corretor_nome"), rs.getString("descricao"),
                data(rs, "preferencia_em"), rs.getTimestamp("criado_em").toInstant(), StatusPedido.daChave(rs.getString("status")),
                rs.getString("parceiro_id"), data(rs, "aprovado_em"), data(rs, "executado_em"),
                orc == null ? null : new Orcamento(Dinheiro.deReais(orc), rs.getString("orc_prazo"), rs.getString("orc_observacao"), data(rs, "orc_em")),
                rs.getBigDecimal("margem_pct"), margem == null ? null : Dinheiro.deReais(margem), data(rs, "recebida_em"),
                rs.getBigDecimal("corretor_pct"), rs.getBigDecimal("fundo_pct"),
                temNota ? new Avaliacao(nota, rs.getString("aval_comentario"), data(rs, "aval_em")) : null,
                rs.getString("motivo_cancelamento"), rs.getLong("versao")));
    }
}
