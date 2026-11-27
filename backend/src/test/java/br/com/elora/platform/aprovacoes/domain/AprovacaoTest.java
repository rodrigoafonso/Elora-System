package br.com.elora.platform.aprovacoes.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import br.com.elora.platform.integracoes.domain.ResultadoEnvio;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class AprovacaoTest {
    static final Instant EM = Instant.parse("2026-11-27T12:00:00Z");

    static Aprovacao nova() {
        return Aprovacao.nova("a1", "mensagem", "whatsapp", "Depois da visita", "Olá, Eduardo!", "+5512999990000", "lead:L-02", "Automação", EM);
    }

    @Test
    void aprovarGuardaQuemQuandoETextoExato() {
        Aprovacao a = nova().aprovar("Pedro", "  Olá, Eduardo! Posso ligar?  ", EM);
        assertThat(a.situacao()).isEqualTo(Aprovacao.Situacao.APROVADA);
        assertThat(a.decididoPor()).isEqualTo("Pedro");
        assertThat(a.decididoEm()).isEqualTo(EM);
        assertThat(a.textoAprovado()).isEqualTo("Olá, Eduardo! Posso ligar?");
    }

    @Test
    void quemPediuNaoAprovaRecusaExigeMotivoENaoDecideDuasVezes() {
        Aprovacao n = Aprovacao.nova("a2", "publicacao", "instagram", "Post", "Texto", null, null, "Fabiana", EM);
        assertThatThrownBy(() -> n.aprovar("fabiána", null, EM)).isInstanceOf(RegraVioladaException.class);
        assertThatThrownBy(() -> n.recusar("Pedro", " ", EM)).isInstanceOf(RegraVioladaException.class);
        Aprovacao r = n.recusar("Pedro", "Foto errada", EM);
        assertThat(r.situacao()).isEqualTo(Aprovacao.Situacao.RECUSADA);
        assertThatThrownBy(() -> r.aprovar("Rodrigo", null, EM)).isInstanceOf(RegraVioladaException.class);
    }

    @Test
    void semAprovacaoNaoEnvia() {
        assertThatThrownBy(() -> nova().comResultado("Caio", ResultadoEnvio.enviado("x"), EM)).isInstanceOf(RegraVioladaException.class);
    }

    @Test
    void demonstracaoNaoContaComoEnvio() {
        Aprovacao a = nova().aprovar("Pedro", null, EM).comResultado("Caio", ResultadoEnvio.demonstracao("WhatsApp não conectado: nada foi enviado."), EM);
        assertThat(a.situacao()).isEqualTo(Aprovacao.Situacao.APROVADA);
        assertThat(a.resultadoEnvio()).startsWith("Demonstração:");
        Aprovacao b = a.comResultado("Caio", ResultadoEnvio.enviado("wamid.1"), EM);
        assertThat(b.situacao()).isEqualTo(Aprovacao.Situacao.ENVIADA);
        assertThatThrownBy(() -> b.comResultado("Caio", ResultadoEnvio.enviado("wamid.2"), EM)).isInstanceOf(RegraVioladaException.class);
    }

    @Test
    void validaEntradas() {
        assertThatThrownBy(() -> Aprovacao.nova("a3", "spam", "whatsapp", "T", "C", null, null, "X", EM)).isInstanceOf(RegraVioladaException.class);
        assertThatThrownBy(() -> Aprovacao.nova("a3", "mensagem", "whatsapp", " ", "C", null, null, "X", EM)).isInstanceOf(RegraVioladaException.class);
        assertThatThrownBy(() -> Aprovacao.nova("a3", "mensagem", "WhatsApp!", "T", "C", null, null, "X", EM)).isInstanceOf(RegraVioladaException.class);
    }
}
