package com.finanzas.config;

import com.finanzas.common.ConflictException;
import com.finanzas.common.Constants;
import com.finanzas.common.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<?> handleNotFound(NotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, ex.getMessage() == null ? Constants.TITLE_NOT_FOUND : ex.getMessage());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<?> handleConflict(ConflictException ex) {
        return problem(HttpStatus.CONFLICT, ex.getMessage() == null ? Constants.TITLE_CONFLICT : ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleBadRequest(IllegalArgumentException ex) {
        return problem(HttpStatus.BAD_REQUEST, ex.getMessage() == null ? Constants.TITLE_BAD_REQUEST : ex.getMessage());
    }

    private ResponseEntity<?> problem(HttpStatus status, String title) {
        Problem p = new Problem();
        p.status = status.value();
        p.title = title;
        return ResponseEntity.status(status).body(p);
    }

    static class Problem { public String type; public String title; public Integer status; public String detail; public String instance; }
}
