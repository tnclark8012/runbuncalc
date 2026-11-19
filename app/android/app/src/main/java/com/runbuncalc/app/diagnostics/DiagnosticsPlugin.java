package com.runbuncalc.app.diagnostics;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.net.Uri;
import android.os.Build;
import android.provider.OpenableColumns;
import android.util.Base64;
import android.webkit.WebView;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "Diagnostics")
public final class DiagnosticsPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean saving = new AtomicBoolean();
    private byte[] pendingZip;

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            PackageInfo info = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject result = new JSObject();
            result.put("versionName", info.versionName);
            result.put("versionCode", info.getLongVersionCode());
            result.put("androidApi", Build.VERSION.SDK_INT);
            call.resolve(result);
        } catch (android.content.pm.PackageManager.NameNotFoundException error) {
            call.reject("Cannot read app version.", "VERSION_UNAVAILABLE", error);
        }
    }

    @PluginMethod
    public void captureScreenshot(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            WebView view = getBridge().getWebView();
            int width = view.getWidth();
            int height = view.getHeight();
            if (width <= 0 || height <= 0 || (long) width * height > 16000000) {
                call.reject("The calculator viewport cannot be captured.", "SCREENSHOT_UNAVAILABLE");
                return;
            }
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            try {
                Canvas canvas = new Canvas(bitmap);
                canvas.translate(-view.getScrollX(), -view.getScrollY());
                view.draw(canvas);
            } catch (IllegalArgumentException | IllegalStateException error) {
                bitmap.recycle();
                call.reject("Cannot render the calculator screenshot.", "SCREENSHOT_UNAVAILABLE", error);
                return;
            }
            submit(call, () -> {
                try {
                    ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                    if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, bytes)) {
                        throw new IOException("Cannot encode screenshot.");
                    }
                    JSObject result = new JSObject();
                    result.put("dataBase64", Base64.encodeToString(bytes.toByteArray(), Base64.NO_WRAP));
                    call.resolve(result);
                } finally {
                    bitmap.recycle();
                }
            });
        });
    }

    @PluginMethod
    public void saveZip(PluginCall call) {
        String name = call.getString("name");
        String base64 = call.getString("dataBase64");
        if (name == null || !name.matches("[a-zA-Z0-9._-]+\\.zip") || base64 == null
            || base64.length() > 34000000) {
            call.reject("The diagnostic ZIP name or size is invalid.", "INVALID_ZIP");
            return;
        }
        if (!saving.compareAndSet(false, true)) {
            call.reject("A ZIP save is already in progress.", "BUSY");
            return;
        }
        submit(call, () -> {
            try {
                pendingZip = Base64.decode(base64, Base64.DEFAULT);
            } catch (IllegalArgumentException error) {
                clearPending();
                call.reject("The diagnostic ZIP is not valid base64.", "INVALID_ZIP", error);
                return;
            }
            getActivity().runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/zip");
                intent.putExtra(Intent.EXTRA_TITLE, name);
                try {
                    startActivityForResult(call, intent, "zipDestination");
                } catch (ActivityNotFoundException | SecurityException error) {
                    clearPending();
                    call.reject("No system document picker is available.", "PICKER_UNAVAILABLE", error);
                }
            });
        });
    }

    @ActivityCallback
    private void zipDestination(PluginCall call, ActivityResult result) {
        if (call == null) {
            clearPending();
            return;
        }
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            clearPending();
            call.reject("ZIP save cancelled.", "PICKER_CANCELLED");
            return;
        }
        submit(call, () -> {
            try {
                if (pendingZip == null) throw new IOException("Report data was lost. Prepare the report again.");
                String name;
                try (Cursor cursor = getContext().getContentResolver().query(
                    uri, new String[] {OpenableColumns.DISPLAY_NAME}, null, null, null)) {
                    if (cursor == null || !cursor.moveToFirst() || cursor.isNull(0) || cursor.getString(0).isEmpty()) {
                        throw new IOException("Cannot determine the ZIP filename. Choose another storage provider.");
                    }
                    name = cursor.getString(0);
                }
                try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new IOException("The selected document is not writable.");
                    output.write(pendingZip);
                }
                JSObject response = new JSObject();
                response.put("name", name);
                call.resolve(response);
            } finally {
                clearPending();
            }
        });
    }

    @PluginMethod
    public void copyFilename(PluginCall call) {
        String name = call.getString("name");
        if (name == null || name.isEmpty()) {
            call.reject("The ZIP filename is missing.", "INVALID_FILENAME");
            return;
        }
        getActivity().runOnUiThread(() -> {
            ClipboardManager clipboard = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
            if (clipboard == null) {
                call.reject("The clipboard is unavailable.", "CLIPBOARD_UNAVAILABLE");
                return;
            }
            try {
                clipboard.setPrimaryClip(ClipData.newPlainText("Diagnostic ZIP filename", name));
                call.resolve();
            } catch (SecurityException error) {
                call.reject("Clipboard access was denied.", "CLIPBOARD_UNAVAILABLE", error);
            }
        });
    }

    @PluginMethod
    public void openIssue(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !url.startsWith("https://github.com/tnclark8012/runbuncalc/issues/new?")) {
            call.reject("The issue URL is invalid.", "INVALID_URL");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                getActivity().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                call.resolve();
            } catch (ActivityNotFoundException | SecurityException error) {
                call.reject("No browser is available. Open GitHub and attach the saved ZIP manually.", "BROWSER_UNAVAILABLE", error);
            }
        });
    }

    private void submit(PluginCall call, Operation operation) {
        try {
            worker.execute(() -> {
                try {
                    operation.run();
                } catch (IOException | SecurityException | IllegalStateException | android.database.SQLException error) {
                    call.reject("Diagnostic operation failed: " + error.getMessage(), "DIAGNOSTIC_ERROR", error);
                }
            });
        } catch (RejectedExecutionException error) {
            clearPending();
            call.reject("Diagnostics stopped. Reopen the app and try again.", "APP_CLOSED", error);
        }
    }

    private void clearPending() {
        pendingZip = null;
        saving.set(false);
    }

    private interface Operation {
        void run() throws IOException;
    }

    @Override
    protected void handleOnDestroy() {
        worker.shutdownNow();
        clearPending();
    }
}
