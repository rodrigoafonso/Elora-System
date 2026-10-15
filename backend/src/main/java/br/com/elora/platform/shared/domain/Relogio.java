package br.com.elora.platform.shared.domain;

import java.time.Instant;
import java.time.LocalDate;

/** Porta para "agora" — permite testes determinísticos. */
public interface Relogio {
    Instant agora();

    LocalDate hoje();
}
