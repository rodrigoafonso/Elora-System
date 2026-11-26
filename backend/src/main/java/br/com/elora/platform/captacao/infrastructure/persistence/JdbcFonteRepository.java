package br.com.elora.platform.captacao.infrastructure.persistence;

import br.com.elora.platform.captacao.application.port.FonteRepository;
import br.com.elora.platform.captacao.domain.Fonte;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcFonteRepository implements FonteRepository {
    private static final String SELECT = "select id::text as id, tenant_id, nome, tipo, canal, negocio, corretor_id::text as corretor_id, ativa, criada_em from app.fonte_captacao";
    private final JdbcClient jdbc;

    public JdbcFonteRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void salvar(TenantId t, Fonte f, String hashDoCodigo) {
        jdbc.sql("""
                insert into app.fonte_captacao (id, tenant_id, nome, tipo, canal, negocio, corretor_id, ativa, codigo_hash, criada_em)
                values (:id::uuid, :t, :nome, :tipo, :canal, :neg, :cor::uuid, :ativa, :hash, :em)
                """).param("id", f.id()).param("t", t.valor()).param("nome", f.nome()).param("tipo", f.tipo()).param("canal", f.canal())
                .param("neg", f.negocio()).param("cor", f.corretorId()).param("ativa", f.ativa()).param("hash", hashDoCodigo)
                .param("em", Timestamp.from(f.criadaEm())).update();
    }

    @Override
    public void atualizar(TenantId t, Fonte f) {
        jdbc.sql("""
                update app.fonte_captacao set nome = :nome, tipo = :tipo, canal = :canal, negocio = :neg, corretor_id = :cor::uuid, ativa = :ativa
                 where tenant_id = :t and id = :id::uuid
                """).param("id", f.id()).param("t", t.valor()).param("nome", f.nome()).param("tipo", f.tipo()).param("canal", f.canal())
                .param("neg", f.negocio()).param("cor", f.corretorId()).param("ativa", f.ativa()).update();
    }

    @Override
    public void trocarCodigo(TenantId t, String fonteId, String hashDoCodigo) {
        jdbc.sql("update app.fonte_captacao set codigo_hash = :hash where tenant_id = :t and id = :id::uuid")
                .param("hash", hashDoCodigo).param("t", t.valor()).param("id", fonteId).update();
    }

    @Override
    public Optional<Fonte> porId(TenantId t, String id) {
        if (!uuid(id)) return Optional.empty();
        return jdbc.sql(SELECT + " where tenant_id = :t and id = :id::uuid").param("t", t.valor()).param("id", id).query(JdbcFonteRepository::mapear).optional();
    }

    @Override
    public List<Fonte> listar(TenantId t) {
        return jdbc.sql(SELECT + " where tenant_id = :t order by criada_em").param("t", t.valor()).query(JdbcFonteRepository::mapear).list();
    }

    @Override
    public Optional<FonteDoCodigo> porCodigo(String hashDoCodigo) {
        return jdbc.sql(SELECT + " where codigo_hash = :hash").param("hash", hashDoCodigo)
                .query((rs, n) -> new FonteDoCodigo(new TenantId(rs.getString("tenant_id")), mapear(rs, n))).optional();
    }

    @Override
    public boolean corretorExiste(TenantId t, String corretorId) {
        if (!uuid(corretorId)) return false;
        return jdbc.sql("select count(*) from app.corretor where tenant_id = :t and id = :id::uuid").param("t", t.valor()).param("id", corretorId)
                .query(Integer.class).single() > 0;
    }

    private static Fonte mapear(ResultSet rs, int n) throws SQLException {
        return new Fonte(rs.getString("id"), rs.getString("nome"), rs.getString("tipo"), rs.getString("canal"), rs.getString("negocio"), rs.getString("corretor_id"),
                rs.getBoolean("ativa"), rs.getTimestamp("criada_em").toInstant());
    }

    private static boolean uuid(String s) {
        try {
            UUID.fromString(s);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }
}
