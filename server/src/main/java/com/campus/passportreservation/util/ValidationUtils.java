package com.campus.passportreservation.util;

import java.util.regex.Pattern;

public final class ValidationUtils {

    private static final Pattern PHONE = Pattern.compile("^1[3-9]\\d{9}$");
    private static final Pattern ID_CARD = Pattern.compile("^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]$");
    private static final Pattern PASSWORD = Pattern.compile("^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$");

    private ValidationUtils() {
    }

    public static boolean isPhone(String value) {
        return value != null && PHONE.matcher(value).matches();
    }

    public static boolean isIdCard(String value) {
        return value != null && ID_CARD.matcher(value).matches();
    }

    public static boolean isStrongPassword(String value) {
        return value != null && PASSWORD.matcher(value).matches();
    }
}
