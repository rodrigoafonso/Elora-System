package br.com.elora.platform.aprovacoes.application;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import br.com.elora.platform.aprovacoes.application.port.AprovacaoRepository;
import br.com.elora.platform.aprovacoes.application.port.AprovacaoRepository.Evento;
import br.com.elora.platform.aprovacoes.domain.Aprovacao;
import br.com.elora.platform.integracoes.application.Integracoes;
import br.com.elora.platform.integracoes.domain.ResultadoEnvio;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.UUID;

/** Fila de aprovação: nenhuma ação externa sai sem decisão de uma pessoa, e tudo fica registrado. */
public class AprovacoesCasosDeUso {
    private final AprovacaoRepository repo;
    private final Integracoes integracoes;
    private final Relogio relogio;

    public AprovacoesCasosDeUso(AprovacaoRepository repo, Integracoes integracoes, Relogio relogio) {
        this.repo = repo;
        this.integracoes = integracoes;
        this.relogio = relogio;
    }

    public record NovoPedido(String tipo, String canal, String titulo, String conteudo, String destino, String referencia, String pedidoPor) {}

    public Aprovacao pedir(TenantId t, NovoPedido n) {
        exigir(n.canal() != null && (integracoes.existe(n.canal()) || "interno".equals(n.canal())), "Canal desconhecido.");
        Aprovacao a = Aprovacao.nova(UUID.randomUUID().toString(), n.tipo(), n.canal(), n.titulo() == null ? "" : n.titulo(), n.conteudo() == null ? "" : n.conteudo(),
                n.destino(), n.referencia(), n.pedidoPor() == null ? "" : n.pedidoPor(), relogio.agora());
        repo.salvar(t, a);
        repo.registrarEvento(t, a.id(), "pedido", a.pedidoPor(), a.titulo(), a.pedidoEm());
        return a;
    }

    public List<Aprovacao> listar(TenantId t, Aprovacao.Situacao situacao) {
        return repo.listar(t, situacao, 200);
    }

    public Aprovacao aprovar(TenantId t, String id, String quem, String texto) {
        Aprovacao a = buscar(t, id).aprovar(quem, texto, relogio.agora());
        repo.atualizar(t, a);
        repo.registrarEvento(t, id, "aprovado", a.decididoPor(), a.textoAprovado().equals(a.conteudo()) ? "texto original" : "texto ajustado", a.decididoEm());
        return a;
    }

    public Aprovacao recusar(TenantId t, String id, String quem, String motivo) {
        Aprovacao a = buscar(t, id).recusar(quem, motivo, relogio.agora());
        repo.atualizar(t, a);
        repo.registrarEvento(t, id, "recusado", a.decididoPor(), a.motivo(), a.decididoEm());
        return a;
    }

    /**
     * Executa um pedido aprovado no canal dele. Canal não conectado devolve demonstração: o pedido continua aprovado
     * (não enviado) e o registro diz que nada saiu.
     */
    public Aprovacao executar(TenantId t, String id, String quem) {
        exigir(quem != null && !quem.isBlank() && quem.length() <= 60, "Informe quem está executando o envio.");
        Aprovacao a = buscar(t, id);
        a.podeEnviar();
        ResultadoEnvio r = "interno".equals(a.canal()) ? ResultadoEnvio.demonstracao("Ação interna: registrada, sem envio externo.")
                : integracoes.canal(a.canal()).enviar(a.destino(), a.textoAprovado());
        Aprovacao b = a.comResultado(quem.strip(), r, relogio.agora());
        repo.atualizar(t, b);
        repo.registrarEvento(t, id, r.enviado() ? "enviado" : r.demonstracao() ? "demonstracao" : "falha", b.enviadoPor(), b.resultadoEnvio(), b.enviadoEm());
        return b;
    }

    public List<Evento> historico(TenantId t, String id) {
        buscar(t, id);
        return repo.eventos(t, id);
    }

    private Aprovacao buscar(TenantId t, String id) {
        return repo.porId(t, id).orElseThrow(() -> new NaoEncontradoException("Pedido de aprovação não encontrado."));
    }
}
