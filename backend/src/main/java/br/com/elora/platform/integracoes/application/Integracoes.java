package br.com.elora.platform.integracoes.application;

import br.com.elora.platform.integracoes.application.port.CanalDeEnvio;
import br.com.elora.platform.shared.domain.NaoEncontradoException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Catálogo dos canais externos e da situação de cada um. */
public class Integracoes {
    private final Map<String, CanalDeEnvio> canais = new LinkedHashMap<>();

    public Integracoes(List<CanalDeEnvio> lista) {
        for (CanalDeEnvio c : lista) canais.put(c.canal(), c);
    }

    public List<CanalDeEnvio> todos() {
        return List.copyOf(canais.values());
    }

    public CanalDeEnvio canal(String canal) {
        CanalDeEnvio c = canais.get(canal);
        if (c == null) throw new NaoEncontradoException("Canal não cadastrado: " + canal + ".");
        return c;
    }

    public boolean existe(String canal) {
        return canais.containsKey(canal);
    }
}
