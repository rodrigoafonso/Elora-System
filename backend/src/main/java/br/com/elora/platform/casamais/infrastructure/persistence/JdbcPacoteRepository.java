package br.com.elora.platform.casamais.infrastructure.persistence;

import br.com.elora.platform.casamais.application.port.PacoteRepository;
import br.com.elora.platform.casamais.domain.Cliente;
import br.com.elora.platform.casamais.domain.ItemPacote;
import br.com.elora.platform.casamais.domain.Pacote;
import br.com.elora.platform.casamais.domain.PerfilCliente;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Pacotes em app.cm_pacote; os pedidos do pacote são os de app.cm_pedido com o mesmo pacote_id. */
public class JdbcPacoteRepository implements PacoteRepository {
    private static final String SELECT = """
            select k.*, coalesce((select array_agg(p.id order by p.criado_em) from app.cm_pedido p
                                  where p.tenant_id = k.tenant_id and p.pacote_id = k.id), '{}') as pedidos
            from app.cm_pacote k
            """;
    private final JdbcClient jdbc;

    public JdbcPacoteRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Pacote> listar(TenantId t) {
        return jdbc.sql(SELECT + " where k.tenant_id = ? order by k.data, k.criado_em limit 500").param(t.valor()).query((rs, n) -> mapear(rs)).list();
    }

    @Override
    public Optional<Pacote> buscar(TenantId t, String id) {
        return jdbc.sql(SELECT + " where k.tenant_id = ? and k.id = ?").params(t.valor(), id).query((rs, n) -> mapear(rs)).optional();
    }

    @Override
    public Pacote salvar(TenantId t, Pacote pk) {
        jdbc.sql("""
                insert into app.cm_pacote (tenant_id, id, tipo, cliente_perfil, cliente_ref, cliente_nome, cliente_telefone, empresa_id, imovel_ref,
                  corretor_ref, corretor_nome, data, origem, pessoas, pet, observacao, busca_imovel, itens, guia_enviado_em, criado_em)
                values (:t, :id, 'chegada', :perfil, :ref, :nome, :tel, :empresa, :imovel, :corretor, :corretorNome, :data, :origem, :pessoas, :pet,
                  :obs, :busca, string_to_array(:itens, ','), :guia, :criado)
                on conflict (tenant_id, id) do update set guia_enviado_em = excluded.guia_enviado_em
                """)
                .param("t", t.valor()).param("id", pk.id()).param("perfil", pk.cliente().perfil().chave()).param("ref", pk.cliente().referencia())
                .param("nome", pk.cliente().nome()).param("tel", pk.cliente().telefone()).param("empresa", pk.empresaId()).param("imovel", pk.imovelRef())
                .param("corretor", pk.corretorRef()).param("corretorNome", pk.corretorNome()).param("data", Date.valueOf(pk.data()))
                .param("origem", pk.origem()).param("pessoas", pk.pessoas()).param("pet", pk.pet()).param("obs", pk.observacao())
                .param("busca", pk.buscaImovel()).param("itens", String.join(",", pk.itens().stream().map(ItemPacote::chave).toList()))
                .param("guia", pk.guiaEnviadoEm() == null ? null : Date.valueOf(pk.guiaEnviadoEm())).param("criado", Timestamp.from(pk.criadoEm()))
                .update();
        return buscar(t, pk.id()).orElseThrow();
    }

    @Override
    public String novoId() {
        return "PK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private static Pacote mapear(ResultSet rs) throws SQLException {
        String[] itens = (String[]) rs.getArray("itens").getArray();
        String[] pedidos = (String[]) rs.getArray("pedidos").getArray();
        Date guia = rs.getDate("guia_enviado_em");
        return new Pacote(rs.getString("id"),
                new Cliente(PerfilCliente.daChave(rs.getString("cliente_perfil")), rs.getString("cliente_ref"), rs.getString("cliente_nome"),
                        rs.getString("cliente_telefone")),
                rs.getString("empresa_id"), rs.getString("imovel_ref"), rs.getString("corretor_ref"), rs.getString("corretor_nome"),
                rs.getDate("data").toLocalDate(), rs.getString("origem"), rs.getInt("pessoas"), rs.getBoolean("pet"), rs.getString("observacao"),
                rs.getString("busca_imovel"), Arrays.stream(itens).map(k -> ItemPacote.daChave(k).orElseThrow()).toList(), Arrays.asList(pedidos),
                guia == null ? null : guia.toLocalDate(), rs.getTimestamp("criado_em").toInstant());
    }
}
