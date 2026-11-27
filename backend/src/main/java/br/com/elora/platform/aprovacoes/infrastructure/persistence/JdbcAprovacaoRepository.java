package br.com.elora.platform.aprovacoes.infrastructure.persistence;

import br.com.elora.platform.aprovacoes.application.port.AprovacaoRepository;
import br.com.elora.platform.aprovacoes.domain.Aprovacao;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcAprovacaoRepository implements AprovacaoRepository {
    private static final String SELECT = """
            select id::text as id, tipo, canal, titulo, conteudo, destino, referencia, situacao, pedido_por, pedido_em, decidido_por, decidido_em,
                   texto_aprovado, motivo, enviado_por, enviado_em, resultado_envio from app.aprovacao""";
    private final JdbcClient jdbc;

    public JdbcAprovacaoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void salvar(TenantId t, Aprovacao a) {
        jdbc.sql("""
                insert into app.aprovacao (id, tenant_id, tipo, canal, titulo, conteudo, destino, referencia, situacao, pedido_por, pedido_em)
                values (:id::uuid, :t, :tipo, :canal, :titulo, :conteudo, :destino, :ref, :sit, :por, :em)
                """).param("id", a.id()).param("t", t.valor()).param("tipo", a.tipo()).param("canal", a.canal()).param("titulo", a.titulo())
                .param("conteudo", a.conteudo()).param("destino", a.destino()).param("ref", a.referencia()).param("sit", a.situacao().name())
                .param("por", a.pedidoPor()).param("em", Timestamp.from(a.pedidoEm())).update();
    }

    @Override
    public void atualizar(TenantId t, Aprovacao a) {
        jdbc.sql("""
                update app.aprovacao set situacao = :sit, decidido_por = :dp, decidido_em = :de, texto_aprovado = :txt, motivo = :mot,
                       enviado_por = :ep, enviado_em = :ee, resultado_envio = :res
                 where tenant_id = :t and id = :id::uuid
                """).param("sit", a.situacao().name()).param("dp", a.decididoPor()).param("de", ts(a.decididoEm())).param("txt", a.textoAprovado())
                .param("mot", a.motivo()).param("ep", a.enviadoPor()).param("ee", ts(a.enviadoEm())).param("res", a.resultadoEnvio())
                .param("t", t.valor()).param("id", a.id()).update();
    }

    @Override
    public Optional<Aprovacao> porId(TenantId t, String id) {
        if (!uuid(id)) return Optional.empty();
        return jdbc.sql(SELECT + " where tenant_id = :t and id = :id::uuid").param("t", t.valor()).param("id", id).query(JdbcAprovacaoRepository::mapear).optional();
    }

    @Override
    public List<Aprovacao> listar(TenantId t, Aprovacao.Situacao s, int limite) {
        return jdbc.sql(SELECT + " where tenant_id = :t and (:s::text is null or situacao = :s) order by pedido_em desc limit :lim")
                .param("t", t.valor()).param("s", s == null ? null : s.name()).param("lim", limite).query(JdbcAprovacaoRepository::mapear).list();
    }

    @Override
    public void registrarEvento(TenantId t, String aprovacaoId, String acao, String quem, String detalhe, Instant em) {
        jdbc.sql("insert into app.aprovacao_evento (tenant_id, aprovacao_id, acao, quem, detalhe, em) values (:t, :id::uuid, :acao, :quem, :det, :em)")
                .param("t", t.valor()).param("id", aprovacaoId).param("acao", acao).param("quem", quem)
                .param("det", detalhe == null ? null : detalhe.length() > 300 ? detalhe.substring(0, 300) : detalhe).param("em", Timestamp.from(em)).update();
    }

    @Override
    public List<Evento> eventos(TenantId t, String aprovacaoId) {
        return jdbc.sql("select acao, quem, detalhe, em from app.aprovacao_evento where tenant_id = :t and aprovacao_id = :id::uuid order by em, id")
                .param("t", t.valor()).param("id", aprovacaoId)
                .query((rs, n) -> new Evento(rs.getString("acao"), rs.getString("quem"), rs.getString("detalhe"), rs.getTimestamp("em").toInstant())).list();
    }

    private static Aprovacao mapear(ResultSet rs, int n) throws SQLException {
        return new Aprovacao(rs.getString("id"), rs.getString("tipo"), rs.getString("canal"), rs.getString("titulo"), rs.getString("conteudo"),
                rs.getString("destino"), rs.getString("referencia"), Aprovacao.Situacao.valueOf(rs.getString("situacao")), rs.getString("pedido_por"),
                inst(rs.getTimestamp("pedido_em")), rs.getString("decidido_por"), inst(rs.getTimestamp("decidido_em")), rs.getString("texto_aprovado"),
                rs.getString("motivo"), rs.getString("enviado_por"), inst(rs.getTimestamp("enviado_em")), rs.getString("resultado_envio"));
    }

    private static Timestamp ts(Instant i) {
        return i == null ? null : Timestamp.from(i);
    }

    private static Instant inst(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }

    private static boolean uuid(String s) {
        try {
            UUID.fromString(s);
            return true;
        } catch (IllegalArgumentException | NullPointerException e) {
            return false;
        }
    }
}
