package com.campus.passportreservation.service;

import com.campus.passportreservation.common.BusinessException;
import com.campus.passportreservation.config.AppSecurityProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.Mac;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class CryptoService {

    private static final String AES_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;

    private final AppSecurityProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return null;
        }
        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, aesKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, payload, 0, iv.length);
            System.arraycopy(encrypted, 0, payload, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(payload);
        } catch (Exception exception) {
            throw new BusinessException(500, "敏感数据加密失败");
        }
    }

    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isBlank()) {
            return null;
        }
        try {
            byte[] payload = Base64.getDecoder().decode(cipherText);
            byte[] iv = new byte[IV_LENGTH];
            byte[] encrypted = new byte[payload.length - IV_LENGTH];
            System.arraycopy(payload, 0, iv, 0, IV_LENGTH);
            System.arraycopy(payload, IV_LENGTH, encrypted, 0, encrypted.length);
            Cipher cipher = Cipher.getInstance(AES_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, aesKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception exception) {
            throw new BusinessException(500, "敏感数据解密失败");
        }
    }

    public String queryHash(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return sha256(properties.getQueryHashSalt() + ":" + normalize(value));
    }

    public String hmac(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getAuditHmacKey().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new BusinessException(500, "审计摘要计算失败");
        }
    }

    private String sha256(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new BusinessException(500, "查询摘要计算失败");
        }
    }

    private SecretKeySpec aesKey() {
        byte[] key = properties.getSensitiveKey().getBytes(StandardCharsets.UTF_8);
        if (key.length != 16 && key.length != 24 && key.length != 32) {
            throw new BusinessException(500, "APP_SENSITIVE_KEY 必须是 16、24 或 32 字节");
        }
        return new SecretKeySpec(key, "AES");
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toUpperCase();
    }
}
