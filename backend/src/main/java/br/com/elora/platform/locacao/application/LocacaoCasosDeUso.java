package br.com.elora.platform.locacao.application;

import br.com.elora.platform.locacao.application.port.CadastrosLocacao;
import br.com.elora.platform.locacao.application.port.ContratoRepository;
import br.com.elora.platform.locacao.domain.ContratoLocacao;
import br.com.elora.platform.locacao.domain.DadosContrato;
import br.com.elora.platform.locacao.domain.Enums.StatusContrato;
import br.com.elora.platform.locacao.domain.Resumos;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import br.com.elora.platform.shared.domain.TenantId;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Casos de uso da Locação. Java puro; a transação é aberta na configuração do módulo. */
public class LocacaoCasosDeUso {
    private final ContratoRepository contratos;
    private final CadastrosLocacao cadastros;

    public LocacaoCasosDeUso(ContratoRepository contratos, CadastrosLocacao cadastros) {
        this.contratos = contratos;
        this.cadastros = cadastros;
    }

    public List<ContratoLocacao> listar(TenantId t) {
        return contratos.listar(t);
    }

    public List<Resumos.Imovel> imoveis(TenantId t) {
        return cadastros.imoveis(t);
    }

    public List<Resumos.Pessoa> locatarios(TenantId t) {
        return cadastros.locatarios(t);
    }

    public List<Resumos.Pessoa> corretores(TenantId t) {
        return cadastros.corretores(t);
    }

    public ContratoLocacao criar(TenantId t, DadosContrato d) {
        conferirCadastros(t, d);
        ContratoLocacao c = ContratoLocacao.novo(contratos.novoId(), d, contratos.imovelTemOutroAtivo(t, d.imovelId(), null));
        return contratos.salvar(t, c, plano(t, c));
    }

    public ContratoLocacao atualizar(TenantId t, String id, DadosContrato d) {
        ContratoLocacao c = buscar(t, id);
        conferirCadastros(t, d.comImovel(c.dados().imovelId()));
        c.atualizar(d, contratos.imovelTemOutroAtivo(t, c.dados().imovelId(), id));
        return contratos.salvar(t, c, plano(t, c));
    }

    public ContratoLocacao reajustar(TenantId t, String id, LocalDate em, BigDecimal pct, BigDecimal novo) {
        ContratoLocacao c = buscar(t, id);
        RegraVioladaException.exigir(c.dados().status() == StatusContrato.ativo, "Só contratos ativos podem ser reajustados.");
        c.reajustar(em, pct, novo);
        return contratos.salvar(t, c, plano(t, c));
    }

    private ContratoLocacao buscar(TenantId t, String id) {
        return contratos.buscar(t, id).orElseThrow(() -> new NaoEncontradoException("Contrato não encontrado."));
    }

    private void conferirCadastros(TenantId t, DadosContrato d) {
        RegraVioladaException.exigir(d.imovelId() != null && cadastros.imovel(t, d.imovelId()).isPresent(), "Imóvel não encontrado.");
        RegraVioladaException.exigir(d.locatarioId() != null && cadastros.locatarioExiste(t, d.locatarioId()), "Locatário não encontrado.");
    }

    /** Contrato ativo precisa de plano de remuneração (o livro de participações depende dele). */
    private String plano(TenantId t, ContratoLocacao c) {
        String p = cadastros.planoVigente(t, c.dados().imovelId(), c.dados().inicio()).orElse(null);
        RegraVioladaException.exigir(p != null || c.dados().status() != StatusContrato.ativo, "Defina o plano de remuneração antes de ativar o contrato.");
        return p;
    }
}
