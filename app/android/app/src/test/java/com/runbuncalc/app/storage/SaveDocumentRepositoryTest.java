package com.runbuncalc.app.storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.provider.DocumentsContract;
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
        store.save(SaveSelection.folder("content://saves/tree/folder"));
        ShadowContentResolver.registerProviderInternal("saves", new FolderProvider());
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

    public static class FolderProvider extends ContentProvider {
        @Override
        public boolean onCreate() {
            return true;
        }

        @Override
        public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) {
            assertEquals("content://saves/tree/folder/document/folder/children", uri.toString());
            MatrixCursor cursor = new MatrixCursor(projection);
            cursor.addRow(new Object[] {"save", "save.sav", 3L, 1L, "application/octet-stream"});
            cursor.addRow(new Object[] {"subfolder", "folder", null, null, DocumentsContract.Document.MIME_TYPE_DIR});
            return cursor;
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
