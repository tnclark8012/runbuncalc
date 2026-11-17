package com.runbuncalc.app.storage;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.Uri;

public final class SaveSelectionStore {
    private static final int VERSION = 1;
    private final SharedPreferences preferences;

    public SaveSelectionStore(Context context) {
        this(context, "save-connection");
    }

    SaveSelectionStore(Context context, String name) {
        preferences = context.getSharedPreferences(name, Context.MODE_PRIVATE);
    }

    public SaveSelection load() throws SaveAccessException {
        try {
            if (!preferences.contains("version")) {
                if (!preferences.getAll().isEmpty()) throw invalid();
                return SaveSelection.empty();
            }
            if (preferences.getInt("version", -1) != VERSION) throw invalid();
            String folder = preferences.getString("folderUri", null);
            String file = preferences.getString("fileUri", null);
            validateUri(folder);
            validateUri(file);
            if (folder != null) {
                SaveSelection selection = SaveSelection.folder(folder);
                return file == null ? selection : selection.selectChild(file);
            }
            return file == null ? SaveSelection.empty() : SaveSelection.file(file);
        } catch (ClassCastException error) {
            throw new SaveAccessException("INVALID_SELECTION",
                "The saved connection is invalid. Forget it and reconnect your save.", error);
        }
    }

    public void save(SaveSelection selection) throws SaveAccessException {
        if (!preferences.edit().clear().putInt("version", VERSION)
            .putString("folderUri", selection.folderUri).putString("fileUri", selection.fileUri).commit()) {
            throw new SaveAccessException("STORAGE_ERROR", "Could not persist the save connection. Try again.");
        }
    }

    public void clear() throws SaveAccessException {
        if (!preferences.edit().clear().commit()) {
            throw new SaveAccessException("STORAGE_ERROR", "Could not forget the save connection. Try again.");
        }
    }

    private static void validateUri(String value) throws SaveAccessException {
        if (value != null && !"content".equals(Uri.parse(value).getScheme())) throw invalid();
    }

    private static SaveAccessException invalid() {
        return new SaveAccessException("INVALID_SELECTION",
            "The saved connection is unsupported. Forget it and reconnect your save.");
    }
}
