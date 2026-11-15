package com.runbuncalc.app.storage;

import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.content.UriPermission;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;

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
    private final SaveFileReader reader = new SaveFileReader();

    public SaveDocumentRepository(Context context) {
        resolver = context.getContentResolver();
        selections = new SaveSelectionStore(context);
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
            metadata(folder ? rootDocument(uri.toString()) : uri);
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
        Uri candidate = Uri.parse(value);
        Uri root = rootDocument(selection.folderUri);
        if (!"content".equals(candidate.getScheme())
            || !Objects.equals(root.getAuthority(), candidate.getAuthority())
            || !DocumentsContract.isTreeUri(candidate)
            || !DocumentsContract.getTreeDocumentId(root).equals(DocumentsContract.getTreeDocumentId(candidate))
            || !DocumentsContract.isChildDocument(resolver, root, candidate)) {
            throw new SaveAccessException("INVALID_SELECTION", "Choose a file inside the connected folder.");
        }
        Document document = metadata(candidate);
        if (document.directory) throw new SaveAccessException("NOT_A_FILE", "Select a file, not a folder.");
        selections.save(selection.selectChild(candidate.toString()));
        return getState();
    }

    public JSObject readSelected() throws SaveAccessException, IOException {
        SaveSelection selection = selections.load();
        if (selection.fileUri == null) throw new SaveAccessException("NO_FILE", "Select a save file first.");
        if (!hasGrant(selection.grantUri())) {
            throw new SaveAccessException("PERMISSION_REQUIRED", "Save access was revoked. Reconnect the file or folder.");
        }
        Uri uri = Uri.parse(selection.fileUri);
        Document before = metadata(uri);
        if (before.directory) throw new SaveAccessException("NOT_A_FILE", "Select a file, not a folder.");
        SaveFileReader.Result read;
        try (InputStream stream = resolver.openInputStream(uri)) {
            if (stream == null) throw new IOException("The provider returned no file stream.");
            read = reader.read(stream, SaveFileReader.MAX_BYTES);
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
        return result;
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

    private void release(String value) {
        if (value == null || !hasGrant(value)) return;
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
