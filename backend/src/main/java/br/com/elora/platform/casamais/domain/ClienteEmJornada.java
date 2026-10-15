package br.com.elora.platform.casamais.domain;

import java.time.LocalDate;

/**
 * Cliente que comprou (últimos 180 dias) ou alugou (últimos 90 dias): é a ele que o Casa+ é oferecido.
 * Hoje vem de app.cm_jornada; quando os módulos de imóveis e locação estiverem migrados, a jornada nasce
 * de um evento "venda concluída" / "contrato ativado".
 */
public record ClienteEmJornada(
        PerfilCliente perfil, String referencia, String nome, String telefone, String imovelRef, String corretorRef,
        String corretorNome, LocalDate desde, String rotulo, int pedidos) {}
