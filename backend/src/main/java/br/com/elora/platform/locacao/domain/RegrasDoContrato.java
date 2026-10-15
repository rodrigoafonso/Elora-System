package br.com.elora.platform.locacao.domain;

import br.com.elora.platform.locacao.domain.Enums.Garantia;
import br.com.elora.platform.locacao.domain.Enums.StatusContrato;
import br.com.elora.platform.locacao.domain.Enums.Venia;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.EnumSet;
import java.util.Locale;
import java.util.Set;

/**
 * Travas da Lei 8.245/91 e da Lei 10.192/2001 (mesmas do front-end: frontend/src/domain/locacao/regras.ts).
 * O banco repete as principais como CHECK/trigger, para que nenhuma integração passe por fora.
 */
public final class RegrasDoContrato {
    private static final DateTimeFormatter BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final BigDecimal TRES = BigDecimal.valueOf(3);

    private RegrasDoContrato() {}

    /** Meses completos do prazo, contando o dia final. */
    public static long mesesEntre(LocalDate inicio, LocalDate fim) {
        return ChronoUnit.MONTHS.between(inicio, fim.plusDays(1));
    }

    /** Garantias aceitas pela Elora em contrato novo ou troca de garantia. */
    public static final Set<Garantia> GARANTIAS_ACEITAS = EnumSet.of(Garantia.seguro_fianca, Garantia.caucao_dinheiro, Garantia.caucao_bens);

    public static boolean ehCaucao(Garantia g) {
        return g == Garantia.caucao_dinheiro || g == Garantia.caucao_bens;
    }

    /**
     * @param aplicarPoliticaDeGarantia contrato novo ou garantia trocada: vale a política da Elora
     *     (seguro-fiança; caução só com o consentimento do locador). Contratos antigos mantêm a garantia que têm.
     */
    public static List<Problema> validar(DadosContrato c, boolean imovelJaAlugado, boolean aplicarPoliticaDeGarantia) {
        List<Problema> e = new ArrayList<>();
        if (vazio(c.imovelId())) e.add(new Problema("", "Campo obrigatório", "Imóvel"));
        if (vazio(c.locatarioId())) e.add(new Problema("", "Campo obrigatório", "Locatário"));
        if (c.aluguel() == null || c.aluguel().signum() <= 0) e.add(new Problema("", "Campo obrigatório", "Aluguel (R$)"));
        if (c.taxa() == null || c.taxa().signum() < 0 || c.taxa().compareTo(BigDecimal.valueOf(100)) > 0)
            e.add(new Problema("", "Campo obrigatório", "Taxa de administração (%)"));
        if (c.inicio() == null || c.fim() == null || !c.fim().isAfter(c.inicio())) {
            e.add(new Problema("", "Prazo inválido", "A data final precisa ser posterior à inicial."));
            return e;
        }
        if (c.indice() == null)
            e.add(new Problema("Lei 8.245/91, art. 17", "Índice de reajuste não permitido",
                    "O aluguel não pode ser vinculado ao salário mínimo, à variação cambial ou a moeda estrangeira."));
        BigDecimal caucao = c.caucao() == null ? BigDecimal.ZERO : c.caucao();
        if (c.garantia() == Garantia.caucao_dinheiro && caucao.signum() <= 0)
            e.add(new Problema("Lei 8.245/91, art. 38, § 2º", "Informe o valor da caução", "A caução em dinheiro precisa de valor, limitado a três aluguéis."));
        if (c.garantia() == Garantia.caucao_dinheiro && c.aluguel() != null && c.aluguel().signum() > 0 && caucao.compareTo(c.aluguel().multiply(TRES)) > 0)
            e.add(new Problema("Lei 8.245/91, art. 38, § 2º", "Caução acima de três aluguéis",
                    "A caução informada equivale a " + umaCasa(caucao.divide(c.aluguel(), 1, RoundingMode.HALF_UP))
                            + " aluguéis. O limite é o equivalente a três meses."));
        if (c.antecipada() && c.garantia() != Garantia.nenhuma)
            e.add(new Problema("Lei 8.245/91, arts. 20 e 43, III", "Cobrança antecipada com garantia", "Aluguel antecipado só é admitido em contrato sem garantia."));
        if (c.status() == StatusContrato.ativo && mesesEntre(c.inicio(), c.fim()) >= 120 && c.venia() == Venia.pendente)
            e.add(new Problema("Lei 8.245/91, art. 3º", "Falta a vênia conjugal",
                    "Contrato de dez anos ou mais depende de vênia conjugal. Registre a vênia ou marque que não se aplica."));
        if (aplicarPoliticaDeGarantia) {
            if (!GARANTIAS_ACEITAS.contains(c.garantia()))
                e.add(new Problema("", "Garantia fora da política da Elora", "A Elora aceita apenas seguro-fiança. Caução só com o consentimento do locador."));
            else if (ehCaucao(c.garantia()) && c.consentimentoCaucaoEm() == null)
                e.add(new Problema("", "Falta o consentimento do locador",
                        "Caução só é aceita com o consentimento do locador. Informe a data em que ele autorizou e guarde a autorização por escrito."));
        }
        if (c.status() == StatusContrato.ativo && (vazio(c.seguroImovelSeguradora()) || c.seguroImovelFim() == null))
            e.add(new Problema("", "Falta o seguro do imóvel",
                    "Pergunte ao cliente e informe a seguradora e até quando o seguro do imóvel vale. Ele precisa estar em vigor durante todo o contrato."));
        else if (c.status() == StatusContrato.ativo && c.seguroImovelFim().isBefore(c.inicio()))
            e.add(new Problema("", "Seguro do imóvel fora do prazo", "O seguro do imóvel precisa valer desde o início do contrato."));
        if (c.status() == StatusContrato.ativo && imovelJaAlugado)
            e.add(new Problema("", "Imóvel já alugado", "Este imóvel já tem um contrato ativo. Encerre o anterior antes de ativar outro."));
        if (c.status() != StatusContrato.ativo && c.encerradoEm() == null)
            e.add(new Problema("", "Campo obrigatório", "Data de encerramento"));
        return e;
    }

    /** Lei 10.192/2001, art. 2º, § 1º: periodicidade mínima anual a partir do último marco. */
    public static List<Problema> validarReajuste(LocalDate ultimoMarco, LocalDate em, BigDecimal pct, BigDecimal novo) {
        if (em == null || pct == null || novo == null || novo.signum() <= 0)
            return List.of(new Problema("", "Dados do reajuste", "Informe a data, a variação do índice e o novo aluguel."));
        List<Problema> e = new ArrayList<>();
        LocalDate minimo = ultimoMarco.plusMonths(12);
        if (em.isBefore(minimo))
            e.add(new Problema("Lei 10.192/2001, art. 2º, § 1º", "Reajuste antes de um ano",
                    "O último marco é " + BR.format(ultimoMarco) + ". O aluguel só pode ser reajustado a partir de " + BR.format(minimo) + "."));
        if (pct.compareTo(BigDecimal.valueOf(-30)) < 0 || pct.compareTo(BigDecimal.valueOf(60)) > 0)
            e.add(new Problema("", "Variação fora do esperado", "Confira a variação acumulada do índice nos doze meses."));
        return e;
    }

    private static boolean vazio(String s) {
        return s == null || s.isBlank();
    }

    private static String umaCasa(BigDecimal v) {
        NumberFormat f = NumberFormat.getNumberInstance(Locale.of("pt", "BR"));
        f.setMaximumFractionDigits(1);
        return f.format(v);
    }
}
