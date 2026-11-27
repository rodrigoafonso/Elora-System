package br.com.elora.platform.integracoes.infrastructure;

import br.com.elora.platform.integracoes.application.port.CanalDeEnvio;
import br.com.elora.platform.integracoes.domain.ResultadoEnvio;
import br.com.elora.platform.integracoes.domain.SituacaoCanal;
import java.util.List;
import java.util.function.UnaryOperator;

/**
 * Adaptador de canal ainda sem envio real. Mostra quais variáveis faltam e, ao "enviar", devolve demonstração:
 * nada sai da empresa e o resultado diz isso. Quando o envio real for construído e testado, ele substitui esta classe.
 */
public final class CanalNaoConectado implements CanalDeEnvio {
    private final String canal;
    private final String nome;
    private final List<String> variaveis;
    private final String comoConectar;
    private final UnaryOperator<String> ambiente;

    public CanalNaoConectado(String canal, String nome, List<String> variaveis, String comoConectar, UnaryOperator<String> ambiente) {
        this.canal = canal;
        this.nome = nome;
        this.variaveis = List.copyOf(variaveis);
        this.comoConectar = comoConectar;
        this.ambiente = ambiente;
    }

    @Override
    public String canal() {
        return canal;
    }

    @Override
    public String nome() {
        return nome;
    }

    @Override
    public List<String> faltando() {
        return variaveis.stream().filter(v -> { String x = ambiente.apply(v); return x == null || x.isBlank(); }).toList();
    }

    @Override
    public SituacaoCanal situacao() {
        return faltando().isEmpty() ? SituacaoCanal.CREDENCIAIS_SEM_ADAPTADOR : SituacaoCanal.DEMONSTRACAO;
    }

    @Override
    public String comoConectar() {
        return comoConectar;
    }

    @Override
    public ResultadoEnvio enviar(String destino, String texto) {
        return ResultadoEnvio.demonstracao(situacao() == SituacaoCanal.DEMONSTRACAO
                ? nome + " não conectado (faltam " + String.join(", ", faltando()) + "): nada foi enviado."
                : nome + ": as credenciais existem, mas o envio real ainda não foi construído e testado. Nada foi enviado.");
    }
}
