package br.com.elora.platform.divulgacao.domain;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/** Um imóvel enviado a um cliente, com as aberturas do link (mais recente primeiro). */
public record Envio(String token, String imovelId, String imovelCodigo, String leadRef, String leadNome, String corretorId, Instant criadoEm,
        List<Instant> aberturas) {

    /** Aberturas seguidas (o navegador recarregando, o cliente voltando à aba) contam uma vez. */
    public static final Duration INTERVALO_MINIMO = Duration.ofMinutes(2);

    public Envio {
        aberturas = aberturas == null ? List.of() : List.copyOf(aberturas);
    }

    public boolean contaComoNovaAbertura(Instant agora) {
        return aberturas.isEmpty() || Duration.between(aberturas.get(0), agora).compareTo(INTERVALO_MINIMO) >= 0;
    }

    public Instant ultimaAbertura() {
        return aberturas.isEmpty() ? null : aberturas.get(0);
    }
}
