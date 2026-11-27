package br.com.elora.platform.aprovacoes.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.aprovacoes.application.AprovacoesCasosDeUso.NovoPedido;
import br.com.elora.platform.aprovacoes.application.port.AprovacaoRepository;
import br.com.elora.platform.aprovacoes.domain.Aprovacao;
import br.com.elora.platform.integracoes.application.Integracoes;
import br.com.elora.platform.integracoes.infrastructure.CanaisPadrao;
import br.com.elora.platform.integracoes.domain.SituacaoCanal;
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
import java.util.Optional;
import org.junit.jupiter.api.Test;

class AprovacoesCasosDeUsoTest {
    static final TenantId ELORA = new TenantId("elora");
    static final TenantId OUTRA = new TenantId("outra");
    final Instant agora = Instant.parse("2026-11-27T12:00:00Z");
    final Relogio relogio = new Relogio() {
        public Instant agora() { return agora; }
        public LocalDate hoje() { return LocalDate.ofInstant(agora, ZoneOffset.UTC); }
    };

    static class Repo implements AprovacaoRepository {
        final Map<String, Object[]> por = new HashMap<>();
        final List<String> eventos = new ArrayList<>();
        public void salvar(TenantId t, Aprovacao a) { por.put(a.id(), new Object[] { t, a }); }
        public void atualizar(TenantId t, Aprovacao a) { por.get(a.id())[1] = a; }
        public Optional<Aprovacao> porId(TenantId t, String id) { var x = por.get(id); return x != null && x[0].equals(t) ? Optional.of((Aprovacao) x[1]) : Optional.empty(); }
        public List<Aprovacao> listar(TenantId t, Aprovacao.Situacao s, int lim) { return por.values().stream().filter(x -> x[0].equals(t)).map(x -> (Aprovacao) x[1]).filter(a -> s == null || a.situacao() == s).toList(); }
        public void registrarEvento(TenantId t, String id, String acao, String quem, String det, Instant em) { eventos.add(acao + ":" + quem); }
        public List<Evento> eventos(TenantId t, String id) { return List.of(); }
    }

    final Repo repo = new Repo();
    final Map<String, String> env = new HashMap<>();
    final AprovacoesCasosDeUso casos = new AprovacoesCasosDeUso(repo, new Integracoes(CanaisPadrao.padrao(env::get)), relogio);

    Aprovacao pedido() {
        return casos.pedir(ELORA, new NovoPedido("mensagem", "whatsapp", "Lead de demonstração", "Olá! Recebemos seu contato.", "+5512999990000", "lead:demo", "Automação"));
    }

    @Test
    void fluxoCompletoEmDemonstracaoNaoEnviaNada() {
        Aprovacao a = pedido();
        assertThat(casos.listar(ELORA, Aprovacao.Situacao.PENDENTE)).hasSize(1);
        assertThatThrownBy(() -> casos.executar(ELORA, a.id(), "Caio")).isInstanceOf(RegraVioladaException.class);
        casos.aprovar(ELORA, a.id(), "Pedro", null);
        Aprovacao e = casos.executar(ELORA, a.id(), "Caio");
        assertThat(e.situacao()).isEqualTo(Aprovacao.Situacao.APROVADA);
        assertThat(e.resultadoEnvio()).contains("nada foi enviado").contains("WHATSAPP_TOKEN");
        assertThat(repo.eventos).containsExactly("pedido:Automação", "aprovado:Pedro", "demonstracao:Caio");
    }

    @Test
    void credenciaisSemAdaptadorContinuamDemonstracao() {
        env.put("WHATSAPP_TOKEN", "x");
        env.put("WHATSAPP_PHONE_ID", "y");
        assertThat(new Integracoes(CanaisPadrao.padrao(env::get)).canal("whatsapp").situacao()).isEqualTo(SituacaoCanal.CREDENCIAIS_SEM_ADAPTADOR);
        Aprovacao a = pedido();
        casos.aprovar(ELORA, a.id(), "Pedro", null);
        assertThat(casos.executar(ELORA, a.id(), "Caio").situacao()).isEqualTo(Aprovacao.Situacao.APROVADA);
    }

    @Test
    void recusadoNaoExecutaEOutraImobiliariaNaoVe() {
        Aprovacao a = pedido();
        casos.recusar(ELORA, a.id(), "Pedro", "Tom inadequado");
        assertThatThrownBy(() -> casos.executar(ELORA, a.id(), "Caio")).isInstanceOf(RegraVioladaException.class);
        assertThatThrownBy(() -> casos.aprovar(OUTRA, a.id(), "Pedro", null)).isInstanceOf(NaoEncontradoException.class);
    }

    @Test
    void canalDesconhecidoERecusaSemMotivo() {
        assertThatThrownBy(() -> casos.pedir(ELORA, new NovoPedido("mensagem", "telegram", "T", "C", null, null, "X"))).isInstanceOf(RegraVioladaException.class);
        Aprovacao a = pedido();
        assertThatThrownBy(() -> casos.recusar(ELORA, a.id(), "Pedro", "")).isInstanceOf(RegraVioladaException.class);
    }

    @Test
    void integracoesNuncaExpoemValores() {
        env.put("SMTP_PASSWORD", "segredo");
        var email = new Integracoes(CanaisPadrao.padrao(env::get)).canal("email");
        assertThat(email.faltando()).containsExactly("SMTP_HOST", "SMTP_USER", "SMTP_FROM");
        assertThat(email.enviar("a@b.com", "oi").detalhe()).doesNotContain("segredo");
    }
}
