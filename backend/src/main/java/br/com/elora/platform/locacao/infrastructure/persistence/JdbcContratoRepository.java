package br.com.elora.platform.locacao.infrastructure.persistence;

import br.com.elora.platform.locacao.application.port.ContratoRepository;
import br.com.elora.platform.locacao.domain.ContratoLocacao;
import br.com.elora.platform.locacao.domain.DadosContrato;
import br.com.elora.platform.locacao.domain.Enums.FormaPagamento;
import br.com.elora.platform.locacao.domain.Enums.Garantia;
import br.com.elora.platform.locacao.domain.Enums.IndiceReajuste;
import br.com.elora.platform.locacao.domain.Enums.StatusContrato;
import br.com.elora.platform.locacao.domain.Enums.TipoLocacao;
import br.com.elora.platform.locacao.domain.Enums.Venia;
import br.com.elora.platform.locacao.domain.Reajuste;
import br.com.elora.platform.shared.domain.TenantId;
import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.simple.JdbcClient;

/** Contratos sobre app.contrato_locacao (V1 + V4) e app.contrato_reajuste. */
public class JdbcContratoRepository implements ContratoRepository {
    private static final String SELECT = "select * from app.contrato_locacao where tenant_id = :t and status <> 'rascunho'";
    private final JdbcClient jdbc;

    public JdbcContratoRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<ContratoLocacao> listar(TenantId t) {
        Map<String, List<Reajuste>> reajustes = jdbc.sql("select * from app.contrato_reajuste where tenant_id = :t order by em")
                .param("t", t.valor()).query((rs, n) -> Map.entry(rs.getString("contrato_id"), reajuste(rs))).list().stream()
                .collect(Collectors.groupingBy(Map.Entry::getKey, Collectors.mapping(Map.Entry::getValue, Collectors.toList())));
        return jdbc.sql(SELECT + " order by inicio desc").param("t", t.valor())
                .query((rs, n) -> mapear(rs, reajustes.getOrDefault(rs.getString("id"), List.of()))).list();
    }

    @Override
    public Optional<ContratoLocacao> buscar(TenantId t, String id) {
        if (!uuid(id)) return Optional.empty();
        List<Reajuste> rs = jdbc.sql("select * from app.contrato_reajuste where tenant_id = :t and contrato_id = :id::uuid order by em")
                .param("t", t.valor()).param("id", id).query((r, n) -> reajuste(r)).list();
        return jdbc.sql(SELECT + " and id = :id::uuid").param("t", t.valor()).param("id", id).query((r, n) -> mapear(r, rs)).optional();
    }

    @Override
    public boolean imovelTemOutroAtivo(TenantId t, String imovelId, String excetoContratoId) {
        if (!uuid(imovelId)) return false;
        return jdbc.sql("""
                select exists (select 1 from app.contrato_locacao where tenant_id = :t and imovel_id = :im::uuid and status = 'ativo'
                               and (cast(:exceto as text) is null or id <> cast(:exceto as uuid)))
                """).param("t", t.valor()).param("im", imovelId).param("exceto", excetoContratoId).query(Boolean.class).single();
    }

