package br.com.elora.platform.integracoes.infrastructure;

import br.com.elora.platform.integracoes.application.port.CanalDeEnvio;
import java.util.List;
import java.util.function.UnaryOperator;

/** Canais conhecidos e as variáveis de cada um (o backend/.env.example lista as mesmas). */
public final class CanaisPadrao {
    private CanaisPadrao() {}

    public static List<CanalDeEnvio> padrao(UnaryOperator<String> env) {
        return List.of(
                new CanalNaoConectado("whatsapp", "WhatsApp Business", List.of("WHATSAPP_TOKEN", "WHATSAPP_PHONE_ID"),
                        "Conta na API oficial do WhatsApp Business (Meta), número verificado e modelos de mensagem aprovados.", env),
                new CanalNaoConectado("email", "E-mail", List.of("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"),
                        "Domínio da Elora com e-mail próprio e um serviço de envio (SMTP).", env),
                new CanalNaoConectado("instagram", "Instagram e Facebook", List.of("META_APP_ID", "META_APP_SECRET", "META_PAGE_TOKEN"),
                        "Conta comercial ligada a uma página e app na Meta com permissão de publicação.", env),
                new CanalNaoConectado("agenda", "Agenda (Google)", List.of("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
                        "Projeto no Google Cloud com OAuth e o consentimento de cada usuário.", env),
                new CanalNaoConectado("anuncios", "Anúncios (Meta Ads)", List.of("META_ADS_TOKEN", "META_ADS_ACCOUNT_ID"),
                        "Conta de anúncios. Alterar campanha ou gastar dinheiro só depois de aprovação.", env),
                new CanalNaoConectado("crm", "CRM externo", List.of("CRM_API_URL", "CRM_API_TOKEN"),
                        "Só se a Elora decidir usar um CRM fora da plataforma; o CRM principal é o da própria Elora.", env));
    }
}
