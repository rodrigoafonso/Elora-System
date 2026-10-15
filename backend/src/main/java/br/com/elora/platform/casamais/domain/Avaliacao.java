package br.com.elora.platform.casamais.domain;

import java.time.LocalDate;

public record Avaliacao(int nota, String comentario, LocalDate em) {}
