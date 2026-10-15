package br.com.elora.platform.casamais.infrastructure.persistence;

import br.com.elora.platform.casamais.application.port.RegrasRepository;
import br.com.elora.platform.casamais.domain.RegrasCasaMais;
import br.com.elora.platform.shared.domain.Dinheiro;
import br.com.elora.platform.shared.domain.TenantId;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcRegrasRepository implements RegrasRepository {
    private final JdbcClient jdbc;

    public JdbcRegrasRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public RegrasCasaMais obter(TenantId tenant) {
        return jdbc.sql("select corretor_pct, fundo_pct, taxa_plugplay from app.cm_regras where tenant_id = ?").param(tenant.valor())
                .query((rs, n) -> new RegrasCasaMais(rs.getBigDecimal("corretor_pct"), rs.getBigDecimal("fundo_pct"),
                        Dinheiro.deReais(rs.getBigDecimal("taxa_plugplay"))))
                .optional().orElse(RegrasCasaMais.PADRAO);
    }

    @Override
    public RegrasCasaMais salvar(TenantId tenant, RegrasCasaMais r) {
        jdbc.sql("""
                insert into app.cm_regras (tenant_id, corretor_pct, fundo_pct, taxa_plugplay) values (?, ?, ?, ?)
                on conflict (tenant_id) do update set corretor_pct = excluded.corretor_pct, fundo_pct = excluded.fundo_pct,
                  taxa_plugplay = excluded.taxa_plugplay, atualizado_em = now()
                """).params(tenant.valor(), r.corretorPct(), r.fundoBoaIdeiaPct(), r.taxaPlugPlay().emReais()).update();
        return obter(tenant);
    }
}
