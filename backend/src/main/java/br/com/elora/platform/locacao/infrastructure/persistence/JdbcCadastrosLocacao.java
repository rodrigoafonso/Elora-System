package br.com.elora.platform.locacao.infrastructure.persistence;

import br.com.elora.platform.locacao.application.port.CadastrosLocacao;
import br.com.elora.platform.locacao.domain.Resumos;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Leitura dos cadastros do núcleo (imóveis, pessoas, corretores, planos) para a Locação. */
public class JdbcCadastrosLocacao implements CadastrosLocacao {
    private static final String IMOVEL = "select id::text as id, codigo, descricao, bairro, cidade from app.imovel where tenant_id = :t";
    private final JdbcClient jdbc;

    public JdbcCadastrosLocacao(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Resumos.Imovel> imoveis(TenantId t) {
        return jdbc.sql(IMOVEL + " order by codigo").param("t", t.valor()).query(Resumos.Imovel.class).list();
    }

    @Override
    public Optional<Resumos.Imovel> imovel(TenantId t, String id) {
        if (!uuid(id)) return Optional.empty();
        return jdbc.sql(IMOVEL + " and id = :id::uuid").param("t", t.valor()).param("id", id).query(Resumos.Imovel.class).optional();
    }

    @Override
    public List<Resumos.Pessoa> locatarios(TenantId t) {
        return jdbc.sql("select id::text as id, nome from app.pessoa where tenant_id = :t and papel = 'locatario' order by nome").param("t", t.valor())
                .query(Resumos.Pessoa.class).list();
    }

    @Override
    public boolean locatarioExiste(TenantId t, String id) {
        if (!uuid(id)) return false;
        return jdbc.sql("select exists (select 1 from app.pessoa where tenant_id = :t and id = :id::uuid)").param("t", t.valor()).param("id", id)
                .query(Boolean.class).single();
    }

    @Override
    public List<Resumos.Pessoa> corretores(TenantId t) {
        return jdbc.sql("select id::text as id, nome from app.corretor where tenant_id = :t and desligado_em is null order by nome").param("t", t.valor())
                .query(Resumos.Pessoa.class).list();
    }

    @Override
    public Optional<String> planoVigente(TenantId t, String imovelId, LocalDate inicio) {
        if (!uuid(imovelId) || inicio == null) return Optional.empty();
        return jdbc.sql("""
                select p.id::text from app.plano_remuneracao p
                where p.tenant_id = :t
                  and p.nivel = coalesce((select k.nivel from app.origem o join app.corretor k on k.id = o.corretor_id
                                          where o.imovel_id = :im::uuid), 'partner')
                  and p.vigente_de <= :inicio and (p.vigente_ate is null or p.vigente_ate >= :inicio)
                order by p.versao desc limit 1
                """).param("t", t.valor()).param("im", imovelId).param("inicio", Date.valueOf(inicio)).query(String.class).optional();
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
