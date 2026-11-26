package br.com.elora.platform.captacao.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import java.time.Instant;
import java.util.Set;

/** De onde chegam os leads (site, portal, formulário, anúncio). Leva o lead ao funil com canal, interesse e corretor. */
public record Fonte(String id, String nome, String tipo, String canal, String negocio, String corretorId, boolean ativa, Instant criadaEm) {
    public static final Set<String> TIPOS = Set.of("site", "portal", "formulario", "redes", "parceiro", "outro");
    public static final Set<String> CANAIS = Set.of("Site", "Portal", "Instagram", "WhatsApp", "Indicação", "Telefone");
    public static final Set<String> NEGOCIOS = Set.of("Locação", "Compra");

    public Fonte {
        nome = nome == null ? "" : nome.strip();
        exigir(!nome.isEmpty() && nome.length() <= 60, "Dê um nome à fonte (até 60 caracteres).");
        exigir(TIPOS.contains(tipo), "Tipo de fonte inválido.");
        exigir(CANAIS.contains(canal), "Canal inválido.");
        exigir(NEGOCIOS.contains(negocio), "Interesse deve ser Locação ou Compra.");
    }
}
