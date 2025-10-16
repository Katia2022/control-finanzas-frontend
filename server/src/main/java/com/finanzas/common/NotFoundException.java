package com.finanzas.common;

public class NotFoundException extends RuntimeException {
    public NotFoundException() { super(); }
    public NotFoundException(String message) { super(message); }
}

