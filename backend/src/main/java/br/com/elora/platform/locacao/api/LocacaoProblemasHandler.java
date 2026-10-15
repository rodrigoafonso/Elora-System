package br.com.elora.platform.locacao.api;

import br.com.elora.platform.locacao.domain.ProblemasDoContratoException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Problemas do contrato em problem+json, com a lista completa em "problemas" (o formulário mostra todos). */
@RestControllerAdvice(assignableTypes = LocacaoController.class)
public class LocacaoProblemasHandler {
    @ExceptionHandler(ProblemasDoContratoException.class)
    ProblemDetail problemas(ProblemasDoContratoException e) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, e.getMessage());
        p.setTitle("Contrato com problemas");
        p.setProperty("problemas", e.problemas());
        return p;
    }
}
