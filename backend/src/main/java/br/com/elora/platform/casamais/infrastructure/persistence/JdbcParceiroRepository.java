package br.com.elora.platform.casamais.infrastructure.persistence;

import br.com.elora.platform.casamais.application.port.ParceiroRepository;
import br.com.elora.platform.casamais.domain.Categoria;
import br.com.elora.platform.casamais.domain.Parceiro;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcParceiroRepository implements ParceiroRepository {
    private final JdbcClient jdbc;

    public JdbcParceiroRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Parceiro> listar(TenantId tenant) {
        return jdbc.sql("select * from app.cm_parceiro where tenant_id = ? order by ativo desc, nome").param(tenant.valor())
                .query((rs, n) -> mapear(rs)).list();
    }

    @Override
    public Optional<Parceiro> buscar(TenantId tenant, String id) {
        return jdbc.sql("select * from app.cm_parceiro where tenant_id = ? and id = ?").param(tenant.valor()).param(id)
                .query((rs, n) -> mapear(rs)).optional();
    }

    @Override
    public Parceiro salvar(TenantId tenant, Parceiro p) {
        jdbc.sql("""
                insert into app.cm_parceiro (tenant_id, id, nome, categorias, comissao_pct, whatsapp, cidades, prazo, apresentacao, ativo)
                values (:t, :id, :nome, string_to_array(:cats, ','), :pct, :zap, :cid, :prazo, :apr, :ativo)
                on conflict (tenant_id, id) do update set nome = excluded.nome, categorias = excluded.categorias,
                  comissao_pct = excluded.comissao_pct, whatsapp = excluded.whatsapp, cidades = excluded.cidades,
                  prazo = excluded.prazo, apresentacao = excluded.apresentacao, ativo = excluded.ativo
                """)
                .param("t", tenant.valor()).param("id", p.id()).param("nome", p.nome()).param("cats", String.join(",", p.chavesDasCategorias()))
                .param("pct", p.comissaoPct()).param("zap", p.whatsapp()).param("cid", p.cidades()).param("prazo", p.prazo())
                .param("apr", p.apresentacao()).param("ativo", p.ativo()).update();
        return buscar(tenant, p.id()).orElseThrow();
    }

    @Override
    public String novoId() {
        return "PA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private static Parceiro mapear(ResultSet rs) throws SQLException {
        String[] cats = (String[]) rs.getArray("categorias").getArray();
        return new Parceiro(rs.getString("id"), rs.getString("nome"),
                Arrays.stream(cats).map(c -> Categoria.daChave(c).orElseThrow()).collect(Collectors.toSet()),
                rs.getBigDecimal("comissao_pct"), rs.getString("whatsapp"), rs.getString("cidades"), rs.getString("prazo"),
                rs.getString("apresentacao"), rs.getBoolean("ativo"));
    }
}
