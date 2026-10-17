package br.com.elora.platform.divulgacao.api;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(properties = "elora.site.url=https://site.exemplo")
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
class DivulgacaoApiIT {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String CASA = "00000000-0000-0000-0000-000000000112";
    private static final String GALPAO_SEM_AUTORIZACAO = "00000000-0000-0000-0000-000000000107";
    private static final String IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148";

    @Autowired
    MockMvc mvc;

    @Test
    void criaOLinkMostraAPreviaEContaSoOCliente() throws Exception {
        String corpo = mvc.perform(post("/api/v1/divulgacao/envios").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"imovelId\":\"%s\",\"leadRef\":\"L-77\",\"leadNome\":\"Cliente Teste\"}".formatted(CASA)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.imovelCodigo").value("EL-0112"))
                .andExpect(jsonPath("$.url").value(containsString("https://site.exemplo/i/EL-0112?e="))).andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(corpo, "$.token");

        // O WhatsApp lê a prévia (Open Graph) e não conta como abertura.
        mvc.perform(get("/i/EL-0112").param("e", token).header("User-Agent", "WhatsApp/2.24.8.78 A"))
                .andExpect(status().isOk()).andExpect(content().string(containsString("og:title")))
                .andExpect(content().string(containsString("url=https://site.exemplo/imovel/EL-0112")));
        mvc.perform(get("/i/EL-0112").param("e", token).header("User-Agent", IPHONE)).andExpect(status().isOk());

        mvc.perform(get("/api/v1/divulgacao/envios").header("X-Tenant-Id", "elora").param("imovelId", CASA))
                .andExpect(status().isOk()).andExpect(jsonPath("$[?(@.token == '%s')].aberturas".formatted(token)).value(1));
        // Exemplo do seed: duas aberturas já registradas.
        mvc.perform(get("/api/v1/divulgacao/envios").header("X-Tenant-Id", "elora").param("imovelId", CASA))
                .andExpect(jsonPath("$[?(@.token == 'exempk2345')].aberturas").value(2));
    }

    @Test
    void imovelSemAutorizacaoNaoTemLinkNemPrevia() throws Exception {
        mvc.perform(post("/api/v1/divulgacao/envios").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                .content("{\"imovelId\":\"%s\"}".formatted(GALPAO_SEM_AUTORIZACAO))).andExpect(status().isUnprocessableEntity());
        mvc.perform(get("/i/EL-0107").header("User-Agent", IPHONE)).andExpect(status().isNotFound())
                .andExpect(content().string(not(containsString("og:title"))));
    }
}
