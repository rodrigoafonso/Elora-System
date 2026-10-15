package br.com.elora.platform.locacao.domain;

/** Problema legal ou de cadastro, com a lei de origem ("art" vazio quando é regra da casa). */
public record Problema(String art, String titulo, String msg) {}
