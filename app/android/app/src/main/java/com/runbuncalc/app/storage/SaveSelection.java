package com.runbuncalc.app.storage;

import java.util.Objects;

public final class SaveSelection {
    public final String folderUri;
    public final String fileUri;

    private SaveSelection(String folderUri, String fileUri) {
        this.folderUri = folderUri;
        this.fileUri = fileUri;
    }

    public static SaveSelection empty() {
        return new SaveSelection(null, null);
    }

    public static SaveSelection folder(String uri) {
        return new SaveSelection(Objects.requireNonNull(uri), null);
    }

    public static SaveSelection file(String uri) {
        return new SaveSelection(null, Objects.requireNonNull(uri));
    }

    public SaveSelection selectChild(String uri) {
        if (folderUri == null) throw new IllegalStateException("Connect a folder before selecting its file.");
        return new SaveSelection(folderUri, Objects.requireNonNull(uri));
    }

    public String source() {
        return folderUri != null ? "folder" : fileUri != null ? "file" : "none";
    }

    public String grantUri() {
        return folderUri != null ? folderUri : fileUri;
    }
}
