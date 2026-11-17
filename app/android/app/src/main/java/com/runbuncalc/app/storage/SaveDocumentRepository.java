package com.runbuncalc.app.storage;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.util.Objects;

public final class SaveDocumentRepository {
    private static final String[] COLUMNS = {
        DocumentsContract.Document.COLUMN_DOCUMENT_ID,
        DocumentsContract.Document.COLUMN_DISPLAY_NAME,
        DocumentsContract.Document.COLUMN_SIZE,
        DocumentsContract.Document.COLUMN_LAST_MODIFIED,
        DocumentsContract.Document.COLUMN_MIME_TYPE
    };
    private final ContentResolver resolver;
    private final SaveSelectionStore selections;
    private final SaveSelectionStore otherSelections;
    private final SaveFileReader reader = new SaveFileReader();
    private final boolean rom;

    public SaveDocumentRepository(Context context) {
        this(context, false);
    }

    public SaveDocumentRepository(Context context, boolean rom) {
        this.rom = rom;
        resolver = context.getContentResolver();
        selections = new SaveSelectionStore(context, rom ? "rom-connection" : "save-connection");
        otherSelections = new SaveSelectionStore(context, rom ? "save-connection" : "rom-connection");
    }

    public JSObject getState() throws SaveAccessException, IOException {
        SaveSelection selection = selections.load();
        JSObject state = new JSObject();
        state.put("source", selection.source());
        state.put("folderUri", nullable(selection.folderUri));
        state.put("selectedUri", nullable(selection.fileUri));
        state.put("selectedFile", JSObject.NULL);
        if (selection.grantUri() == null) {
            state.put("access", "unconfigured");
            return state;
        }
        if (!hasGrant(selection.grantUri())) {
            state.put("access", "permission-required");
            return state;
        }
        try {
            if (selection.folderUri != null) metadata(rootDocument(selection.folderUri));
            if (selection.fileUri != null) state.put("selectedFile", metadata(Uri.parse(selection.fileUri)).json());
            state.put("access", "ready");
        } catch (SecurityException error) {
            state.put("access", "permission-required");
        } catch (FileNotFoundException error) {
            state.put("access", "missing");
        }
        return state;
    }

    public JSObject connect(Uri uri, boolean folder) throws SaveAccessException, IOException {
        if (!"content".equals(uri.getScheme())) {
            throw new SaveAccessException("INVALID_URI", "Choose a document using Android's system picker.");
        }
        SaveSelection previous = selections.load();
        SaveSelection next = folder ? SaveSelection.folder(uri.toString()) : SaveSelection.file(uri.toString());
        boolean alreadyGranted = hasGrant(uri.toString());
        resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try {
            Document selected = metadata(folder ? rootDocument(uri.toString()) : uri);
            if (!folder) validateFile(selected);
            selections.save(next);
        } catch (IOException | SaveAccessException | SecurityException error) {
            if (!alreadyGranted) release(uri.toString());
            throw error;
        }
        if (!Objects.equals(previous.grantUri(), next.grantUri())) release(previous.grantUri());
        return getState();
    }

