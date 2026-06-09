package com.campus.passportreservation.util;

public final class MaskingUtils {

    private MaskingUtils() {
    }

    public static String maskName(String name) {
        if (name == null || name.isBlank()) {
            return "";
        }
        int length = name.length();
        if (length == 1) {
            return name;
        }
        if (length == 2) {
            return name.charAt(0) + "*" + name.charAt(1);
        }
        return name.charAt(0) + "*".repeat(length - 2) + name.charAt(length - 1);
    }

    public static String maskIdCard(String idCard) {
        if (idCard == null || idCard.length() < 8) {
            return "";
        }
        return idCard.substring(0, 3) + "*".repeat(idCard.length() - 7) + idCard.substring(idCard.length() - 4);
    }

    public static String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return "";
        }
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}
