package br.com.elora.platform.casamais.infrastructure.persistence;

import br.com.elora.platform.casamais.application.port.JornadaRepository;
import br.com.elora.platform.casamais.domain.ClienteEmJornada;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcJornadaRepository implements JornadaRepository {
    private static final String SELECT = """
            select j.*, (select count(*) from app.cm_pedido p where p.tenant_id = j.tenant_id
                         and p.cliente_perfil = j.perfil and p.cliente_ref = j.referencia) as pedidos
            from app.cm_jornada j
            """;
    private final JdbcClient jdbc;

    public JdbcJornadaRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<ClienteEmJornada> listar(TenantId tenant, LocalDate hoje) {
        return jdbc.sql(SELECT + """
                where j.tenant_id = :t and j.desde <= :hoje
                  and ((j.perfil = 'comprador' and j.desde >= :hoje - 180) or (j.perfil <> 'comprador' and j.desde >= :hoje - 90))
                order by j.desde desc
                """).param("t", tenant.valor()).param("hoje", Date.valueOf(hoje)).query((rs, n) -> mapear(rs)).list();
    }

    @Override
    public Optional<ClienteEmJornada> buscar(TenantId tenant, PerfilCliente perfil, String referencia) {
        return jdbc.sql(SELECT + " where j.tenant_id = ? and j.perfil = ? and j.referencia = ?")
                .params(tenant.valor(), perfil.chave(), referencia).query((rs, n) -> mapear(rs)).optional();
    }

    private static ClienteEmJornada mapear(ResultSet rs) throws SQLException {
        PerfilCliente perfil = PerfilCliente.daChave(rs.getString("perfil"));
        return new ClienteEmJornada(perfil, rs.getString("referencia"), rs.getString("nome"), rs.getString("telefone"),
                rs.getString("imovel_ref"), rs.getString("corretor_ref"), rs.getString("corretor_nome"), rs.getDate("desde").toLocalDate(),
                perfil == PerfilCliente.COMPRADOR ? "Comprou" : "Alugou", rs.getInt("pedidos"));
    }
}
