package com.example.homeinventory.dto;

public record CsrfTokenResponse(String headerName, String parameterName, String token) {}
