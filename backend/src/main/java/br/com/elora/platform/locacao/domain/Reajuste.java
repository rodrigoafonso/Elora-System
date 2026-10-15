package br.com.elora.platform.locacao.domain;

import br.com.elora.platform.locacao.domain.Enums.IndiceReajuste;
import java.math.BigDecimal;
import java.time.LocalDate;

public record Reajuste(LocalDate em, IndiceReajuste indice, BigDecimal pct, BigDecimal de, BigDecimal para) {}
