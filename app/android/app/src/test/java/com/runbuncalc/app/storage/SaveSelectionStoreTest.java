package com.runbuncalc.app.storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;

import android.content.Context;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 35)
public class SaveSelectionStoreTest {
    private Context context;
    private SaveSelectionStore store;

    @Before
    public void setUp() {
        context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("save-connection", Context.MODE_PRIVATE).edit().clear().commit();
        store = new SaveSelectionStore(context);
    }

    @Test
    public void restoresFolderAndSelectedDocumentAfterRecreatingTheStore() throws Exception {
        store.save(SaveSelection.folder("content://saves/tree/folder")
            .selectChild("content://saves/tree/folder/document/save"));
        SaveSelection restored = new SaveSelectionStore(context).load();
        assertEquals("content://saves/tree/folder", restored.folderUri);
        assertEquals("content://saves/tree/folder/document/save", restored.fileUri);
    }

    @Test
    public void replacingFolderClearsItsPreviouslySelectedFile() throws Exception {
        store.save(SaveSelection.folder("content://saves/tree/old")
            .selectChild("content://saves/tree/old/document/save"));
        store.save(SaveSelection.folder("content://saves/tree/new"));
        assertNull(store.load().fileUri);
        assertEquals("content://saves/tree/new", store.load().grantUri());
    }

    @Test
    public void rejectsUnknownSchemaButAllowsExplicitRecovery() throws Exception {
        context.getSharedPreferences("save-connection", Context.MODE_PRIVATE).edit()
            .putInt("version", 99).commit();
        SaveAccessException error = assertThrows(SaveAccessException.class, store::load);
        assertEquals("INVALID_SELECTION", error.code);
        store.clear();
        assertEquals("none", store.load().source());
    }

    @Test
    public void rejectsRawFilesystemPathsInsteadOfRestoringThemAsDocumentGrants() {
        context.getSharedPreferences("save-connection", Context.MODE_PRIVATE).edit()
            .putInt("version", 1).putString("fileUri", "/storage/emulated/0/save.sav").commit();
        assertEquals("INVALID_SELECTION", assertThrows(SaveAccessException.class, store::load).code);
    }
}
