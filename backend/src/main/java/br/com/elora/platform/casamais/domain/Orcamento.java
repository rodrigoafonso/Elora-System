package br.com.elora.platform.casamais.domain;

import br.com.elora.platform.shared.domain.Dinheiro;
import java.time.LocalDate;

public record Orcamento(Dinheiro valor, String prazo, String observacao, LocalDate em) {}
