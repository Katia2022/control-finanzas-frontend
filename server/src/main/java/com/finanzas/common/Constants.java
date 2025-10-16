package com.finanzas.common;

public final class Constants {
    private Constants() {}

    // Settings keys
    public static final String SETTINGS_SAVINGS_MIN_RATE = "savingsMinRate";
    public static final String SETTINGS_CURRENCY_CODE = "currencyCode";
    public static final String SETTINGS_MONTH_CUTOFF_DAY = "monthCutoffDay";

    // Defaults
    public static final double DEFAULT_SAVINGS_MIN_RATE = 0.1;
    public static final String DEFAULT_CURRENCY_CODE = "EUR";
    public static final String FALLBACK_CURRENCY_CODE_IF_BLANK = "MXN";
    public static final int DEFAULT_MONTH_CUTOFF_DAY = 1;

    // Categories / domain names
    public static final String CATEGORY_INTERNAL_TRANSFER = "Transferencia interna";

    // Savings descriptions
    public static final String SAVINGS_DEFAULT_NOTE = "Ahorro puntual";

    // Error messages / titles
    public static final String ERR_ACCOUNT_EXISTS = "Account exists";
    public static final String ERR_CATEGORY_EXISTS = "Category exists";
    public static final String ERR_AMOUNT_POSITIVE = "amount must be > 0";
    public static final String ERR_SOURCE_TARGET_TYPES = "source/target must be one OPERATIVA and one AHORRO";
    public static final String ERR_DATE_REQUIRED = "date is required";
    public static final String ERR_INVALID_DATE_FORMAT = "Invalid date format";

    public static final String TITLE_NOT_FOUND = "Not found";
    public static final String TITLE_CONFLICT = "Conflict";
    public static final String TITLE_BAD_REQUEST = "Bad request";

    // API metadata
    public static final String API_TITLE = "Control Finanzas API";
    public static final String API_VERSION = "0.1.0";
    public static final String API_DESCRIPTION = "API para cuentas y ahorro (iteración inicial)";

    // CORS
    public static final String CORS_API_PATTERN = "/api/**";
    public static final String[] CORS_ALLOWED_ORIGIN_PATTERNS = new String[] {"http://localhost:*", "http://127.0.0.1:*", "app://*", "http://0.0.0.0:*"};
    public static final String[] CORS_ALLOWED_METHODS = new String[] {"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"};
}

