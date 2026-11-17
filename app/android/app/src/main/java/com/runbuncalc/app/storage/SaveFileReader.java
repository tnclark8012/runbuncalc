package com.runbuncalc.app.storage;

import java.io.IOException;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

public final class SaveFileReader {
    public static final long MAX_BYTES = 32L * 1024 * 1024;

    public static final class Result {
        public final long bytes;
        public final String sha256;
        public final byte[] data;

        private Result(long bytes, String sha256, byte[] data) {
            this.bytes = bytes;
            this.sha256 = sha256;
            this.data = data;
        }
    }

    public Result read(InputStream stream, long maxBytes) throws IOException, SaveAccessException {
        return read(stream, maxBytes, false);
    }

    public Result read(InputStream stream, long maxBytes, boolean includeData) throws IOException, SaveAccessException {
        final MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-256");
        } catch (NoSuchAlgorithmException error) {
            throw new SaveAccessException("HASH_UNAVAILABLE", "SHA-256 is unavailable on this device.", error);
        }
        long bytes = 0;
        ByteArrayOutputStream data = includeData ? new ByteArrayOutputStream() : null;
        byte[] buffer = new byte[8192];
        int count;
        while ((count = stream.read(buffer)) != -1) {
            if (Thread.currentThread().isInterrupted()) {
                throw new SaveAccessException("CANCELLED", "The save read was interrupted. Try again.");
            }
            bytes += count;
            if (bytes > maxBytes) {
                throw new SaveAccessException("FILE_TOO_LARGE", "The save exceeds the 32 MiB read limit.");
            }
            digest.update(buffer, 0, count);
            if (data != null) data.write(buffer, 0, count);
        }
        StringBuilder hash = new StringBuilder();
        for (byte value : digest.digest()) hash.append(String.format(Locale.ROOT, "%02x", value & 0xff));
        return new Result(bytes, hash.toString(), data == null ? null : data.toByteArray());
    }
}
