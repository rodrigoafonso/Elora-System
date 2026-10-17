package br.com.elora.platform.casamais.infrastructure.persistence;

import br.com.elora.platform.casamais.application.port.EmpresaRepository;
import br.com.elora.platform.casamais.domain.Empresa;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

public class JdbcEmpresaRepository implements EmpresaRepository {
    private static final String SELECT = "select id, nome, cidade, contato, whatsapp, email, auxilio, observacao from app.cm_empresa";
    private final JdbcClient jdbc;

    public JdbcEmpresaRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Empresa> listar(TenantId t) {
        return jdbc.sql(SELECT + " where tenant_id = ? order by nome").param(t.valor()).query(Empresa.class).list();
    }

    @Override
    public Optional<Empresa> buscar(TenantId t, String id) {
        return jdbc.sql(SELECT + " where tenant_id = ? and id = ?").params(t.valor(), id).query(Empresa.class).optional();
    }

    @Override
    public Empresa salvar(TenantId t, Empresa e) {
        jdbc.sql("""
                insert into app.cm_empresa (tenant_id, id, nome, cidade, contato, whatsapp, email, auxilio, observacao)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict (tenant_id, id) do update set nome = excluded.nome, cidade = excluded.cidade, contato = excluded.contato,
                  whatsapp = excluded.whatsapp, email = excluded.email, auxilio = excluded.auxilio, observacao = excluded.observacao
                """).params(t.valor(), e.id(), e.nome(), e.cidade(), e.contato(), e.whatsapp(), e.email(), e.auxilio(), e.observacao()).update();
        return buscar(t, e.id()).orElseThrow();
    }

    @Override
    public String novoId() {
        return "EM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }
}
