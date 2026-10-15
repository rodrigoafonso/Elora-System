package br.com.elora.platform.locacao.domain;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Contrato de locação (agregado): dados + histórico de reajustes. */
public final class ContratoLocacao {
    private final String id;
    private DadosContrato dados;
    private final List<Reajuste> reajustes;
    private final long versao;

    public ContratoLocacao(String id, DadosContrato dados, List<Reajuste> reajustes, long versao) {
        this.id = id;
        this.dados = dados;
        this.reajustes = new ArrayList<>(reajustes);
        this.versao = versao;
    }

    /** Novo contrato: valida as travas legais antes de existir. */
    public static ContratoLocacao novo(String id, DadosContrato dados, boolean imovelJaAlugado) {
        exigir(RegrasDoContrato.validar(dados, imovelJaAlugado, true));
        return new ContratoLocacao(id, dados, List.of(), 0);
    }

    /** Edição: o imóvel fica travado (como no protótipo). */
    public void atualizar(DadosContrato novos, boolean imovelJaAlugado) {
        DadosContrato d = novos.comImovel(dados.imovelId());
        exigir(RegrasDoContrato.validar(d, imovelJaAlugado, d.garantia() != dados.garantia()));
        this.dados = d;
    }

    public Reajuste reajustar(LocalDate em, BigDecimal pct, BigDecimal novo) {
        exigir(RegrasDoContrato.validarReajuste(ultimoMarco(), em, pct, novo));
        Reajuste r = new Reajuste(em, dados.indice(), pct, dados.aluguel(), novo.setScale(2, RoundingMode.HALF_UP));
        reajustes.add(r);
        this.dados = dados.comAluguel(r.para());
        return r;
    }

    /** Data do último reajuste ou, se não houver, o início do contrato. */
    public LocalDate ultimoMarco() {
        return reajustes.stream().map(Reajuste::em).max(Comparator.naturalOrder()).orElse(dados.inicio());
    }

    private static void exigir(List<Problema> ps) {
        if (!ps.isEmpty()) throw new ProblemasDoContratoException(ps);
    }

    public String id() {
        return id;
    }

    public DadosContrato dados() {
        return dados;
    }

    public List<Reajuste> reajustes() {
        return List.copyOf(reajustes);
    }

    public long versao() {
        return versao;
    }
}
