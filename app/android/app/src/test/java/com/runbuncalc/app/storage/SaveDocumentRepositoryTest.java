package com.runbuncalc.app.storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertFalse;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ProviderInfo;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowContentResolver;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 37)
public class SaveDocumentRepositoryTest {
    private SaveSelectionStore store;
    private SaveDocumentRepository repository;

    @Before
    public void setUp() throws Exception {
        Context context = RuntimeEnvironment.getApplication();
        store = new SaveSelectionStore(context);
        store.clear();
        new SaveSelectionStore(context, "rom-connection").clear();
        store.save(SaveSelection.folder("content://saves/tree/folder"));
        registerProvider(false);
        repository = new SaveDocumentRepository(context);
    }

    @Test
    public void selectsOnlyAFileReturnedByTheConnectedFoldersProvider() throws Exception {
        String file = "content://saves/tree/folder/document/save";
        repository.selectFile(file);
        assertEquals(file, store.load().fileUri);
    }

    @Test
    public void rejectsArbitraryUrisAndDirectoriesWithoutChangingTheConnection() throws Exception {
        assertEquals("INVALID_SELECTION", assertThrows(SaveAccessException.class,
            () -> repository.selectFile("content://other/document/private")).code);
        assertEquals("INVALID_SELECTION", assertThrows(SaveAccessException.class,
            () -> repository.selectFile("content://saves/tree/folder/document/subfolder")).code);
        assertNull(store.load().fileUri);
    }

    @Test
    public void listsOnlySlotZeroPairsForEachGameAndKeepsRomListingUnchanged() throws Exception {
        org.json.JSONArray snapshots = repository.listFiles().getJSONArray("files");
        assertEquals(2, snapshots.length());
        assertEquals("save.jg0", snapshots.getJSONObject(0).getString("name"));
        assertEquals("content://saves/tree/folder/document/save", snapshots.getJSONObject(0).getString("uri"));
        assertEquals("content://saves/tree/folder/document/preview",
            snapshots.getJSONObject(0).getJSONObject("preview").getString("uri"));
        assertEquals("other.JG0", snapshots.getJSONObject(1).getString("name"));
        assertEquals("OTHER.Js0", snapshots.getJSONObject(1).getJSONObject("preview").getString("name"));
        new SaveSelectionStore(RuntimeEnvironment.getApplication(), "rom-connection")
            .save(SaveSelection.folder("content://saves/tree/folder"));
        org.json.JSONArray roms = new SaveDocumentRepository(RuntimeEnvironment.getApplication(), true)
            .listFiles().getJSONArray("files");
        assertEquals(1, roms.length());
        assertEquals("game.GBA", roms.getJSONObject(0).getString("name"));
        assertFalse(roms.getJSONObject(0).has("preview"));
    }

    @Test
    public void selectingAPairPersistsAndReadsTheSnapshotRatherThanItsPreview() throws Exception {
        repository.connect(Uri.parse("content://saves/tree/folder"), true);
        String uri = repository.listFiles().getJSONArray("files").getJSONObject(0).getString("uri");
        repository.selectFile(uri);
        SaveDocumentRepository reopened = new SaveDocumentRepository(RuntimeEnvironment.getApplication());
        assertEquals(uri, reopened.getState().getString("selectedUri"));
        assertEquals("save.jg0", reopened.readSelected(true).getJSONObject("document").getString("name"));
        assertEquals("YWJj", reopened.readSelected(true).getString("dataBase64"));
    }

    @Test
    public void rejectsHiddenFilesWithoutReplacingTheSelectedSnapshot() throws Exception {
        repository.selectFile("content://saves/tree/folder/document/save");
        for (String id : new String[] {"preview", "other-preview", "battery", "rom", "invalid", "wrong-slot", "slot-nine", "double-zero"}) {
            assertEquals("INVALID_SELECTION", assertThrows(SaveAccessException.class,
                () -> repository.selectFile("content://saves/tree/folder/document/" + id)).code);
        }
        assertEquals("content://saves/tree/folder/document/save", store.load().fileUri);
    }

    @Test
    public void rejectsUnsupportedSingleFileBeforeReplacingTheConnection() throws Exception {
        assertEquals("INVALID_SELECTION", assertThrows(SaveAccessException.class,
            () -> repository.connect(Uri.parse("content://saves/document/preview"), false)).code);
        assertEquals("folder", store.load().source());
        assertNull(store.load().fileUri);
    }

    @Test
    public void forgettingOneConnectionDoesNotRevokeAFolderGrantStillUsedByTheOther() throws Exception {
        Context context = RuntimeEnvironment.getApplication();
        String tree = "content://saves/tree/folder";
        context.getContentResolver().takePersistableUriPermission(Uri.parse(tree), Intent.FLAG_GRANT_READ_URI_PERMISSION);
        new SaveSelectionStore(context, "rom-connection").save(SaveSelection.folder(tree));
        repository.forget();
        assertEquals(1, context.getContentResolver().getPersistedUriPermissions().size());
        new SaveDocumentRepository(context, true).forget();
        assertTrue(context.getContentResolver().getPersistedUriPermissions().isEmpty());
    }

