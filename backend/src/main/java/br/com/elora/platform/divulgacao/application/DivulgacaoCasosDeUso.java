package br.com.elora.platform.divulgacao.application;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import br.com.elora.platform.divulgacao.application.port.EnvioRepository;
import br.com.elora.platform.divulgacao.application.port.ImoveisPublicos;
import br.com.elora.platform.divulgacao.domain.Envio;
import br.com.elora.platform.divulgacao.domain.PreviaDoImovel;
import br.com.elora.platform.divulgacao.domain.TokenDeEnvio;
import br.com.elora.platform.divulgacao.domain.Visitante;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.Relogio;
import br.com.elora.platform.shared.domain.TenantId;
import java.util.List;
import java.util.Optional;

/** Link do imóvel por envio: criar o link, abrir (prévia + registro) e acompanhar as aberturas. */
public class DivulgacaoCasosDeUso {
    private final EnvioRepository envios;
    private final ImoveisPublicos imoveis;
    private final Relogio relogio;
    private final TenantId tenantPadrao;

    public DivulgacaoCasosDeUso(EnvioRepository envios, ImoveisPublicos imoveis, Relogio relogio, TenantId tenantPadrao) {
        this.envios = envios;
        this.imoveis = imoveis;
        this.relogio = relogio;
        this.tenantPadrao = tenantPadrao;
    }

    public record NovoEnvio(String imovelId, String leadRef, String leadNome, String corretorId) {}

    /** O mesmo cliente recebe sempre o mesmo link do mesmo imóvel (reenviar não cria outro). */
    public Envio criarEnvio(TenantId t, NovoEnvio n) {
        PreviaDoImovel im = imoveis.porId(t, n.imovelId()).orElseThrow(() -> new NaoEncontradoException("Imóvel não encontrado."));
        exigir(im.autorizado(), "Este imóvel não pode ser divulgado: falta a autorização escrita do proprietário (Lei 6.530/78, art. 20, III).");
        exigir(n.corretorId() == null || imoveis.corretorExiste(t, n.corretorId()), "Corretor não encontrado.");
        String lead = limpar(n.leadRef(), 60);
        if (lead != null) {
            Optional<Envio> ja = envios.doCliente(t, im.id(), lead);
            if (ja.isPresent()) return ja.get();
        }
        Envio e = new Envio(TokenDeEnvio.novo(), im.id(), im.codigo(), lead, limpar(n.leadNome(), 80), n.corretorId(), relogio.agora(), List.of());
        envios.salvar(t, e);
        return e;
    }

    public List<Envio> listar(TenantId t, String imovelId, String corretorId) {
        return envios.listar(t, imovelId, corretorId, 200);
    }

    /** Resultado da abertura do link público: a prévia (se houver) e se a visita contou. */
    public record Abertura(Optional<PreviaDoImovel> previa, boolean contou) {}

    /**
     * Abertura do link público. Sem código (ou código inválido), mostra só a prévia do imóvel da imobiliária padrão.
     * Robôs de prévia não contam; aberturas seguidas (menos de 2 minutos) contam uma vez.
     */
    public Abertura abrir(String codigoImovel, String token, Visitante v) {
        Optional<Envio> envio = TokenDeEnvio.valido(token) ? envios.porToken(token) : Optional.empty();
        if (envio.isPresent() && !envio.get().imovelCodigo().equalsIgnoreCase(codigoImovel)) envio = Optional.empty();
        TenantId t = envio.flatMap(e -> envios.tenantDo(e.token())).orElse(tenantPadrao);
        Optional<PreviaDoImovel> previa = imoveis.porCodigo(t, codigoImovel).filter(PreviaDoImovel::autorizado);
        boolean contou = false;
        if (previa.isPresent() && envio.isPresent() && !v.ehRobo() && envio.get().contaComoNovaAbertura(relogio.agora())) {
            envios.registrarAbertura(envio.get().token(), t.valor(), relogio.agora(), v.aparelho());
            contou = true;
        }
        return new Abertura(previa, contou);
    }

    private static String limpar(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String v = s.strip();
        return v.length() > max ? v.substring(0, max) : v;
    }
}