    @Override
    public ContratoLocacao salvar(TenantId t, ContratoLocacao c, String planoId) {
        DadosContrato d = c.dados();
        var q = jdbc.sql("""
                insert into app.contrato_locacao (tenant_id, id, imovel_id, locador_id, locatario_id, tipo, inicio, fim, aluguel, taxa_adm_pct,
                  dia_vencimento, cobranca_antecipada, indice, garantia, caucao_valor, venia_conjugal, plano_id, status, encerrado_em,
                  forma_pagamento, seguradora, apolice, apolice_fim, premio, condominio, iptu, intermediacao, corretor_loc_id, dia_repasse,
                  extra_loc_desc, extra_loc_valor, extra_prop_desc, extra_prop_valor, clausulas, doc_contrato, doc_vistoria, doc_garantia,
                  doc_seguro, versao)
                values (:t, :id::uuid, :imovel::uuid, (select proprietario_id from app.imovel where id = :imovel::uuid), :locatario::uuid,
                  :tipo::app.tipo_locacao, :inicio, :fim, :aluguel, :taxa, :venc, :antecipada, :indice::app.indice_reajuste,
                  :garantia::app.garantia, :caucao, :venia::app.venia, :plano::uuid, :status::app.status_contrato, :encerrado,
                  :forma, :seguradora, :apolice, :apoliceFim, :premio, :cond, :iptu, :interm, :corretorLoc::uuid, :diaRepasse,
                  :extraLocDesc, :extraLocValor, :extraPropDesc, :extraPropValor, :clausulas, :docContrato, :docVistoria, :docGarantia,
                  :docSeguro, 0)
                on conflict (id) do update set locatario_id = excluded.locatario_id, tipo = excluded.tipo, inicio = excluded.inicio,
                  fim = excluded.fim, aluguel = excluded.aluguel, taxa_adm_pct = excluded.taxa_adm_pct, dia_vencimento = excluded.dia_vencimento,
                  cobranca_antecipada = excluded.cobranca_antecipada, indice = excluded.indice, garantia = excluded.garantia,
                  caucao_valor = excluded.caucao_valor, venia_conjugal = excluded.venia_conjugal,
                  plano_id = coalesce(app.contrato_locacao.plano_id, excluded.plano_id), status = excluded.status,
                  encerrado_em = excluded.encerrado_em, forma_pagamento = excluded.forma_pagamento, seguradora = excluded.seguradora,
                  apolice = excluded.apolice, apolice_fim = excluded.apolice_fim, premio = excluded.premio, condominio = excluded.condominio,
                  iptu = excluded.iptu, intermediacao = excluded.intermediacao, corretor_loc_id = excluded.corretor_loc_id,
                  dia_repasse = excluded.dia_repasse, extra_loc_desc = excluded.extra_loc_desc, extra_loc_valor = excluded.extra_loc_valor,
                  extra_prop_desc = excluded.extra_prop_desc, extra_prop_valor = excluded.extra_prop_valor, clausulas = excluded.clausulas,
                  doc_contrato = excluded.doc_contrato, doc_vistoria = excluded.doc_vistoria, doc_garantia = excluded.doc_garantia,
                  doc_seguro = excluded.doc_seguro, versao = app.contrato_locacao.versao + 1
                where app.contrato_locacao.tenant_id = :t and app.contrato_locacao.versao = :versao
                """);
        int linhas = q.param("t", t.valor()).param("id", c.id()).param("imovel", d.imovelId()).param("locatario", d.locatarioId())
                .param("tipo", d.tipo().name()).param("inicio", data(d.inicio())).param("fim", data(d.fim())).param("aluguel", d.aluguel())
                .param("taxa", d.taxa()).param("venc", d.venc() == null ? 5 : d.venc()).param("antecipada", d.antecipada())
                .param("indice", d.indice().name()).param("garantia", d.garantia().name()).param("caucao", d.caucao())
                .param("venia", d.venia().noBanco()).param("plano", planoId).param("status", d.status().name())
                .param("encerrado", data(d.encerradoEm())).param("forma", d.formaPagamento() == null ? "boleto" : d.formaPagamento().name())
                .param("seguradora", d.seguradora()).param("apolice", d.apolice()).param("apoliceFim", data(d.apoliceFim()))
                .param("premio", d.premio()).param("cond", d.cond()).param("iptu", d.iptu()).param("interm", d.intermediacao())
                .param("corretorLoc", d.corretorLocId()).param("diaRepasse", d.diaRepasse()).param("extraLocDesc", d.extraLocDesc())
                .param("extraLocValor", d.extraLocValor()).param("extraPropDesc", d.extraPropDesc()).param("extraPropValor", d.extraPropValor())
                .param("clausulas", d.clausulas()).param("docContrato", d.docContrato()).param("docVistoria", d.docVistoria())
                .param("docGarantia", d.docGarantia()).param("docSeguro", d.docSeguro()).param("versao", c.versao()).update();
        if (linhas == 0) throw new OptimisticLockingFailureException("O contrato foi alterado por outra pessoa. Atualize a tela.");

        // Reajustes novos (o histórico é imutável: só inserimos o que ainda não está no banco).
        for (Reajuste r : c.reajustes())
            jdbc.sql("""
                    insert into app.contrato_reajuste (tenant_id, contrato_id, em, indice, pct, de, para)
                    values (:t, :c::uuid, :em, :indice::app.indice_reajuste, :pct, :de, :para) on conflict (contrato_id, em) do nothing
                    """).param("t", t.valor()).param("c", c.id()).param("em", data(r.em())).param("indice", r.indice().name())
                    .param("pct", r.pct()).param("de", r.de()).param("para", r.para()).update();
        return buscar(t, c.id()).orElseThrow();
    }

    @Override
    public String novoId() {
        return UUID.randomUUID().toString();
    }

    private static boolean uuid(String s) {
        try {
            UUID.fromString(s);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private static Date data(LocalDate d) {
        return d == null ? null : Date.valueOf(d);
    }

    private static LocalDate data(ResultSet rs, String c) throws SQLException {
        Date d = rs.getDate(c);
        return d == null ? null : d.toLocalDate();
    }

    private static Integer inteiro(ResultSet rs, String c) throws SQLException {
        int v = rs.getInt(c);
        return rs.wasNull() ? null : v;
    }

    private static Reajuste reajuste(ResultSet rs) throws SQLException {
        return new Reajuste(data(rs, "em"), IndiceReajuste.valueOf(rs.getString("indice")), rs.getBigDecimal("pct"), rs.getBigDecimal("de"),
                rs.getBigDecimal("para"));
    }

    private static ContratoLocacao mapear(ResultSet rs, List<Reajuste> reajustes) throws SQLException {
        DadosContrato d = new DadosContrato(
                rs.getString("imovel_id"), rs.getString("locatario_id"), TipoLocacao.valueOf(rs.getString("tipo")), data(rs, "inicio"),
                data(rs, "fim"), rs.getBigDecimal("aluguel"), rs.getBigDecimal("taxa_adm_pct"), inteiro(rs, "dia_vencimento"),
                FormaPagamento.valueOf(rs.getString("forma_pagamento")), IndiceReajuste.valueOf(rs.getString("indice")),
                Garantia.valueOf(rs.getString("garantia")), rs.getBigDecimal("caucao_valor"), rs.getString("seguradora"), rs.getString("apolice"),
                data(rs, "apolice_fim"), rs.getBigDecimal("premio"), rs.getBoolean("cobranca_antecipada"), Venia.doBanco(rs.getString("venia_conjugal")),
                rs.getBigDecimal("condominio"), rs.getBigDecimal("iptu"), rs.getBigDecimal("intermediacao"), rs.getString("corretor_loc_id"),
                inteiro(rs, "dia_repasse"), rs.getString("extra_loc_desc"), rs.getBigDecimal("extra_loc_valor"), rs.getString("extra_prop_desc"),
                rs.getBigDecimal("extra_prop_valor"), rs.getString("clausulas"), rs.getBoolean("doc_contrato"), rs.getBoolean("doc_vistoria"),
                rs.getBoolean("doc_garantia"), rs.getBoolean("doc_seguro"), StatusContrato.valueOf(rs.getString("status")), data(rs, "encerrado_em"));
        return new ContratoLocacao(rs.getString("id"), d, reajustes, rs.getLong("versao"));
    }
}
