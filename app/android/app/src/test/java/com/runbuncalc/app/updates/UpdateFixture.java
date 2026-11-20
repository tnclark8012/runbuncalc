package com.runbuncalc.app.updates;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Signature;
import java.util.Base64;

final class UpdateFixture {
    final KeyPair keys = KeyPairGenerator.getInstance("Ed25519").generateKeyPair();
    final String publicKey = Base64.getEncoder().encodeToString(keys.getPublic().getEncoded());

    UpdateFixture() throws Exception {}

    JSONObject payload(int run) throws Exception {
        return new JSONObject().put("schemaVersion", 1).put("nativeCompatibility", 2)
            .put("version", "web-" + run + "-1").put("runId", run).put("runAttempt", 1)
            .put("runNumber", run).put("commit", "a".repeat(40))
            .put("bundle", new JSONObject().put("url", UpdateManifest.RELEASE_ROOT + "web-" + run + "-1/bundle.zip")
                .put("sha256", "0".repeat(64)).put("size", 10));
    }

    byte[] sign(JSONObject payload) throws Exception {
        byte[] bytes = payload.toString().getBytes(StandardCharsets.UTF_8);
        Signature signer = Signature.getInstance("Ed25519");
        signer.initSign(keys.getPrivate());
        signer.update(bytes);
        return new JSONObject().put("payload", Base64.getEncoder().encodeToString(bytes))
            .put("signature", Base64.getEncoder().encodeToString(signer.sign()))
            .toString().getBytes(StandardCharsets.UTF_8);
    }
}
