package br.com.elora.platform.captacao.domain;

import static br.com.elora.platform.shared.domain.RegraVioladaException.exigir;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

/**
 * Lead que chegou por uma fonte e espera o funil (caixa de entrada). Guarda só o que a pessoa enviou.
 * situacao: novo (entra no funil), duplicado (mesmo telefone ou e-mail de um lead recente: vai ao histórico dele) ou descartado (robô).
 */
public record LeadRecebido(Long id, String fonteId, String nome, String telefone, String email, String mensagem, String regiao, BigDecimal valorMax,
        String imovelCodigo, boolean consentimento, String situacao, Long duplicadoDe, Instant recebidoEm) {

    public static final List<String> SITUACOES = List.of("novo", "duplicado", "descartado", "importado");
    private static final Pattern EMAIL = Pattern.compile("[^@\\s]{1,64}@[^@\\s]{1,190}\\.[^@\\s]{2,24}");
    private static final Pattern CODIGO_IMOVEL = Pattern.compile("(?i)[a-z]{1,4}-?\\d{1,8}");

    /** Nomes aceitos para cada campo (formulários e portais mandam com nomes diferentes). */
    static final Map<String, List<String>> CAMPOS = new LinkedHashMap<>();
    static {
        CAMPOS.put("nome", List.of("nome", "name", "nome completo", "full_name", "fullname", "cliente"));
        CAMPOS.put("telefone", List.of("telefone", "phone", "celular", "whatsapp", "fone", "tel"));
        CAMPOS.put("email", List.of("email", "e-mail", "mail"));
        CAMPOS.put("mensagem", List.of("mensagem", "message", "interesse", "quer", "procura", "comentario", "observacao"));
        CAMPOS.put("regiao", List.of("bairro", "regiao", "cidade", "bairros"));
        CAMPOS.put("valor", List.of("valor", "valor_max", "valormax", "orcamento", "budget", "preco"));
        CAMPOS.put("imovel", List.of("imovel", "codigo", "ref", "referencia"));
        CAMPOS.put("consentimento", List.of("consentimento", "consent", "aceite", "lgpd"));
        CAMPOS.put("armadilha", List.of("website", "url", "homepage"));   // campo escondido no formulário: só robô preenche
    }

    /** Dados que chegaram, já com os nomes dos campos da Elora. */
    public record Dados(String nome, String telefone, String email, String mensagem, String regiao, BigDecimal valorMax, String imovelCodigo,
            boolean consentimento, boolean robo) {}

    public static Dados ler(Map<String, String> brutos) {
        Map<String, String> v = new LinkedHashMap<>();
        if (brutos != null) brutos.forEach((k, x) -> {
            String campo = campoDe(k);
            if (campo != null && x != null && !x.isBlank() && !v.containsKey(campo)) v.put(campo, x.strip());
        });
        boolean robo = v.containsKey("armadilha");
        String nome = corta(v.get("nome"), 80);
        String tel = v.get("telefone") == null ? null : v.get("telefone").replaceAll("[^0-9+]", "");
        String email = v.get("email") == null ? null : v.get("email").toLowerCase(Locale.ROOT);
        exigir(nome != null, "Informe o nome.");
        exigir(tel != null || email != null, "Informe o telefone ou o e-mail.");
        exigir(tel == null || tel.replace("+", "").length() >= 10 && tel.replace("+", "").length() <= 13, "Telefone inválido: use DDD e número.");
        exigir(email == null || EMAIL.matcher(email).matches(), "E-mail inválido.");
        String im = v.get("imovel");
        return new Dados(nome, tel, email, corta(v.get("mensagem"), 1000), corta(v.get("regiao"), 120), valor(v.get("valor")),
                im != null && CODIGO_IMOVEL.matcher(im).matches() ? im.toUpperCase(Locale.ROOT) : null, sim(v.get("consentimento")), robo);
    }

    static String campoDe(String chave) {
        if (chave == null) return null;
        String c = Normalizer.normalize(chave, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replaceAll("[^a-z_ -]", "").strip();
        for (var e : CAMPOS.entrySet()) if (e.getValue().contains(c)) return e.getKey();
        return null;
    }

    static BigDecimal valor(String s) {
        if (s == null) return null;
        String d = s.replaceAll("[^0-9,.]", "");
        if (d.isEmpty()) return null;
        d = d.replaceAll("\\.(?=\\d{3}(\\D|$))", "").replace(',', '.');
        try {
            BigDecimal b = new BigDecimal(d);
            return b.signum() > 0 && b.compareTo(new BigDecimal("1000000000")) < 0 ? b : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static boolean sim(String s) {
        return s != null && List.of("true", "sim", "1", "on", "yes", "s").contains(s.strip().toLowerCase(Locale.ROOT));
    }

    private static String corta(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String x = s.strip();
        return x.length() > max ? x.substring(0, max) : x;
    }

    /** Chave para achar o mesmo contato: só dígitos do telefone (sem 55) ou o e-mail. */
    public static String chaveTelefone(String tel) {
        if (tel == null) return null;
        String d = tel.replaceAll("\\D", "");
        if (d.startsWith("55") && d.length() > 11) d = d.substring(2);
        return d.isEmpty() ? null : d;
    }
}
