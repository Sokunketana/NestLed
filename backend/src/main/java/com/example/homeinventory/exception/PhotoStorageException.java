package com.example.homeinventory.exception;

public class PhotoStorageException extends RuntimeException {
    public PhotoStorageException(String message) { super(message); }
    public PhotoStorageException(String message, Throwable cause) { super(message, cause); }
}
