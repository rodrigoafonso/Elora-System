package br.com.elora.platform.locacao.domain;

/** Listas fechadas do contrato. As chaves são as mesmas do front-end e da API. */
public final class Enums {
    private Enums() {}

    public enum TipoLocacao { residencial, nao_residencial, built_to_suit }

    /** Uma só garantia por contrato (Lei 8.245/91, art. 37, parágrafo único). */
    public enum Garantia { nenhuma, seguro_fianca, fianca, caucao_dinheiro, caucao_bens, cessao_quotas_fundo }

    /** Art. 17: não existem opções de salário mínimo, câmbio ou moeda estrangeira. */
    public enum IndiceReajuste { IPCA, IGPM, INPC, IVAR, FIXO_CONTRATUAL }

    public enum FormaPagamento { boleto, pix, transferencia, deposito }

    public enum Venia {
        na("nao_aplicavel"), pendente("pendente"), obtida("obtida");

        private final String noBanco;

        Venia(String noBanco) {
            this.noBanco = noBanco;
        }

        public String noBanco() {
            return noBanco;
        }

        public static Venia doBanco(String v) {
            for (Venia x : values()) if (x.noBanco.equals(v)) return x;
            throw new IllegalArgumentException(v);
        }
    }

    public enum StatusContrato { ativo, rescindido, encerrado }
}
