package br.com.elora.platform.captacao.application;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import br.com.elora.platform.captacao.application.port.FonteRepository;
import br.com.elora.platform.captacao.application.port.FonteRepository.FonteDoCodigo;
import br.com.elora.platform.captacao.application.port.LeadRecebidoRepository;
import br.com.elora.platform.captacao.domain.CodigoDaFonte;
import br.com.elora.platform.captacao.domain.Fonte;
import br.com.elora.platform.captacao.domain.LeadRecebido;
import br.com.elora.platform.captacao.domain.LeadRecebido.Dados;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Fontes de captação: criar a fonte (o código aparece uma vez), receber leads pelo endereço público
 * e listar a caixa de entrada para o funil. Mesmo contato em 30 dias não vira lead novo.
 */
public class CaptacaoCasosDeUso {
    /** Teto por fonte e por hora: protege contra robôs e erros de integração sem travar um site normal. */
    public static final int LIMITE_POR_HORA = 120;
    public static final Duration JANELA_DUPLICADO = Duration.ofDays(30);

    private final FonteRepository fontes;
    private final LeadRecebidoRepository recebidos;
    private final Relogio relogio;

    public CaptacaoCasosDeUso(FonteRepository fontes, LeadRecebidoRepository recebidos, Relogio relogio) {
        this.fontes = fontes;
        this.recebidos = recebidos;
        this.relogio = relogio;
    }

    public record NovaFonte(String nome, String tipo, String canal, String negocio, String corretorId) {}

    /** Fonte criada e o código em claro, que só é mostrado agora. */
    public record FonteCriada(Fonte fonte, String codigo) {}

    public FonteCriada criarFonte(TenantId t, NovaFonte n) {
        exigir(n.corretorId() == null || fontes.corretorExiste(t, n.corretorId()), "Corretor não encontrado.");
        Fonte f = new Fonte(UUID.randomUUID().toString(), n.nome(), n.tipo(), n.canal(), n.negocio(), n.corretorId(), true, relogio.agora());
        String codigo = CodigoDaFonte.novo();
        fontes.salvar(t, f, CodigoDaFonte.hash(codigo));
        return new FonteCriada(f, codigo);
    }

    public Fonte alterarFonte(TenantId t, String id, NovaFonte n, boolean ativa) {
        Fonte atual = fontes.porId(t, id).orElseThrow(() -> new NaoEncontradoException("Fonte não encontrada."));
        exigir(n.corretorId() == null || fontes.corretorExiste(t, n.corretorId()), "Corretor não encontrado.");
        Fonte f = new Fonte(atual.id(), n.nome(), n.tipo(), n.canal(), n.negocio(), n.corretorId(), ativa, atual.criadaEm());
        fontes.atualizar(t, f);
        return f;
    }

    /** Novo código (o anterior para de funcionar na hora). Use se o código vazar. */
    public FonteCriada trocarCodigo(TenantId t, String id) {
        Fonte f = fontes.porId(t, id).orElseThrow(() -> new NaoEncontradoException("Fonte não encontrada."));
        String codigo = CodigoDaFonte.novo();
        fontes.trocarCodigo(t, id, CodigoDaFonte.hash(codigo));
        return new FonteCriada(f, codigo);
    }

    public List<Fonte> listarFontes(TenantId t) {
        return fontes.listar(t);
    }

    public record Recebimento(long id, String situacao) {}

    /**
     * Endereço público: valida o código, lê os campos (JSON ou formulário) e guarda na caixa de entrada.
     * Robô (campo-armadilha preenchido) é guardado como descartado e recebe a mesma resposta, para não aprender a burlar.
     */
    public Recebimento receber(String codigo, Map<String, String> campos) {
        exigir(CodigoDaFonte.valido(codigo), "Endereço de captação inválido.");
        FonteDoCodigo fc = fontes.porCodigo(CodigoDaFonte.hash(codigo)).orElseThrow(() -> new NaoEncontradoException("Endereço de captação não encontrado."));
        exigir(fc.fonte().ativa(), "Esta fonte de captação está pausada.");
        TenantId t = fc.tenant();
        var agora = relogio.agora();
        exigir(recebidos.recebidosDaFonteDesde(t, fc.fonte().id(), agora.minus(Duration.ofHours(1))) < LIMITE_POR_HORA,
                "Muitos envios em pouco tempo. Tente de novo mais tarde.");
        Dados d = LeadRecebido.ler(campos);
        String situacao = "novo";
        Long dup = null;
        if (d.robo()) situacao = "descartado";
        else {
            dup = recebidos.mesmoContato(t, LeadRecebido.chaveTelefone(d.telefone()), d.email(), agora.minus(JANELA_DUPLICADO)).orElse(null);
            if (dup != null) situacao = "duplicado";
        }
        LeadRecebido l = new LeadRecebido(null, fc.fonte().id(), d.nome(), d.telefone(), d.email(), d.mensagem(), d.regiao(), d.valorMax(), d.imovelCodigo(),
                d.consentimento(), situacao, dup, agora);
        return new Recebimento(recebidos.salvar(t, l), situacao);
    }

    public List<LeadRecebido> caixaDeEntrada(TenantId t, String situacao) {
        exigir(situacao == null || LeadRecebido.SITUACOES.contains(situacao), "Situação inválida.");
        return recebidos.listar(t, situacao, 500);
    }

    /** O funil (CRM) marca como importado depois de criar o lead. */
    public void marcarImportado(TenantId t, long id) {
        recebidos.marcar(t, id, "importado");
    }
}
