package br.com.elora.platform.aprovacoes.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import br.com.elora.platform.integracoes.domain.ResultadoEnvio;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;

/**
 * Pedido de aprovação de uma ação externa (mensagem, publicação, pagamento, alteração de campanha).
 * Regras: só um pedido pendente pode ser decidido; quem pediu não aprova; recusa exige motivo; o texto aprovado é
 * guardado exatamente como saiu; envio só depois de aprovado; envio de demonstração não conta como envio.
 */
public record Aprovacao(String id, String tipo, String canal, String titulo, String conteudo, String destino, String referencia,
        Situacao situacao, String pedidoPor, Instant pedidoEm, String decididoPor, Instant decididoEm, String textoAprovado, String motivo,
        String enviadoPor, Instant enviadoEm, String resultadoEnvio) {

    public enum Situacao { PENDENTE, APROVADA, RECUSADA, ENVIADA }

    public static final Set<String> TIPOS = Set.of("mensagem", "publicacao", "pagamento", "campanha");

    public Aprovacao {
        exigir(TIPOS.contains(tipo), "Tipo de pedido inválido.");
        exigir(canal != null && canal.matches("[a-z]{2,20}"), "Canal inválido.");
        exigir(titulo != null && !titulo.isBlank() && titulo.length() <= 120, "Título obrigatório (até 120 caracteres).");
        exigir(conteudo != null && !conteudo.isBlank() && conteudo.length() <= 4000, "Conteúdo obrigatório (até 4.000 caracteres).");
        exigir(destino == null || destino.length() <= 200, "Destino longo demais.");
        exigir(referencia == null || referencia.length() <= 80, "Referência longa demais.");
        exigir(pedidoPor != null && !pedidoPor.isBlank() && pedidoPor.length() <= 60, "Informe quem pediu.");
    }

    public static Aprovacao nova(String id, String tipo, String canal, String titulo, String conteudo, String destino, String referencia, String pedidoPor, Instant em) {
        return new Aprovacao(id, tipo, canal, titulo.strip(), conteudo.strip(), destino, referencia, Situacao.PENDENTE, pedidoPor.strip(), em,
                null, null, null, null, null, null, null);
    }

    public Aprovacao aprovar(String quem, String texto, Instant em) {
        exigir(situacao == Situacao.PENDENTE, "Este pedido já foi decidido.");
        exigir(quem != null && !quem.isBlank() && quem.length() <= 60, "Informe quem está aprovando.");
        exigir(!mesmaPessoa(quem, pedidoPor), "Quem pediu não pode aprovar o próprio pedido.");
        String t = texto == null || texto.isBlank() ? conteudo : texto.strip();
        exigir(t.length() <= 4000, "Texto aprovado longo demais.");
        return new Aprovacao(id, tipo, canal, titulo, conteudo, destino, referencia, Situacao.APROVADA, pedidoPor, pedidoEm, quem.strip(), em, t, null,
                null, null, null);
    }

    public Aprovacao recusar(String quem, String motivo, Instant em) {
        exigir(situacao == Situacao.PENDENTE, "Este pedido já foi decidido.");
        exigir(quem != null && !quem.isBlank() && quem.length() <= 60, "Informe quem está recusando.");
        exigir(motivo != null && !motivo.isBlank() && motivo.length() <= 300, "Escreva o motivo da recusa.");
        return new Aprovacao(id, tipo, canal, titulo, conteudo, destino, referencia, Situacao.RECUSADA, pedidoPor, pedidoEm, quem.strip(), em, null,
                motivo.strip(), null, null, null);
    }

    /** Só pedido aprovado pode ir para o canal. */
    public void podeEnviar() {
        exigir(situacao == Situacao.APROVADA, situacao == Situacao.ENVIADA ? "Este pedido já foi enviado." : "Só é possível enviar depois da aprovação.");
    }

    /** Envio real muda para ENVIADA; demonstração ou falha ficam como APROVADA, com o resultado anotado. */
    public Aprovacao comResultado(String quem, ResultadoEnvio r, Instant em) {
        podeEnviar();
        Situacao s = r.enviado() ? Situacao.ENVIADA : Situacao.APROVADA;
        String det = (r.demonstracao() ? "Demonstração: " : r.enviado() ? "" : "Falhou: ") + r.detalhe();
        return new Aprovacao(id, tipo, canal, titulo, conteudo, destino, referencia, s, pedidoPor, pedidoEm, decididoPor, decididoEm, textoAprovado, motivo,
                quem, em, det.length() > 300 ? det.substring(0, 300) : det);
    }

    static boolean mesmaPessoa(String a, String b) {
        return norm(a).equals(norm(b));
    }

    private static String norm(String s) {
        return Normalizer.normalize(s == null ? "" : s, Normalizer.Form.NFD).replaceAll("\\p{M}", "").strip().toLowerCase(Locale.ROOT);
    }
}
