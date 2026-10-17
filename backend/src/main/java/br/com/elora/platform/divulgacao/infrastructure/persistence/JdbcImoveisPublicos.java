package br.com.elora.platform.divulgacao.infrastructure.persistence;

import br.com.elora.platform.divulgacao.application.port.ImoveisPublicos;
import br.com.elora.platform.divulgacao.domain.PreviaDoImovel;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcImoveisPublicos implements ImoveisPublicos {
    private static final String SELECT = """
            select id::text as id, codigo, descricao, bairro, cidade, quartos, area_m2, aluguel_pedido as aluguel, preco_venda as venda,
                   sob_consulta, foto_capa_url as foto_url, autorizacao_escrita_em is not null as autorizado
            from app.imovel where tenant_id = :t
            """;
    private final JdbcClient jdbc;

    public JdbcImoveisPublicos(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<PreviaDoImovel> porId(TenantId t, String imovelId) {
        if (!uuid(imovelId)) return Optional.empty();
        return jdbc.sql(SELECT + " and id = :id::uuid").param("t", t.valor()).param("id", imovelId).query(PreviaDoImovel.class).optional();
    }

    @Override
    public Optional<PreviaDoImovel> porCodigo(TenantId t, String codigo) {
        if (codigo == null || codigo.length() > 40) return Optional.empty();
        return jdbc.sql(SELECT + " and upper(codigo) = upper(:c)").param("t", t.valor()).param("c", codigo).query(PreviaDoImovel.class).optional();
    }

    @Override
    public boolean corretorExiste(TenantId t, String corretorId) {
        if (!uuid(corretorId)) return false;
        return jdbc.sql("select exists (select 1 from app.corretor where tenant_id = :t and id = :id::uuid and desligado_em is null)")
                .param("t", t.valor()).param("id", corretorId).query(Boolean.class).single();
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
