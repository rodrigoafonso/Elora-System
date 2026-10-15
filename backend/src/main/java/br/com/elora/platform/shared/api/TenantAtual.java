package br.com.elora.platform.shared.api;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/** Injeta a imobiliária da requisição (claim "tenant" do token; em desenvolvimento, o cabeçalho X-Tenant-Id). */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface TenantAtual {}
