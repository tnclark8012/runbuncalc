package com.runbuncalc.app.updates;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 37)
public class UpdateManifestTest {
    @Test
    public void verifiesSignedPayloadBeforeTrustingBundleMetadata() throws Exception {
        UpdateFixture fixture = new UpdateFixture();
        byte[] signed = fixture.sign(fixture.payload(123));
        assertEquals("web-123-1", UpdateManifest.verify(signed, 2, fixture.publicKey).version);
        assertThrows(IOException.class, () -> UpdateManifest.verify(signed, 2, new UpdateFixture().publicKey));
        JSONObject tampered = new JSONObject(new String(signed, StandardCharsets.UTF_8));
        tampered.put("payload", Base64.getEncoder().encodeToString(fixture.payload(124).toString()
            .getBytes(StandardCharsets.UTF_8)));
        assertThrows(IOException.class, () -> UpdateManifest.verify(
            tampered.toString().getBytes(StandardCharsets.UTF_8), 2, fixture.publicKey));
    }

    @Test
    public void rejectsIncompatibleNativeContractsSchemasAndForeignBundleUrls() throws Exception {
        UpdateFixture fixture = new UpdateFixture();
        byte[] signed = fixture.sign(fixture.payload(123));
        assertThrows(IOException.class, () -> UpdateManifest.verify(signed, 1, fixture.publicKey));
        JSONObject schema = fixture.payload(123).put("schemaVersion", 99);
        assertThrows(IOException.class, () -> UpdateManifest.verify(fixture.sign(schema), 2, fixture.publicKey));
        JSONObject foreign = fixture.payload(123);
        foreign.getJSONObject("bundle").put("url", "https://example.com/bundle.zip");
        assertThrows(IOException.class, () -> UpdateManifest.verify(fixture.sign(foreign), 2, fixture.publicKey));
        JSONObject oversized = fixture.payload(123);
        oversized.getJSONObject("bundle").put("size", UpdateManifest.MAX_ARCHIVE_BYTES + 1);
        assertThrows(IOException.class, () -> UpdateManifest.verify(fixture.sign(oversized), 2, fixture.publicKey));
        assertThrows(IOException.class, () -> UpdateManifest.verify(new byte[65537], 2, fixture.publicKey));
    }

    @Test
    public void onlyAllowsHttpsGithubAssetRedirectsWithoutCredentialsOrUnexpectedPorts() throws Exception {
        UpdateDownload.validateUrl(new URI("https://release-assets.githubusercontent.com/path?token=example"));
        for (String url : new String[] {
            "http://github.com/file", "https://github.com.evil.example/file",
            "https://evil.example/file", "https://github.com:444/file",
            "https://user:password@github.com/file", "https://127.0.0.1/file",
            "file:///tmp/bundle.zip", "https://github.com/file#fragment"
        }) {
            assertThrows(url, IOException.class, () -> UpdateDownload.validateUrl(new URI(url)));
        }
    }
}
