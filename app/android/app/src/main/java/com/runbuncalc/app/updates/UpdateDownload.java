package com.runbuncalc.app.updates;

import static com.runbuncalc.app.updates.UpdateManifest.require;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Set;

import javax.net.ssl.HttpsURLConnection;

final class UpdateDownload {
    private static final Set<String> HOSTS = Set.of(
        "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com",
        "github-releases.githubusercontent.com"
    );
    static final String CHANNEL_URL = UpdateManifest.RELEASE_ROOT + "web-continuous/update.json";

    static byte[] manifest() throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        download(CHANNEL_URL, output, 64 * 1024);
        return output.toByteArray();
    }

    static void archive(UpdateManifest manifest, File destination) throws IOException {
        try (OutputStream output = new FileOutputStream(destination)) {
            download(manifest.url, output, manifest.size);
        }
    }

    static void validateUrl(URI uri) throws IOException {
        require("https".equals(uri.getScheme()) && HOSTS.contains(uri.getHost()) &&
            uri.getUserInfo() == null && (uri.getPort() == -1 || uri.getPort() == 443) &&
            uri.getFragment() == null, "Untrusted update download destination.");
    }

    private static void download(String location, OutputStream output, long limit) throws IOException {
        long deadline = System.nanoTime() + 300_000_000_000L;
        for (int redirects = 0; redirects <= 5; redirects++) {
            URI uri;
            try {
                uri = new URI(location);
            } catch (URISyntaxException error) {
                throw new IOException("Invalid update download URL.", error);
            }
            validateUrl(uri);
            HttpsURLConnection connection = (HttpsURLConnection) new URL(location).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(30000);
            connection.setUseCaches(false);
            connection.setRequestProperty("Cache-Control", "no-cache");
            connection.setRequestProperty("User-Agent", "RnBCalc-Android-Updater");
            connection.setRequestProperty("Accept-Encoding", "identity");
            try {
                int status = connection.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String target = connection.getHeaderField("Location");
                    require(target != null, "Update redirect has no destination.");
                    location = uri.resolve(target).toString();
                    continue;
                }
                require(status == 200, "Update download failed (HTTP " + status + ").");
                require(connection.getContentLengthLong() <= limit, "Update download exceeds the size limit.");
                try (InputStream input = connection.getInputStream()) {
                    byte[] buffer = new byte[16384];
                    long total = 0;
                    int count;
                    while ((count = input.read(buffer)) != -1) {
                        total += count;
                        require(!Thread.currentThread().isInterrupted(), "Update download was cancelled.");
                        require(total <= limit, "Update download exceeds the size limit.");
                        require(System.nanoTime() < deadline, "Update download timed out.");
                        output.write(buffer, 0, count);
                    }
                }
                return;
            } finally {
                connection.disconnect();
            }
        }
        throw new IOException("Too many update download redirects.");
    }
}
