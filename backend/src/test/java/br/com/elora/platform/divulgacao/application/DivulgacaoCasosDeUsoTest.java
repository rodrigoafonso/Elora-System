package br.com.elora.platform.divulgacao.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.divulgacao.application.DivulgacaoCasosDeUso.NovoEnvio;
import br.com.elora.platform.divulgacao.application.port.EnvioRepository;
import br.com.elora.platform.divulgacao.application.port.ImoveisPublicos;
import br.com.elora.platform.divulgacao.domain.Envio;
import br.com.elora.platform.divulgacao.domain.PreviaDoImovel;
import br.com.elora.platform.divulgacao.domain.Visitante;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class DivulgacaoCasosDeUsoTest {
    static final TenantId ELORA = new TenantId("elora");
    static final String IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148";
    Instant agora = Instant.parse("2026-10-17T12:00:00Z");

    final Relogio relogio = new Relogio() {
        public Instant agora() {
            return agora;
        }

        public LocalDate hoje() {
            return LocalDate.ofInstant(agora, ZoneOffset.UTC);
        }
    };

    final Map<String, Envio> banco = new HashMap<>();
    final EnvioRepository envios = new EnvioRepository() {
        public void salvar(TenantId t, Envio e) {
            banco.put(e.token(), e);
        }

        public Optional<Envio> porToken(String token) {
            return Optional.ofNullable(banco.get(token));
        }

        public Optional<Envio> doCliente(TenantId t, String imovelId, String leadRef) {
            return banco.values().stream().filter(e -> e.imovelId().equals(imovelId) && leadRef.equals(e.leadRef())).findFirst();
        }

        public List<Envio> listar(TenantId t, String imovelId, String corretorId, int limite) {
            return List.copyOf(banco.values());
        }

        public void registrarAbertura(String token, String tenant, Instant em, String aparelho) {
            Envio e = banco.get(token);
            List<Instant> ab = new ArrayList<>(e.aberturas());
            ab.add(0, em);
            banco.put(token, new Envio(e.token(), e.imovelId(), e.imovelCodigo(), e.leadRef(), e.leadNome(), e.corretorId(), e.criadoEm(), ab));
        }

        public Optional<TenantId> tenantDo(String token) {
            return banco.containsKey(token) ? Optional.of(ELORA) : Optional.empty();
        }
    };

    static PreviaDoImovel imovel(String id, String codigo, boolean autorizado) {
        return new PreviaDoImovel(id, codigo, "Casa", "Centro", "Pindamonhangaba", 3, null, new BigDecimal("5200"), null, false, null, autorizado);
    }

    final ImoveisPublicos imoveis = new ImoveisPublicos() {
        final List<PreviaDoImovel> todos = List.of(imovel("i1", "EL-0112", true), imovel("i2", "EL-0107", false));

        public Optional<PreviaDoImovel> porId(TenantId t, String id) {
            return todos.stream().filter(p -> p.id().equals(id)).findFirst();
        }

        public Optional<PreviaDoImovel> porCodigo(TenantId t, String c) {
            return todos.stream().filter(p -> p.codigo().equalsIgnoreCase(c)).findFirst();
        }

        public boolean corretorExiste(TenantId t, String id) {
            return "c2".equals(id);
        }
    };

    final DivulgacaoCasosDeUso casos = new DivulgacaoCasosDeUso(envios, imoveis, relogio, ELORA);

    @Test
    void mesmoClienteRecebeOMesmoLink() {
        Envio a = casos.criarEnvio(ELORA, new NovoEnvio("i1", "L-02", "Eduardo", "c2"));
        Envio b = casos.criarEnvio(ELORA, new NovoEnvio("i1", "L-02", "Eduardo", "c2"));
        assertThat(b.token()).isEqualTo(a.token());
        assertThat(casos.criarEnvio(ELORA, new NovoEnvio("i1", "L-09", "Paulo", null)).token()).isNotEqualTo(a.token());
    }

    @Test
    void semAutorizacaoEscritaNaoHaLink() {
        assertThatThrownBy(() -> casos.criarEnvio(ELORA, new NovoEnvio("i2", "L-02", null, null))).isInstanceOf(RegraVioladaException.class)
                .hasMessageContaining("art. 20, III");
        assertThat(casos.abrir("EL-0107", null, new Visitante(IPHONE)).previa()).isEmpty();
    }

    @Test
    void robosVeemAPreviaMasSoOClienteConta() {
        Envio e = casos.criarEnvio(ELORA, new NovoEnvio("i1", "L-02", "Eduardo", "c2"));
        var robo = casos.abrir("EL-0112", e.token(), new Visitante("WhatsApp/2.24.8.78 A"));
        assertThat(robo.previa()).isPresent();
        assertThat(robo.contou()).isFalse();
        assertThat(casos.abrir("EL-0112", e.token(), new Visitante(IPHONE)).contou()).isTrue();
        assertThat(casos.abrir("EL-0112", e.token(), new Visitante(IPHONE)).contou()).isFalse(); // menos de 2 minutos
        agora = agora.plusSeconds(600);
        assertThat(casos.abrir("EL-0112", e.token(), new Visitante(IPHONE)).contou()).isTrue();
        assertThat(banco.get(e.token()).aberturas()).hasSize(2);
    }

    @Test
    void codigoDeOutroImovelNaoConta() {
        Envio e = casos.criarEnvio(ELORA, new NovoEnvio("i1", "L-02", "Eduardo", null));
        var r = casos.abrir("EL-0107", e.token(), new Visitante(IPHONE));
        assertThat(r.contou()).isFalse();
        assertThat(casos.abrir("EL-0112", "invalido!", new Visitante(IPHONE)).contou()).isFalse();
    }
}
