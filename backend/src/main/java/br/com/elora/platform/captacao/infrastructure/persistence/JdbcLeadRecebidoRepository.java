package br.com.elora.platform.captacao.infrastructure.persistence;

import br.com.elora.platform.captacao.application.port.LeadRecebidoRepository;
import br.com.elora.platform.captacao.domain.LeadRecebido;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcLeadRecebidoRepository implements LeadRecebidoRepository {
    private final JdbcClient jdbc;

    public JdbcLeadRecebidoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public long salvar(TenantId t, LeadRecebido l) {
        return jdbc.sql("""
                insert into app.lead_recebido (tenant_id, fonte_id, nome, telefone, telefone_chave, email, mensagem, regiao, valor_max, imovel_codigo,
                                               consentimento, situacao, duplicado_de, recebido_em)
                values (:t, :fonte::uuid, :nome, :tel, :chave, :email, :msg, :regiao, :valor, :im, :cons, :sit, :dup, :em)
                returning id
                """).param("t", t.valor()).param("fonte", l.fonteId()).param("nome", l.nome()).param("tel", l.telefone())
                .param("chave", LeadRecebido.chaveTelefone(l.telefone())).param("email", l.email()).param("msg", l.mensagem()).param("regiao", l.regiao())
                .param("valor", l.valorMax()).param("im", l.imovelCodigo()).param("cons", l.consentimento()).param("sit", l.situacao())
                .param("dup", l.duplicadoDe()).param("em", Timestamp.from(l.recebidoEm())).query(Long.class).single();
    }

    @Override
    public Optional<Long> mesmoContato(TenantId t, String chaveTelefone, String email, Instant desde) {
        if (chaveTelefone == null && email == null) return Optional.empty();
        return jdbc.sql("""
                select id from app.lead_recebido
                 where tenant_id = :t and situacao <> 'descartado' and recebido_em >= :desde
                   and ((cast(:chave as text) is not null and telefone_chave = :chave) or (cast(:email as text) is not null and email = :email))
                 order by recebido_em desc limit 1
                """).param("t", t.valor()).param("chave", chaveTelefone).param("email", email).param("desde", Timestamp.from(desde))
                .query(Long.class).optional();
    }

    @Override
    public int recebidosDaFonteDesde(TenantId t, String fonteId, Instant desde) {
        return jdbc.sql("select count(*) from app.lead_recebido where tenant_id = :t and fonte_id = :f::uuid and recebido_em >= :desde")
                .param("t", t.valor()).param("f", fonteId).param("desde", Timestamp.from(desde)).query(Integer.class).single();
    }

    @Override
    public List<LeadRecebido> listar(TenantId t, String situacao, int limite) {
        return jdbc.sql("""
                select id, fonte_id::text as fonte_id, nome, telefone, email, mensagem, regiao, valor_max, imovel_codigo, consentimento, situacao, duplicado_de, recebido_em
                  from app.lead_recebido
                 where tenant_id = :t and (cast(:sit as text) is null or situacao = :sit)
                 order by recebido_em desc limit :lim
                """).param("t", t.valor()).param("sit", situacao).param("lim", limite).query(JdbcLeadRecebidoRepository::mapear).list();
    }

    @Override
    public void marcar(TenantId t, long id, String situacao) {
        jdbc.sql("update app.lead_recebido set situacao = :sit where tenant_id = :t and id = :id").param("sit", situacao).param("t", t.valor()).param("id", id).update();
    }

    private static LeadRecebido mapear(ResultSet rs, int n) throws SQLException {
        long dup = rs.getLong("duplicado_de");
        return new LeadRecebido(rs.getLong("id"), rs.getString("fonte_id"), rs.getString("nome"), rs.getString("telefone"), rs.getString("email"), rs.getString("mensagem"),
                rs.getString("regiao"), rs.getBigDecimal("valor_max"), rs.getString("imovel_codigo"), rs.getBoolean("consentimento"), rs.getString("situacao"),
                rs.wasNull() ? null : dup, rs.getTimestamp("recebido_em").toInstant());
    }
}
