package br.com.elora.platform.shared.infrastructure;

import br.com.elora.platform.shared.domain.Relogio;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import org.springframework.stereotype.Component;

/** "Hoje" no fuso de Brasília: prazos legais e vencimentos contam em dias locais. */
@Component
public class RelogioDoSistema implements Relogio {
    private final Clock clock = Clock.system(ZoneId.of("America/Sao_Paulo"));

    @Override
    public Instant agora() {
        return clock.instant();
    }

    @Override
    public LocalDate hoje() {
        return LocalDate.now(clock);
    }
}
