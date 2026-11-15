package com.runbuncalc.saveaccessprototype;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.DocumentsContract;
import android.provider.OpenableColumns;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {
    private static final int PICK_FOLDER = 1;
    private static final int PICK_FILE = 2;
    private static final long MAX_BYTES = 32L * 1024 * 1024;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final JSONObject state = new JSONObject();
    private SharedPreferences preferences;
    private WebView web;
    private boolean busy;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences("prototype-access", MODE_PRIVATE);
        put(state, "folderUri", preferences.getString("folderUri", ""));
        put(state, "selectedUri", preferences.getString("selectedUri", ""));
        put(state, "files", new JSONArray());
        put(state, "status", "Ready. Choose a folder or file, or reread the remembered file.");
        put(state, "result", JSONObject.NULL);
        web = new WebView(this);
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.addJavascriptInterface(new PickerBridge(), "SaveAccess");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return new WebResourceResponse("text/plain", "UTF-8",
                    new ByteArrayInputStream(new byte[0]));
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                render();
            }
        });
        web.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets;
        });
        setContentView(web);
        try (InputStream page = getAssets().open("index.html")) {
            ByteArrayOutputStream html = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int count;
            while ((count = page.read(buffer)) != -1) html.write(buffer, 0, count);
            web.loadDataWithBaseURL("https://prototype.invalid/",
                html.toString(StandardCharsets.UTF_8.name()), "text/html", "UTF-8", null);
        } catch (IOException error) {
            throw new IllegalStateException("Bundled prototype page is missing", error);
        }
    }

    public class PickerBridge {
        @JavascriptInterface
        public void chooseFolder() {
            runOnUiThread(() -> {
                if (busy) return;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                    | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
                    | Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
                startActivityForResult(intent, PICK_FOLDER);
            });
        }

        @JavascriptInterface
        public void chooseFile() {
            runOnUiThread(() -> {
                if (busy) return;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION
                    | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
                startActivityForResult(intent, PICK_FILE);
            });
        }

        @JavascriptInterface
        public void refreshFolder() {
            runOnUiThread(() -> listFolder(state.optString("folderUri")));
        }

        @JavascriptInterface
        public void readFile(String selectedUri) {
            runOnUiThread(() -> read(selectedUri));
        }

        @JavascriptInterface
        public void reread() {
            runOnUiThread(() -> read(state.optString("selectedUri")));
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_FOLDER && requestCode != PICK_FILE) return;
        if (resultCode != RESULT_OK || data == null || data.getData() == null) {
            status("Picker cancelled. Previous selection is unchanged.", false);
            return;
        }
        Uri uri = data.getData();
        try {
            getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
            String key = requestCode == PICK_FOLDER ? "folderUri" : "selectedUri";
            preferences.edit().putString(key, uri.toString()).apply();
            put(state, key, uri.toString());
            if (requestCode == PICK_FOLDER) {
                preferences.edit().remove("selectedUri").apply();
                put(state, "selectedUri", "");
                put(state, "files", new JSONArray());
                put(state, "result", JSONObject.NULL);
            }
            releaseUnusedGrants();
            if (requestCode == PICK_FOLDER) listFolder(uri.toString());
            else read(uri.toString());
        } catch (SecurityException error) {
            status("Permission could not be retained: " + error.getMessage()
                + ". Select a local folder/file using the system picker.", true);
        }
    }

    private void listFolder(String value) {
        if (busy) return;
        if (value.isEmpty()) {
            status("Choose a folder first.", true);
            return;
        }
        setBusy("Listing direct child files...");
        worker.execute(() -> {
            try {
                Uri tree = Uri.parse(value);
                Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree,
                    DocumentsContract.getTreeDocumentId(tree));
                JSONArray files = new JSONArray();
                boolean truncated = false;
                try (Cursor cursor = getContentResolver().query(children, new String[] {
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_MIME_TYPE
                }, null, null, null)) {
                    if (cursor == null) throw new IOException("Provider returned no file listing.");
                    while (cursor.moveToNext()) {
                        if (DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(2))) continue;
                        if (files.length() == 200) {
                            truncated = true;
                            break;
                        }
                        JSONObject file = new JSONObject();
                        put(file, "name", cursor.getString(1));
                        put(file, "uri", DocumentsContract.buildDocumentUriUsingTree(tree,
                            cursor.getString(0)).toString());
                        files.put(file);
                    }
                }
                String message = "Listed " + files.length() + " files. Subfolders are not scanned."
                    + (truncated ? " Listing limited to 200 files; choose a smaller folder." : "");
                runOnUiThread(() -> {
                    put(state, "files", files);
                    finish(message, false);
                });
            } catch (IOException | SecurityException | IllegalArgumentException error) {
                runOnUiThread(() -> finish("Cannot list folder: " + error.getMessage()
                    + ". Try selecting the folder again.", true));
            }
        });
    }

    private void read(String value) {
        if (busy) return;
        if (value.isEmpty()) {
            status("Choose a file first.", true);
            return;
        }
        Uri uri = Uri.parse(value);
        if (!"content".equals(uri.getScheme())) {
            status("Use a file selected through Android's document picker, not an absolute path.", true);
            return;
        }
        // Only accept a saved selection or an entry returned by the granted folder's provider.
        boolean allowed = value.equals(state.optString("selectedUri"));
        JSONArray files = state.optJSONArray("files");
        for (int i = 0; files != null && i < files.length(); i++) {
            if (value.equals(files.optJSONObject(i).optString("uri"))) allowed = true;
        }
        if (!allowed) {
            status("Select the file from the folder listing or system picker.", true);
            return;
        }
        put(state, "selectedUri", value);
        preferences.edit().putString("selectedUri", value).apply();
        releaseUnusedGrants();
        put(state, "result", JSONObject.NULL);
        setBusy("Reading bytes locally (32 MiB limit)...");
        worker.execute(() -> {
            try {
                JSONObject result = new JSONObject();
                try (Cursor cursor = getContentResolver().query(uri,
                    new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                    if (cursor != null && cursor.moveToFirst()) put(result, "name", cursor.getString(0));
                }
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long bytes = 0;
                try (InputStream stream = getContentResolver().openInputStream(uri)) {
                    if (stream == null) throw new IOException("Provider returned no readable stream.");
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = stream.read(buffer)) != -1) {
                        bytes += count;
                        if (bytes > MAX_BYTES) throw new IOException("File exceeds the 32 MiB prototype limit.");
                        digest.update(buffer, 0, count);
                    }
                }
                StringBuilder hash = new StringBuilder();
                for (byte valueByte : digest.digest()) {
                    hash.append(String.format(Locale.ROOT, "%02x", valueByte & 0xff));
                }
                put(result, "bytes", bytes);
                put(result, "sha256", hash.toString());
                put(result, "readAt", Instant.now().toString());
                runOnUiThread(() -> {
                    put(state, "result", result);
                    finish("Read complete. Bytes stayed on this device. This does not decode Pokemon data.", false);
                });
            } catch (IOException | SecurityException | IllegalArgumentException error) {
                runOnUiThread(() -> finish("Read failed: " + error.getMessage()
                    + ". Access may have changed; reselect the folder/file.", true));
            } catch (NoSuchAlgorithmException error) {
                runOnUiThread(() -> finish("SHA-256 is unavailable: " + error.getMessage(), true));
            }
        });
    }

    private void releaseUnusedGrants() {
        String folder = preferences.getString("folderUri", "");
        String file = preferences.getString("selectedUri", "");
        for (android.content.UriPermission permission : getContentResolver().getPersistedUriPermissions()) {
            String uri = permission.getUri().toString();
            if (!uri.equals(folder) && !uri.equals(file)) {
                getContentResolver().releasePersistableUriPermission(permission.getUri(),
                    Intent.FLAG_GRANT_READ_URI_PERMISSION);
            }
        }
    }

    private void setBusy(String message) {
        busy = true;
        status(message, false);
    }

    private void finish(String message, boolean error) {
        busy = false;
        status(message, error);
    }

    private void status(String message, boolean error) {
        put(state, "status", message);
        put(state, "error", error);
        render();
    }

    private void render() {
        if (isDestroyed()) return;
        put(state, "busy", busy);
        put(state, "androidVersion", android.os.Build.VERSION.RELEASE);
        put(state, "apiLevel", android.os.Build.VERSION.SDK_INT);
        JSONArray grants = new JSONArray();
        for (android.content.UriPermission grant : getContentResolver().getPersistedUriPermissions()) {
            JSONObject item = new JSONObject();
            put(item, "uri", grant.getUri().toString());
            put(item, "read", grant.isReadPermission());
            grants.put(item);
        }
        put(state, "persistedGrants", grants);
        web.evaluateJavascript("window.renderState(" + state + ")", null);
    }

    private static void put(JSONObject target, String key, Object value) {
        try {
            target.put(key, value);
        } catch (JSONException error) {
            throw new IllegalStateException("Cannot display prototype state", error);
        }
    }

    @Override
    protected void onDestroy() {
        worker.shutdownNow();
        web.removeJavascriptInterface("SaveAccess");
        web.destroy();
        super.onDestroy();
    }
}
