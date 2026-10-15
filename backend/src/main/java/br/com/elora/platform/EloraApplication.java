package br.com.elora.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Elora Partner OS — API.
 *
 * <p>Monólito modular: cada pacote de primeiro nível (casamais, imoveis, participacao...) é um módulo
 * com as camadas domain → application → infrastructure/api. Módulos conversam só pela camada
 * application (ou por eventos), o que permite extrair um módulo para um microsserviço sem reescrever o domínio.
 */
@SpringBootApplication
public class EloraApplication {
    public static void main(String[] args) {
        SpringApplication.run(EloraApplication.class, args);
    }
}
