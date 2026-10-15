package br.com.elora.platform.casamais.api;

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

/** API + banco real (PostgreSQL em contêiner), com as migrações e os dados de exemplo do perfil dev. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
@Testcontainers
class CasaMaisApiIT {
    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @Autowired
    MockMvc mvc;

    @Test
    void fluxoDoPedido() throws Exception {
        mvc.perform(get("/api/v1/casamais/pedidos").header("X-Tenant-Id", "elora"))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(3)));

        mvc.perform(post("/api/v1/casamais/pedidos/SV-1/orcamento").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"parceiroId\":\"PA-3\",\"valor\":350,\"prazo\":\"amanhã\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("orcamento")).andExpect(jsonPath("$.margemPct").value(10));

        mvc.perform(post("/api/v1/casamais/pedidos/SV-1/margem").header("X-Tenant-Id", "elora").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"valor\":35,\"recebidaEm\":\"2026-01-01\"}"))
                .andExpect(status().isUnprocessableEntity()).andExpect(jsonPath("$.detail").value("A margem só é registrada depois do serviço feito."));
    }

    @Test
    void outraImobiliariaNaoVeOsDados() throws Exception {
        mvc.perform(get("/api/v1/casamais/pedidos").header("X-Tenant-Id", "outra-imob")).andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void semImobiliariaERecusado() throws Exception {
        mvc.perform(get("/api/v1/casamais/pedidos")).andExpect(status().isUnprocessableEntity());
    }
}
