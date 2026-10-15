package br.com.elora.platform.casamais.domain;

/** Cliente do pedido: quem comprou ou alugou (referência ao contrato ou ao imóvel). */
public record Cliente(PerfilCliente perfil, String referencia, String nome, String telefone) {}
