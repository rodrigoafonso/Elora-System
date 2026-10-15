package br.com.elora.platform.shared.domain;

/** Regra de negócio violada. A mensagem é escrita para o usuário final (vai para o problem+json). */
public class RegraVioladaException extends RuntimeException {
    private static final long serialVersionUID = 1L;

    public RegraVioladaException(String mensagem) {
        super(mensagem);
    }

    public static void exigir(boolean condicao, String mensagem) {
        if (!condicao) throw new RegraVioladaException(mensagem);
    }
}
