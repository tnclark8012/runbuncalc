package com.runbuncalc.app.updates;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public final class UpdateManifest {
    public static final long MAX_ARCHIVE_BYTES = 64L * 1024 * 1024;
    public static final String RELEASE_ROOT = "https://github.com/tnclark8012/runbuncalc/releases/download/";
    static final String PUBLIC_KEY = "MCowBQYDK2VwAyEAFY6rdS8PYPybJbzyQHHpNeSuax9NQz1b3Nt/N7KX/vI=";
    public final String version;
    public final String url;
    public final String sha256;
    public final long size;

    private UpdateManifest(JSONObject payload, int compatibility) throws JSONException, IOException {
        require(payload.getInt("schemaVersion") == 1, "Unsupported update schema.");
        require(payload.getInt("nativeCompatibility") == compatibility,
            "This release needs a different APK. Your current calculator is unchanged.");
        version = payload.getString("version");
        long run = payload.getLong("runId");
        long attempt = payload.getLong("runAttempt");
        require(run > 0 && attempt > 0 && payload.getLong("runNumber") > 0 &&
            version.equals("web-" + run + "-" + attempt), "Invalid update version.");
        require(payload.getString("commit").matches("[a-f0-9]{40}"), "Invalid update commit.");
        JSONObject bundle = payload.getJSONObject("bundle");
        url = bundle.getString("url");
        require(url.equals(RELEASE_ROOT + version + "/bundle.zip"), "Untrusted bundle URL.");
        sha256 = bundle.getString("sha256");
        require(sha256.matches("[a-f0-9]{64}"), "Invalid bundle checksum.");
        size = bundle.getLong("size");
        require(size > 0 && size <= MAX_ARCHIVE_BYTES, "Update archive exceeds the download limit.");
    }

    public static UpdateManifest verify(byte[] envelope, int compatibility) throws IOException {
        return verify(envelope, compatibility, PUBLIC_KEY);
    }

    static UpdateManifest verify(byte[] envelope, int compatibility, String publicKey) throws IOException {
        require(envelope.length <= 64 * 1024, "Update manifest is too large.");
        try {
            JSONObject signed = new JSONObject(new String(envelope, StandardCharsets.UTF_8));
            byte[] payload = Base64.getDecoder().decode(signed.getString("payload"));
            byte[] signature = Base64.getDecoder().decode(signed.getString("signature"));
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(KeyFactory.getInstance("Ed25519").generatePublic(
                new X509EncodedKeySpec(Base64.getDecoder().decode(publicKey))));
            verifier.update(payload);
            require(verifier.verify(signature), "Update signature verification failed.");
            return new UpdateManifest(new JSONObject(new String(payload, StandardCharsets.UTF_8)), compatibility);
        } catch (JSONException | GeneralSecurityException | IllegalArgumentException error) {
            throw new IOException("Cannot verify update manifest: " + error.getMessage(), error);
        }
    }

    static void require(boolean valid, String message) throws IOException {
        if (!valid) throw new IOException(message);
    }
}
