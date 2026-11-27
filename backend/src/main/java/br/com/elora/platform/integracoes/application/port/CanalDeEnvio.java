package br.com.elora.platform.integracoes.application.port;

import br.com.elora.platform.integracoes.domain.ResultadoEnvio;
import br.com.elora.platform.integracoes.domain.SituacaoCanal;
import java.util.List;

/** Adaptador de um serviço externo (WhatsApp, e-mail, rede social...). Só é chamado depois de uma aprovação. */
public interface CanalDeEnvio {
    String canal();

    String nome();

    SituacaoCanal situacao();

    /** Nomes das variáveis de ambiente que faltam (nunca os valores). */
    List<String> faltando();

    /** O que falta, além das variáveis, para conectar de verdade. */
    String comoConectar();

    ResultadoEnvio enviar(String destino, String texto);
}
