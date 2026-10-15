package br.com.elora.platform.locacao.api;

import br.com.elora.platform.locacao.domain.ContratoLocacao;
import br.com.elora.platform.locacao.domain.DadosContrato;
import br.com.elora.platform.locacao.domain.Enums.FormaPagamento;
import br.com.elora.platform.locacao.domain.Enums.Garantia;
import br.com.elora.platform.locacao.domain.Enums.IndiceReajuste;
import br.com.elora.platform.locacao.domain.Enums.StatusContrato;
import br.com.elora.platform.locacao.domain.Enums.TipoLocacao;
import br.com.elora.platform.locacao.domain.Enums.Venia;
import br.com.elora.platform.locacao.domain.Reajuste;
import br.com.elora.platform.locacao.domain.RegrasDoContrato;
import br.com.elora.platform.locacao.domain.Resumos;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** JSON da Locação (espelha frontend/src/infrastructure/locacao/esquemas.ts). Nulos não são enviados. */
public final class LocacaoDtos {
    private LocacaoDtos() {}

    /** Corpo de criação/edição: os mesmos campos do formulário. */
    public record ContratoRequest(
            String imovelId, @NotNull String locatarioId, @NotNull TipoLocacao tipo, @NotNull LocalDate inicio, @NotNull LocalDate fim,
            @NotNull BigDecimal aluguel, @NotNull BigDecimal taxa, Integer venc, FormaPagamento formaPagamento, @NotNull IndiceReajuste indice,
            @NotNull Garantia garantia, BigDecimal caucao, @Size(max = 120) String seguradora, @Size(max = 60) String apolice, LocalDate apoliceFim,
            BigDecimal premio, boolean antecipada, @NotNull Venia venia, BigDecimal cond, BigDecimal iptu, BigDecimal intermediacao,
            String corretorLocId, Integer diaRepasse, @Size(max = 120) String extraLocDesc, BigDecimal extraLocValor,
            @Size(max = 120) String extraPropDesc, BigDecimal extraPropValor, @Size(max = 4000) String clausulas, boolean docContrato,
            boolean docVistoria, boolean docGarantia, boolean docSeguro, @NotNull StatusContrato status, LocalDate encerradoEm,
            LocalDate consentimentoCaucaoEm, @Size(max = 120) String seguroImovelSeguradora, @Size(max = 60) String seguroImovelApolice,
            LocalDate seguroImovelFim) {

        DadosContrato dados() {
            return new DadosContrato(imovelId, locatarioId, tipo, inicio, fim, aluguel, taxa, venc, formaPagamento, indice, garantia, caucao,
                    seguradora, apolice, apoliceFim, premio, antecipada, venia, cond, iptu, intermediacao, vazioNulo(corretorLocId), diaRepasse,
                    extraLocDesc, extraLocValor, extraPropDesc, extraPropValor, clausulas, docContrato, docVistoria, docGarantia, docSeguro,
                    status, status == StatusContrato.ativo ? null : encerradoEm,
                    RegrasDoContrato.ehCaucao(garantia) ? consentimentoCaucaoEm : null, seguroImovelSeguradora, seguroImovelApolice, seguroImovelFim);
        }

        private static String vazioNulo(String s) {
            return s == null || s.isBlank() ? null : s;
        }
    }

    public record ReajusteRequest(@NotNull LocalDate em, @NotNull BigDecimal pct, @NotNull BigDecimal para) {}

    public record ImovelDto(String id, String codigo, String descricao, String bairro, String cidade) {
        static ImovelDto de(Resumos.Imovel i) {
            return new ImovelDto(i.id(), i.codigo(), i.descricao(), i.bairro(), i.cidade());
        }
    }

    public record PessoaDto(String id, String nome) {
        static PessoaDto de(Resumos.Pessoa p) {
            return new PessoaDto(p.id(), p.nome());
        }
    }

    public record ReajusteDto(LocalDate em, IndiceReajuste indice, BigDecimal pct, BigDecimal de, BigDecimal para) {
        static ReajusteDto de(Reajuste r) {
            return new ReajusteDto(r.em(), r.indice(), r.pct(), r.de(), r.para());
        }
    }

    public record ContratoDto(
            String id, String imovelId, String locatarioId, ImovelDto imovel, PessoaDto locatario, String corretorOrigemId, TipoLocacao tipo,
            LocalDate inicio, LocalDate fim, BigDecimal aluguel, BigDecimal taxa, Integer venc, FormaPagamento formaPagamento,
            IndiceReajuste indice, Garantia garantia, BigDecimal caucao, String seguradora, String apolice, LocalDate apoliceFim,
            BigDecimal premio, boolean antecipada, Venia venia, BigDecimal cond, BigDecimal iptu, BigDecimal intermediacao,
            String corretorLocId, Integer diaRepasse, String extraLocDesc, BigDecimal extraLocValor, String extraPropDesc,
            BigDecimal extraPropValor, String clausulas, boolean docContrato, boolean docVistoria, boolean docGarantia, boolean docSeguro,
            StatusContrato status, LocalDate encerradoEm, LocalDate consentimentoCaucaoEm, String seguroImovelSeguradora,
            String seguroImovelApolice, LocalDate seguroImovelFim, List<ReajusteDto> reajustes) {

        static ContratoDto de(ContratoLocacao c, Resumos.Imovel imovel, Resumos.Pessoa locatario) {
            DadosContrato d = c.dados();
            return new ContratoDto(c.id(), d.imovelId(), d.locatarioId(), ImovelDto.de(imovel), PessoaDto.de(locatario), null, d.tipo(),
                    d.inicio(), d.fim(), d.aluguel(), d.taxa(), d.venc(), d.formaPagamento(), d.indice(), d.garantia(), d.caucao(),
                    d.seguradora(), d.apolice(), d.apoliceFim(), d.premio(), d.antecipada(), d.venia(), d.cond(), d.iptu(), d.intermediacao(),
                    d.corretorLocId(), d.diaRepasse(), d.extraLocDesc(), d.extraLocValor(), d.extraPropDesc(), d.extraPropValor(),
                    d.clausulas(), d.docContrato(), d.docVistoria(), d.docGarantia(), d.docSeguro(), d.status(), d.encerradoEm(),
                    d.consentimentoCaucaoEm(), d.seguroImovelSeguradora(), d.seguroImovelApolice(), d.seguroImovelFim(),
                    c.reajustes().stream().map(ReajusteDto::de).toList());
        }
    }
}
