package br.com.elora.platform.locacao.api;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
class LocacaoApiIT {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    private static final String CASA = "00000000-0000-0000-0000-000000000112";
    private static final String RAFAEL = "00000000-0000-0000-0000-0000000000f5";

    @Autowired
    MockMvc mvc;

    private static String contrato(String garantia, String caucao) {
        return """
                {"imovelId":"%s","locatarioId":"%s","tipo":"residencial","inicio":"2026-11-01","fim":"2029-04-30","aluguel":3000,"taxa":8,
                 "indice":"IPCA","garantia":"%s","caucao":%s,"antecipada":false,"venia":"na","status":"ativo",
                 "docContrato":false,"docVistoria":false,"docGarantia":false,"docSeguro":false}
                """.formatted(CASA, RAFAEL, garantia, caucao);
    }

    @Test
    void listaCadastraERecusaCaucaoAcimaDoLimite() throws Exception {
        mvc.perform(get("/api/v1/locacao/contratos").header("X-Tenant-Id", "elora")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(2)));

        mvc.perform(post("/api/v1/locacao/contratos").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                        .content(contrato("caucao_dinheiro", "12000")))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.problemas[0].titulo").value("Caução acima de três aluguéis"))
                .andExpect(jsonPath("$.problemas[0].art").value("Lei 8.245/91, art. 38, § 2º"));

        mvc.perform(post("/api/v1/locacao/contratos").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                        .content(contrato("caucao_dinheiro", "9000")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.imovel.codigo").value("EL-0112"))
                .andExpect(jsonPath("$.locatario.nome").value("Rafael Nogueira"));

        // Um só contrato ativo por imóvel.
        mvc.perform(post("/api/v1/locacao/contratos").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                        .content(contrato("seguro_fianca", "null")))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.problemas[0].titulo").value("Imóvel já alugado"));
    }

    @Test
    void reajusteAntesDeUmAnoERecusado() throws Exception {
        mvc.perform(post("/api/v1/locacao/contratos/00000000-0000-0000-0000-0000000000d1/reajustes").header("X-Tenant-Id", "elora")
                        .contentType(MediaType.APPLICATION_JSON).content("{\"em\":\"2026-01-01\",\"pct\":4,\"para\":2496}"))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.problemas[0].titulo").value("Reajuste antes de um ano"));
    }
}
