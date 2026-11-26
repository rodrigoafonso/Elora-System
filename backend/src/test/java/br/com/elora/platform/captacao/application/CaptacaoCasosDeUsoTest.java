package br.com.elora.platform.captacao.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.captacao.application.CaptacaoCasosDeUso.NovaFonte;
import br.com.elora.platform.captacao.application.port.FonteRepository;
import br.com.elora.platform.captacao.application.port.LeadRecebidoRepository;
import br.com.elora.platform.captacao.domain.Fonte;
import br.com.elora.platform.captacao.domain.LeadRecebido;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class CaptacaoCasosDeUsoTest {
    static final TenantId ELORA = new TenantId("elora");
    static final TenantId OUTRA = new TenantId("outra");
    Instant agora = Instant.parse("2026-11-26T12:00:00Z");

    final Relogio relogio = new Relogio() {
        public Instant agora() {
            return agora;
        }

        public LocalDate hoje() {
            return LocalDate.ofInstant(agora, ZoneOffset.UTC);
        }
    };

    /** Repositórios em memória. */
    static class Fontes implements FonteRepository {
        final Map<String, Object[]> por = new HashMap<>(); // id -> {tenant, fonte, hash}

        public void salvar(TenantId t, Fonte f, String h) { por.put(f.id(), new Object[] { t, f, h }); }
        public void atualizar(TenantId t, Fonte f) { por.get(f.id())[1] = f; }
        public void trocarCodigo(TenantId t, String id, String h) { por.get(id)[2] = h; }
        public Optional<Fonte> porId(TenantId t, String id) { var x = por.get(id); return x != null && x[0].equals(t) ? Optional.of((Fonte) x[1]) : Optional.empty(); }
        public List<Fonte> listar(TenantId t) { return por.values().stream().filter(x -> x[0].equals(t)).map(x -> (Fonte) x[1]).toList(); }
        public Optional<FonteDoCodigo> porCodigo(String h) { return por.values().stream().filter(x -> x[2].equals(h)).findFirst().map(x -> new FonteDoCodigo((TenantId) x[0], (Fonte) x[1])); }
        public boolean corretorExiste(TenantId t, String id) { return "k1".equals(id); }
    }

    static class Recebidos implements LeadRecebidoRepository {
        final List<Object[]> linhas = new ArrayList<>(); // {tenant, lead}

        public long salvar(TenantId t, LeadRecebido l) {
            long id = linhas.size() + 1;
            linhas.add(new Object[] { t, new LeadRecebido(id, l.fonteId(), l.nome(), l.telefone(), l.email(), l.mensagem(), l.regiao(), l.valorMax(), l.imovelCodigo(),
                    l.consentimento(), l.situacao(), l.duplicadoDe(), l.recebidoEm()) });
            return id;
        }
        List<LeadRecebido> de(TenantId t) { return linhas.stream().filter(x -> x[0].equals(t)).map(x -> (LeadRecebido) x[1]).toList(); }
        public Optional<Long> mesmoContato(TenantId t, String chave, String email, Instant desde) {
            return de(t).stream().filter(l -> !"descartado".equals(l.situacao()) && !l.recebidoEm().isBefore(desde))
                    .filter(l -> (chave != null && chave.equals(LeadRecebido.chaveTelefone(l.telefone()))) || (email != null && email.equals(l.email())))
                    .map(LeadRecebido::id).reduce((a, b) -> b);
        }
        public int recebidosDaFonteDesde(TenantId t, String f, Instant desde) { return (int) de(t).stream().filter(l -> l.fonteId().equals(f) && !l.recebidoEm().isBefore(desde)).count(); }
        public List<LeadRecebido> listar(TenantId t, String sit, int lim) { return de(t).stream().filter(l -> sit == null || sit.equals(l.situacao())).limit(lim).toList(); }
        public void marcar(TenantId t, long id, String sit) {
            for (Object[] x : linhas) { LeadRecebido l = (LeadRecebido) x[1]; if (x[0].equals(t) && Objects.equals(l.id(), id)) x[1] = new LeadRecebido(l.id(), l.fonteId(), l.nome(), l.telefone(), l.email(), l.mensagem(), l.regiao(), l.valorMax(), l.imovelCodigo(), l.consentimento(), sit, l.duplicadoDe(), l.recebidoEm()); }
        }
    }

    final Fontes fontes = new Fontes();
    final Recebidos recebidos = new Recebidos();
    final CaptacaoCasosDeUso casos = new CaptacaoCasosDeUso(fontes, recebidos, relogio);

    NovaFonte site() {
        return new NovaFonte("Site Elora", "site", "Site", "Locação", null);
    }

    @Test
    void recebeLeadPeloCodigoNoTenantCerto() {
        var c = casos.criarFonte(ELORA, site());
        casos.criarFonte(OUTRA, site());
        var r = casos.receber(c.codigo(), Map.of("nome", "Maria", "telefone", "(12) 99999-0000"));
        assertThat(r.situacao()).isEqualTo("novo");
        assertThat(casos.caixaDeEntrada(ELORA, null)).hasSize(1);
        assertThat(casos.caixaDeEntrada(OUTRA, null)).isEmpty();
    }

    @Test
    void mesmoContatoEm30DiasEhDuplicado() {
        var c = casos.criarFonte(ELORA, site());
        casos.receber(c.codigo(), Map.of("nome", "Maria", "telefone", "+55 12 99999-0000"));
        agora = agora.plusSeconds(3600);
        assertThat(casos.receber(c.codigo(), Map.of("nome", "Maria S.", "telefone", "(12) 99999-0000")).situacao()).isEqualTo("duplicado");
        agora = agora.plusSeconds(31L * 24 * 3600);
        assertThat(casos.receber(c.codigo(), Map.of("nome", "Maria", "telefone", "12999990000")).situacao()).isEqualTo("novo");
    }

    @Test
    void roboViraDescartadoSemErro() {
        var c = casos.criarFonte(ELORA, site());
        assertThat(casos.receber(c.codigo(), Map.of("nome", "Bot", "email", "bot@x.com", "website", "spam")).situacao()).isEqualTo("descartado");
    }

    @Test
    void codigoInvalidoPausadoOuTrocadoNaoRecebe() {
        var c = casos.criarFonte(ELORA, site());
        assertThatThrownBy(() -> casos.receber("abc", Map.of())).isInstanceOf(RegraVioladaException.class);
        assertThatThrownBy(() -> casos.receber("a".repeat(32), Map.of("nome", "x", "email", "x@x.com"))).isInstanceOf(NaoEncontradoException.class);
        var nova = casos.trocarCodigo(ELORA, c.fonte().id());
        assertThatThrownBy(() -> casos.receber(c.codigo(), Map.of("nome", "x", "email", "x@x.com"))).isInstanceOf(NaoEncontradoException.class);
        casos.alterarFonte(ELORA, c.fonte().id(), site(), false);
        assertThatThrownBy(() -> casos.receber(nova.codigo(), Map.of("nome", "x", "email", "x@x.com"))).hasMessageContaining("pausada");
    }

    @Test
    void limitePorHora() {
        var c = casos.criarFonte(ELORA, site());
        for (int i = 0; i < CaptacaoCasosDeUso.LIMITE_POR_HORA; i++) casos.receber(c.codigo(), Map.of("nome", "L" + i, "email", "l" + i + "@x.com"));
        assertThatThrownBy(() -> casos.receber(c.codigo(), Map.of("nome", "Z", "email", "z@x.com"))).hasMessageContaining("Muitos envios");
        agora = agora.plusSeconds(3601);
        assertThat(casos.receber(c.codigo(), Map.of("nome", "Z", "email", "z@x.com")).situacao()).isEqualTo("novo");
    }

    @Test
    void corretorPrecisaExistir() {
        assertThatThrownBy(() -> casos.criarFonte(ELORA, new NovaFonte("Portal", "portal", "Portal", "Locação", "k9"))).hasMessageContaining("Corretor");
        assertThat(casos.criarFonte(ELORA, new NovaFonte("Portal", "portal", "Portal", "Compra", "k1")).fonte().corretorId()).isEqualTo("k1");
    }
}
