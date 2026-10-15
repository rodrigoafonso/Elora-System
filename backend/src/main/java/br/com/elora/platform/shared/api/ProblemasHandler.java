package br.com.elora.platform.shared.api;

import br.com.elora.platform.shared.domain.NaoEncontradoException;
import br.com.elora.platform.shared.domain.RegraVioladaException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/** Erros no formato application/problem+json (RFC 9457), com "detail" pronto para mostrar ao usuário. */
@RestControllerAdvice
public class ProblemasHandler extends ResponseEntityExceptionHandler {
    private static final Logger LOG = LoggerFactory.getLogger(ProblemasHandler.class);

    @ExceptionHandler(RegraVioladaException.class)
    ProblemDetail regra(RegraVioladaException e) {
        return problema(HttpStatus.UNPROCESSABLE_ENTITY, "Regra de negócio", e.getMessage());
    }

    @ExceptionHandler({NaoEncontradoException.class})
    ProblemDetail naoEncontrado(RuntimeException e) {
        return problema(HttpStatus.NOT_FOUND, "Não encontrado", e.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail invalido(IllegalArgumentException e) {
        return problema(HttpStatus.BAD_REQUEST, "Requisição inválida", e.getMessage());
    }

    @ExceptionHandler(OptimisticLockingFailureException.class)
    ProblemDetail concorrencia(OptimisticLockingFailureException e) {
        return problema(HttpStatus.CONFLICT, "Alteração simultânea", "Este registro foi alterado por outra pessoa. Atualize a tela e tente de novo.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ProblemDetail integridade(DataIntegrityViolationException e) {
        LOG.warn("Trava do banco acionada: {}", e.getMostSpecificCause().getMessage());
        return problema(HttpStatus.CONFLICT, "Trava de regra", "A operação viola uma regra cadastrada no banco de dados.");
    }

    private static ProblemDetail problema(HttpStatus status, String titulo, String detalhe) {
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, detalhe);
        p.setTitle(titulo);
        return p;
    }
}
