package br.com.elora.platform.integracoes.domain;

/**
 * O que aconteceu ao tentar enviar. "demonstracao" quer dizer que o canal não está conectado e nada saiu da empresa:
 * nunca é tratado como envio real.
 */
public record ResultadoEnvio(boolean enviado, boolean demonstracao, String detalhe, String idExterno) {
    public ResultadoEnvio {
        if (enviado && demonstracao) throw new IllegalArgumentException("Um envio não pode ser real e de demonstração ao mesmo tempo.");
        detalhe = detalhe == null ? "" : detalhe;
    }

    public static ResultadoEnvio demonstracao(String detalhe) {
        return new ResultadoEnvio(false, true, detalhe, null);
    }

    public static ResultadoEnvio falhou(String detalhe) {
        return new ResultadoEnvio(false, false, detalhe, null);
    }

    public static ResultadoEnvio enviado(String idExterno) {
        return new ResultadoEnvio(true, false, "Enviado.", idExterno);
    }
}