    public JSObject listFiles() throws SaveAccessException, IOException {
        SaveSelection selection = selections.load();
        if (selection.folderUri == null) {
            throw new SaveAccessException("NO_FOLDER", "Connect a save folder first.");
        }
        Uri tree = Uri.parse(selection.folderUri);
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree,
            DocumentsContract.getTreeDocumentId(tree));
        JSArray files = new JSArray();
        boolean truncated = false;
        try (Cursor cursor = query(children)) {
            while (cursor.moveToNext()) {
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(4))) continue;
                if (!allowsName(cursor.getString(1))) continue;
                if (files.length() == 200) {
                    truncated = true;
                    break;
                }
                Uri document = DocumentsContract.buildDocumentUriUsingTree(tree, cursor.getString(0));
                files.put(document(cursor, document).json());
            }
        }
        JSObject result = new JSObject();
        result.put("files", files);
        result.put("truncated", truncated);
        return result;
    }

    public JSObject selectFile(String value) throws SaveAccessException, IOException {
        SaveSelection selection = selections.load();
        if (selection.folderUri == null) throw new SaveAccessException("NO_FOLDER", "Connect a save folder first.");
        Uri tree = Uri.parse(selection.folderUri);
        Uri children = DocumentsContract.buildChildDocumentsUriUsingTree(tree,
            DocumentsContract.getTreeDocumentId(tree));
        try (Cursor cursor = query(children)) {
            while (cursor.moveToNext()) {
                if (DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(4))) continue;
                Uri document = DocumentsContract.buildDocumentUriUsingTree(tree, cursor.getString(0));
                if (document.toString().equals(value)) {
                    validateFile(document(cursor, document));
                    selections.save(selection.selectChild(document.toString()));
                    return getState();
                }
            }
        }
        throw new SaveAccessException("INVALID_SELECTION", "Choose a file from the connected folder. Refresh its listing if it changed.");
    }

    public JSObject readSelected() throws SaveAccessException, IOException {
        return readSelected(false);
    }

    public JSObject readSelected(boolean includeData) throws SaveAccessException, IOException {
        SaveSelection selection = selections.load();
        if (selection.fileUri == null) throw new SaveAccessException("NO_FILE", "Select a save file first.");
        if (!hasGrant(selection.grantUri())) {
            throw new SaveAccessException("PERMISSION_REQUIRED", "Save access was revoked. Reconnect the file or folder.");
        }
        Uri uri = Uri.parse(selection.fileUri);
        Document before = metadata(uri);
        validateFile(before);
        SaveFileReader.Result read;
        try (InputStream stream = resolver.openInputStream(uri)) {
            if (stream == null) throw new IOException("The provider returned no file stream.");
            read = reader.read(stream, SaveFileReader.MAX_BYTES, includeData);
        }
        Document after = metadata(uri);
        if (!Objects.equals(before.size, after.size) || !Objects.equals(before.modifiedAt, after.modifiedAt)
            || (after.size != null && after.size != read.bytes)) {
            throw new SaveAccessException("FILE_CHANGED", "The save changed during the read. Wait for the emulator to finish saving, then retry.");
        }
        JSObject result = new JSObject();
        result.put("document", after.json());
        result.put("bytes", read.bytes);
        result.put("sha256", read.sha256);
        result.put("readAt", Instant.now().toString());
        if (includeData) result.put("dataBase64", Base64.encodeToString(read.data, Base64.NO_WRAP));
        return result;
    }

    private boolean allowsName(String name) {
        return name != null && (rom ? name.matches("(?i).+\\.gba") : name.matches("(?i).+\\.jg[0-9]+"));
    }

    private void validateFile(Document document) throws SaveAccessException {
        if (document.directory || !allowsName(document.name)) {
            throw new SaveAccessException("INVALID_SELECTION",
                rom ? "Select a Run & Bun ROM (.gba)." : "Select a John GBA snapshot (.jgN), not a .sav or .jsN preview.");
        }
    }

    public JSObject forget() throws SaveAccessException, IOException {
        // This preference file belongs exclusively to this plugin; also permits recovery from invalid data.
        SaveSelection old;
        try {
            old = selections.load();
        } catch (SaveAccessException error) {
            if (!"INVALID_SELECTION".equals(error.code)) throw error;
            old = null;
        }
        selections.clear();
        if (old != null) release(old.grantUri());
        return getState();
    }

    private boolean hasGrant(String value) {
        for (UriPermission grant : resolver.getPersistedUriPermissions()) {
            if (grant.isReadPermission() && grant.getUri().toString().equals(value)) return true;
        }
        return false;
    }

    private void release(String value) throws SaveAccessException {
        if (value == null || !hasGrant(value)) return;
        // A folder grant can be shared by the independent ROM and snapshot connections.
        if (Objects.equals(otherSelections.load().grantUri(), value)) return;
        resolver.releasePersistableUriPermission(Uri.parse(value), Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }

    private static Uri rootDocument(String value) {
        Uri tree = Uri.parse(value);
        return DocumentsContract.buildDocumentUriUsingTree(tree, DocumentsContract.getTreeDocumentId(tree));
    }

    private Cursor query(Uri uri) throws IOException {
        Cursor cursor = resolver.query(uri, COLUMNS, null, null, null);
        if (cursor == null) throw new IOException("The document provider returned no response. Try reconnecting.");
        return cursor;
    }

    private Document metadata(Uri uri) throws IOException {
        try (Cursor cursor = query(uri)) {
            if (!cursor.moveToFirst()) throw new FileNotFoundException("The selected document no longer exists.");
            return document(cursor, uri);
        }
    }

    private static Document document(Cursor cursor, Uri uri) throws IOException {
        if (cursor.isNull(1)) throw new IOException("The document provider returned no filename.");
        return new Document(uri.toString(), cursor.getString(1),
            cursor.isNull(2) ? null : cursor.getLong(2),
            cursor.isNull(3) ? null : cursor.getLong(3),
            DocumentsContract.Document.MIME_TYPE_DIR.equals(cursor.getString(4)));
    }

    private static Object nullable(Object value) {
        return value == null ? JSObject.NULL : value;
    }

    private static final class Document {
        final String uri;
        final String name;
        final Long size;
        final Long modifiedAt;
        final boolean directory;

        Document(String uri, String name, Long size, Long modifiedAt, boolean directory) {
            this.uri = uri;
            this.name = name;
            this.size = size;
            this.modifiedAt = modifiedAt;
            this.directory = directory;
        }

        JSObject json() {
            JSObject result = new JSObject();
            result.put("uri", uri);
            result.put("name", name);
            result.put("size", nullable(size));
            result.put("modifiedAt", nullable(modifiedAt));
            return result;
        }
    }
}
