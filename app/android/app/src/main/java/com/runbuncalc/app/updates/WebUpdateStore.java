package com.runbuncalc.app.updates;

import static com.runbuncalc.app.updates.UpdateManifest.require;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.runbuncalc.app.BuildConfig;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

public final class WebUpdateStore {
    private static WebUpdateStore instance;
    private final SharedPreferences preferences;
    private final File root;
    private final int compatibility;
    private final String publicKey;

    public static synchronized WebUpdateStore getInstance(Context context) {
        if (instance == null) instance = new WebUpdateStore(context.getApplicationContext());
        return instance;
    }

    public WebUpdateStore(Context context) {
        this(context, BuildConfig.WEB_UPDATE_COMPATIBILITY);
    }

    WebUpdateStore(Context context, int compatibility) {
        this(context, compatibility, UpdateManifest.PUBLIC_KEY);
    }

    WebUpdateStore(Context context, int compatibility, String publicKey) {
        this.preferences = context.getSharedPreferences("web-updates", Context.MODE_PRIVATE);
        this.root = new File(context.getNoBackupFilesDir(), "web-updates");
        this.compatibility = compatibility;
        this.publicKey = publicKey;
    }

    private String value(String key) {
        return preferences.getString(key, "");
    }

    private void save(SharedPreferences.Editor editor) throws IOException {
        require(editor.commit(), "Cannot persist web update state.");
    }

    private File directory(String version) throws IOException {
        require(version.matches("web-[1-9][0-9]*-[1-9][0-9]*"), "Invalid stored web update version.");
        return new File(root, version);
    }

    public synchronized File prepareLaunch(String apkIdentity) throws IOException {
        if (!apkIdentity.equals(value("apk"))) {
            save(preferences.edit().clear().putString("apk", apkIdentity));
            UpdateFiles.remove(root);
        }
        if (!value("trial").isEmpty()) rollback("The last web update did not finish starting. Restored the previous calculator.");
        String pending = value("pending");
        if (!pending.isEmpty()) {
            save(preferences.edit().putString("previous", value("active")).putString("active", pending)
                .putString("trial", pending).remove("pending")
                .putString("message", "Starting downloaded update.").putBoolean("error", false));
        }
        try {
            return activeDirectory();
        } catch (IOException error) {
            rollback("Cannot load downloaded calculator: " + error.getMessage());
            try {
                return activeDirectory();
            } catch (IOException fallbackError) {
                save(preferences.edit().remove("active").remove("previous"));
                failure("Downloaded fallback is unavailable. Using the bundled calculator: " + fallbackError.getMessage());
                return null;
            }
        }
    }

    public synchronized File activeDirectory() throws IOException {
        String active = value("active");
        if (active.isEmpty()) return null;
        File directory = directory(active);
        UpdateManifest manifest = UpdateManifest.verify(
            Files.readAllBytes(new File(directory, "update.json").toPath()), compatibility, publicKey);
        require(manifest.version.equals(active) && new File(directory, "index.html").isFile(),
            "Stored update is incomplete.");
        return directory;
    }

    public synchronized boolean isTrial() {
        return !value("trial").isEmpty();
    }

    public synchronized void ready() throws IOException {
        if (isTrial()) {
            save(preferences.edit().remove("trial").putString("message", "Downloaded calculator started successfully.")
                .putBoolean("error", false));
        }
    }

    public synchronized void rollback(String message) throws IOException {
        String rejected = value("active");
        save(preferences.edit().putString("active", value("previous")).remove("previous")
            .remove("trial").remove("pending").putString("failed", rejected)
            .putString("message", message).putBoolean("error", true));
    }

    public synchronized JSObject state() {
        JSObject result = new JSObject();
        result.put("channel", "continuous");
        result.put("active", value("active").isEmpty() ? "bundled" : value("active"));
        result.put("pending", value("pending"));
        result.put("message", value("message"));
        result.put("error", preferences.getBoolean("error", false));
        return result;
    }

    public synchronized void failure(String message) throws IOException {
        save(preferences.edit().putString("message", message).putBoolean("error", true));
    }

    public void check() throws IOException {
        byte[] envelope = UpdateDownload.manifest();
        UpdateManifest manifest = UpdateManifest.verify(envelope, compatibility, publicKey);
        synchronized (this) {
            if (manifest.version.equals(value("failed"))) {
                failure("This update previously failed to start. Waiting for a different release.");
                return;
            }
            if (manifest.version.equals(value("active")) || manifest.version.equals(value("pending"))) {
                save(preferences.edit().putString("message",
                    value("pending").isEmpty() ? "Calculator is up to date." : "Update downloaded. Close and reopen the app to apply it.")
                    .putBoolean("error", false));
                return;
            }
        }
        require(root.isDirectory() || root.mkdirs(), "Cannot create web update storage.");
        File archive = new File(root, "download.zip");
        File staging = new File(root, "staging");
        try {
            UpdateFiles.remove(archive);
            UpdateFiles.remove(staging);
            UpdateDownload.archive(manifest, archive);
            UpdateFiles.verifyArchive(archive, manifest);
            UpdateFiles.extract(archive, staging);
            Files.write(new File(staging, "update.json").toPath(), envelope);
            synchronized (this) {
                // Never replace a directory that the WebView may still be serving.
                require(!manifest.version.equals(value("active")),
                    "This release is already active.");
                File destination = directory(manifest.version);
                UpdateFiles.remove(destination);
                require(staging.renameTo(destination), "Cannot finalize downloaded update.");
                save(preferences.edit().putString("pending", manifest.version)
                    .putString("message", "Update downloaded. Close and reopen the app to apply it.")
                    .putBoolean("error", false));
                clean();
            }
        } finally {
            UpdateFiles.remove(archive);
            UpdateFiles.remove(staging);
        }
    }

    private void clean() throws IOException {
        File[] children = root.listFiles();
        require(children != null, "Cannot list stored web updates.");
        for (File child : children) {
            String name = child.getName();
            if (!name.equals(value("active")) && !name.equals(value("previous")) && !name.equals(value("pending"))) {
                UpdateFiles.remove(child);
            }
        }
    }
}
