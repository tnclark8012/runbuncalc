package com.runbuncalc.app.storage;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "SaveAccess")
public final class SaveAccessPlugin extends Plugin {
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean busy = new AtomicBoolean();
    private SaveDocumentRepository documents;

    @Override
    public void load() {
        documents = new SaveDocumentRepository(getContext());
    }

    @PluginMethod
    public void getState(PluginCall call) {
        execute(call, documents::getState);
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        execute(call, documents::listFiles);
    }

    @PluginMethod
    public void selectFile(PluginCall call) {
        String uri = call.getString("uri");
        if (uri == null || uri.isEmpty()) {
            call.reject("Select a file from the connected folder.", "INVALID_SELECTION");
            return;
        }
        execute(call, () -> documents.selectFile(uri));
    }

    @PluginMethod
    public void readSelected(PluginCall call) {
        execute(call, documents::readSelected);
    }

    @PluginMethod
    public void forget(PluginCall call) {
        execute(call, documents::forget);
    }

    @PluginMethod
    public void chooseFolder(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
        intent.addFlags(Intent.FLAG_GRANT_PREFIX_URI_PERMISSION);
        choose(call, intent, "folderPicked");
    }

    @PluginMethod
    public void chooseFile(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.setType("*/*");
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        choose(call, intent, "filePicked");
    }

    private void choose(PluginCall call, Intent intent, String callback) {
        if (!begin(call)) return;
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        getActivity().runOnUiThread(() -> {
            try {
                startActivityForResult(call, intent, callback);
            } catch (ActivityNotFoundException error) {
                busy.set(false);
                call.reject("No system document picker is available on this device.", "PICKER_UNAVAILABLE", error);
            }
        });
    }

    @ActivityCallback
    private void folderPicked(PluginCall call, ActivityResult result) {
        picked(call, result, true);
    }

    @ActivityCallback
    private void filePicked(PluginCall call, ActivityResult result) {
        picked(call, result, false);
    }

    private void picked(PluginCall call, ActivityResult result, boolean folder) {
        if (call == null) {
            busy.set(false);
            return;
        }
        Intent data = result.getData();
        Uri uri = data == null ? null : data.getData();
        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            busy.set(false);
            call.reject("Selection cancelled. The previous connection is unchanged.", "PICKER_CANCELLED");
            return;
        }
        if ((data.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION) == 0
            || (data.getFlags() & Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION) == 0) {
            busy.set(false);
            call.reject("This provider did not grant persistent read access. Choose a local document.", "PERMISSION_REQUIRED");
            return;
        }
        submit(call, () -> documents.connect(uri, folder));
    }

    private boolean begin(PluginCall call) {
        if (busy.compareAndSet(false, true)) return true;
        call.reject("Another save operation is in progress.", "BUSY");
        return false;
    }

    private void execute(PluginCall call, Operation action) {
        if (begin(call)) submit(call, action);
    }

    private void submit(PluginCall call, Operation action) {
        try {
            worker.execute(() -> {
                try {
                    JSObject result = action.run();
                    busy.set(false);
                    call.resolve(result);
                } catch (SaveAccessException error) {
                    busy.set(false);
                    call.reject(error.getMessage(), error.code, error);
                } catch (SecurityException error) {
                    busy.set(false);
                    call.reject("Save access was denied. Reconnect the file or folder.", "PERMISSION_REQUIRED", error);
                } catch (FileNotFoundException error) {
                    busy.set(false);
                    call.reject("The save is missing. Reconnect its file or folder.", "FILE_NOT_FOUND", error);
                } catch (IOException | IllegalArgumentException | IllegalStateException | android.database.SQLException error) {
                    busy.set(false);
                    call.reject("Cannot access the save: " + error.getMessage(), "IO_ERROR", error);
                }
            });
        } catch (RejectedExecutionException error) {
            busy.set(false);
            call.reject("Save access has stopped. Reopen the app and try again.", "APP_CLOSED", error);
        }
    }

    private interface Operation {
        JSObject run() throws SaveAccessException, IOException;
    }

    @Override
    protected void handleOnDestroy() {
        worker.shutdownNow();
    }
}
