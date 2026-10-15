package br.com.elora.platform.locacao.domain;

import br.com.elora.platform.locacao.domain.Enums.FormaPagamento;
import br.com.elora.platform.locacao.domain.Enums.Garantia;
import br.com.elora.platform.locacao.domain.Enums.IndiceReajuste;
import br.com.elora.platform.locacao.domain.Enums.StatusContrato;
import br.com.elora.platform.locacao.domain.Enums.TipoLocacao;
import br.com.elora.platform.locacao.domain.Enums.Venia;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Dados editáveis do contrato (o formulário). Valores em reais. */
public record DadosContrato(
        String imovelId, String locatarioId, TipoLocacao tipo, LocalDate inicio, LocalDate fim, BigDecimal aluguel, BigDecimal taxa,
        Integer venc, FormaPagamento formaPagamento, IndiceReajuste indice, Garantia garantia, BigDecimal caucao, String seguradora,
        String apolice, LocalDate apoliceFim, BigDecimal premio, boolean antecipada, Venia venia, BigDecimal cond, BigDecimal iptu,
        BigDecimal intermediacao, String corretorLocId, Integer diaRepasse, String extraLocDesc, BigDecimal extraLocValor,
        String extraPropDesc, BigDecimal extraPropValor, String clausulas, boolean docContrato, boolean docVistoria,
        boolean docGarantia, boolean docSeguro, StatusContrato status, LocalDate encerradoEm,
        /* Política da Elora: caução só com o consentimento do locador. */
        LocalDate consentimentoCaucaoEm,
        /* Seguro do imóvel (contra incêndio): precisa estar em vigor durante todo o contrato. */
        String seguroImovelSeguradora, String seguroImovelApolice, LocalDate seguroImovelFim) {

    /** Mesmo dado com outro imóvel (o imóvel não muda depois do cadastro). */
    public DadosContrato comImovel(String id) {
        return new DadosContrato(id, locatarioId, tipo, inicio, fim, aluguel, taxa, venc, formaPagamento, indice, garantia, caucao, seguradora,
                apolice, apoliceFim, premio, antecipada, venia, cond, iptu, intermediacao, corretorLocId, diaRepasse, extraLocDesc, extraLocValor,
                extraPropDesc, extraPropValor, clausulas, docContrato, docVistoria, docGarantia, docSeguro, status, encerradoEm, consentimentoCaucaoEm,
                seguroImovelSeguradora, seguroImovelApolice, seguroImovelFim);
    }

    public DadosContrato comAluguel(BigDecimal novo) {
        return new DadosContrato(imovelId, locatarioId, tipo, inicio, fim, novo, taxa, venc, formaPagamento, indice, garantia, caucao, seguradora,
                apolice, apoliceFim, premio, antecipada, venia, cond, iptu, intermediacao, corretorLocId, diaRepasse, extraLocDesc, extraLocValor,
                extraPropDesc, extraPropValor, clausulas, docContrato, docVistoria, docGarantia, docSeguro, status, encerradoEm, consentimentoCaucaoEm,
                seguroImovelSeguradora, seguroImovelApolice, seguroImovelFim);
    }
}