    @Test
    public void returnsSelectedFileDataForDecodingButKeepsDiagnosticReadsMetadataOnly() throws Exception {
        connectFile();
        assertEquals("YWJj", repository.readSelected(true).getString("dataBase64"));
        assertEquals(3L, repository.readSelected(true).getLong("bytes"));
        assertFalse(repository.readSelected().has("dataBase64"));
    }

    @Test
    public void rejectsChangedFilesBeforeReturningDataToTheDecoder() throws Exception {
        connectFile();
        registerProvider(true);
        assertEquals("FILE_CHANGED", assertThrows(SaveAccessException.class,
            () -> repository.readSelected(true)).code);
    }

    private void connectFile() throws Exception {
        String uri = "content://saves/document/save";
        store.save(SaveSelection.file(uri));
        RuntimeEnvironment.getApplication().getContentResolver()
            .takePersistableUriPermission(Uri.parse(uri), Intent.FLAG_GRANT_READ_URI_PERMISSION);
    }

    private void registerProvider(boolean changes) {
        FolderProvider provider = new FolderProvider(changes);
        ProviderInfo info = new ProviderInfo();
        info.authority = "saves";
        provider.attachInfo(RuntimeEnvironment.getApplication(), info);
        ShadowContentResolver.registerProviderInternal("saves", provider);
    }

    public static class FolderProvider extends ContentProvider {
        private final boolean changes;
        private int metadataReads;

        public FolderProvider() {
            this(false);
        }

        public FolderProvider(boolean changes) {
            this.changes = changes;
        }

        @Override
        public boolean onCreate() {
            return true;
        }

        @Override
        public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) {
            MatrixCursor cursor = new MatrixCursor(projection);
            if (uri.toString().equals("content://saves/tree/folder/document/folder")) {
                cursor.addRow(new Object[] {"folder", "folder", null, null, DocumentsContract.Document.MIME_TYPE_DIR});
                return cursor;
            }
            if (uri.toString().equals("content://saves/document/preview")) {
                cursor.addRow(new Object[] {"preview", "save.js0", 3L, 1L, "application/octet-stream"});
                return cursor;
            }
            if (uri.toString().equals("content://saves/document/save")
                || uri.toString().equals("content://saves/tree/folder/document/save")) {
                cursor.addRow(new Object[] {"save", "save.jg0", changes && metadataReads++ > 0 ? 4L : 3L, 1L, "application/octet-stream"});
                return cursor;
            }
            assertEquals("content://saves/tree/folder/document/folder/children", uri.toString());
            cursor.addRow(new Object[] {"preview", "save.js0", 3L, 1L, "image/jpeg"});
            cursor.addRow(new Object[] {"battery", "save.sav", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"invalid", "save.jg0.bak", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"save", "save.jg0", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"other", "other.JG0", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"other-preview", "OTHER.Js0", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"wrong-slot", "save.jg1", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"slot-one-preview", "save.js1", 3L, 1L, "image/jpeg"});
            cursor.addRow(new Object[] {"slot-nine", "other.JG9", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"slot-nine-preview", "other.JS9", 3L, 1L, "image/jpeg"});
            cursor.addRow(new Object[] {"double-zero", "save.jg00", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"double-zero-preview", "save.js00", 3L, 1L, "image/jpeg"});
            cursor.addRow(new Object[] {"orphan", "orphan.js0", 3L, 1L, "image/jpeg"});
            cursor.addRow(new Object[] {"wrong-slot-preview", "save.js2", 3L, 1L, "image/jpeg"});
            cursor.addRow(new Object[] {"directory-preview-save", "directory.jg0", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"directory-preview", "directory.js0", null, null, DocumentsContract.Document.MIME_TYPE_DIR});
            cursor.addRow(new Object[] {"rom", "game.GBA", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"subfolder", "folder", null, null, DocumentsContract.Document.MIME_TYPE_DIR});
            return cursor;
        }

        @Override
        public ParcelFileDescriptor openFile(Uri uri, String mode) throws java.io.FileNotFoundException {
            try {
                File file = File.createTempFile("save-access", ".bin", RuntimeEnvironment.getApplication().getCacheDir());
                try (FileOutputStream stream = new FileOutputStream(file)) {
                    stream.write(new byte[] {97, 98, 99});
                }
                return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
            } catch (IOException error) {
                throw new java.io.FileNotFoundException(error.getMessage());
            }
        }

        @Override
        public String getType(Uri uri) {
            return "application/octet-stream";
        }

        @Override
        public Uri insert(Uri uri, ContentValues values) {
            throw new UnsupportedOperationException();
        }

        @Override
        public int delete(Uri uri, String selection, String[] args) {
            throw new UnsupportedOperationException();
        }

        @Override
        public int update(Uri uri, ContentValues values, String selection, String[] args) {
            throw new UnsupportedOperationException();
        }
    }
}
