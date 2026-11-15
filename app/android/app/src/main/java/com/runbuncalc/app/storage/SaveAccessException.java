package com.runbuncalc.app.storage;

public final class SaveAccessException extends Exception {
    public final String code;

    public SaveAccessException(String code, String message) {
        super(message);
        this.code = code;
    }

    public SaveAccessException(String code, String message, Exception cause) {
        super(message, cause);
        this.code = code;
    }
}
