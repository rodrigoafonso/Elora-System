package br.com.elora.platform.divulgacao.infrastructure.persistence;

import br.com.elora.platform.divulgacao.application.port.EnvioRepository;
import br.com.elora.platform.divulgacao.domain.Envio;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcEnvioRepository implements EnvioRepository {
    private static final String SELECT = """
            select e.token, e.imovel_id::text as imovel_id, i.codigo, e.lead_ref, e.lead_nome, e.corretor_id::text as corretor_id, e.criado_em,
                   coalesce(array_agg(a.aberto_em order by a.aberto_em desc) filter (where a.id is not null), '{}') as aberturas
            from app.envio_imovel e
            join app.imovel i on i.id = e.imovel_id
            left join app.abertura_link a on a.token = e.token
            """;
    private static final String AGRUPAR = " group by e.token, i.codigo";
    private final JdbcClient jdbc;

    public JdbcEnvioRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void salvar(TenantId t, Envio e) {
        jdbc.sql("""
                insert into app.envio_imovel (token, tenant_id, imovel_id, lead_ref, lead_nome, corretor_id, criado_em)
                values (:token, :t, :im::uuid, :lead, :nome, :cor::uuid, :em)
                """).param("token", e.token()).param("t", t.valor()).param("im", e.imovelId()).param("lead", e.leadRef())
                .param("nome", e.leadNome()).param("cor", e.corretorId()).param("em", Timestamp.from(e.criadoEm())).update();
    }

    @Override
    public Optional<Envio> porToken(String token) {
        return jdbc.sql(SELECT + " where e.token = :token" + AGRUPAR).param("token", token).query(JdbcEnvioRepository::mapear).optional();
    }

    @Override
    public Optional<Envio> doCliente(TenantId t, String imovelId, String leadRef) {
        if (!uuid(imovelId)) return Optional.empty();
        return jdbc.sql(SELECT + " where e.tenant_id = :t and e.imovel_id = :im::uuid and e.lead_ref = :lead" + AGRUPAR)
                .param("t", t.valor()).param("im", imovelId).param("lead", leadRef).query(JdbcEnvioRepository::mapear).optional();
    }

    @Override
    public List<Envio> listar(TenantId t, String imovelId, String corretorId, int limite) {
        if ((imovelId != null && !uuid(imovelId)) || (corretorId != null && !uuid(corretorId))) return List.of();
        return jdbc.sql(SELECT + """
                 where e.tenant_id = :t
                   and (cast(:im as uuid) is null or e.imovel_id = cast(:im as uuid))
                   and (cast(:cor as uuid) is null or e.corretor_id = cast(:cor as uuid))
                """ + AGRUPAR + " order by e.criado_em desc limit :lim")
                .param("t", t.valor()).param("im", imovelId).param("cor", corretorId).param("lim", limite).query(JdbcEnvioRepository::mapear).list();
    }

    @Override
    public void registrarAbertura(String token, String tenant, Instant em, String aparelho) {
        jdbc.sql("insert into app.abertura_link (token, tenant_id, aberto_em, aparelho) values (:token, :t, :em, :ap)")
                .param("token", token).param("t", tenant).param("em", Timestamp.from(em)).param("ap", aparelho).update();
    }

    @Override
    public Optional<TenantId> tenantDo(String token) {
        return jdbc.sql("select tenant_id from app.envio_imovel where token = :token").param("token", token).query(String.class).optional().map(TenantId::new);
    }

    private static Envio mapear(ResultSet rs, int n) throws SQLException {
        Array arr = rs.getArray("aberturas");
        List<Instant> ab = arr == null ? List.of() : Arrays.stream((Object[]) arr.getArray()).map(o -> ((Timestamp) o).toInstant()).toList();
        return new Envio(rs.getString("token"), rs.getString("imovel_id"), rs.getString("codigo"), rs.getString("lead_ref"), rs.getString("lead_nome"),
                rs.getString("corretor_id"), rs.getTimestamp("criado_em").toInstant(), ab);
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
