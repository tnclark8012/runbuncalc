package com.runbuncalc.app.updates;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.SharedPreferences;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

import java.io.File;
import java.nio.file.Files;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 37)
public class WebUpdateStoreTest {
    private Context context;
    private SharedPreferences preferences;
    private UpdateFixture fixture;
    private WebUpdateStore store;

    @Before
    public void setUp() throws Exception {
        context = RuntimeEnvironment.getApplication();
        preferences = context.getSharedPreferences("web-updates", Context.MODE_PRIVATE);
        preferences.edit().clear().commit();
        fixture = new UpdateFixture();
        store = new WebUpdateStore(context, 2, fixture.publicKey);
        assertNull(store.prepareLaunch("apk-1"));
    }

    private File stage(int run) throws Exception {
        File directory = new File(context.getNoBackupFilesDir(), "web-updates/web-" + run + "-1");
        assertTrue(directory.mkdirs());
        Files.write(new File(directory, "index.html").toPath(), new byte[] {1});
        Files.write(new File(directory, "update.json").toPath(), fixture.sign(fixture.payload(run)));
        preferences.edit().putString("pending", directory.getName()).commit();
        return directory;
    }

    @Test
    public void activatesOnlyAtNextLaunchAndPersistsSuccessfulReadinessOffline() throws Exception {
        File pending = stage(123);
        assertNull(store.activeDirectory());
        assertEquals(pending, store.prepareLaunch("apk-1"));
        assertTrue(store.isTrial());
        store.ready();
        assertFalse(store.isTrial());
        WebUpdateStore reopened = new WebUpdateStore(context, 2, fixture.publicKey);
        assertEquals(pending, reopened.prepareLaunch("apk-1"));
        assertFalse(reopened.isTrial());
    }

    @Test
    public void interruptedFirstLaunchFallsBackToBundledAndQuarantinesFailedRelease() throws Exception {
        stage(123);
        store.prepareLaunch("apk-1");
        WebUpdateStore reopened = new WebUpdateStore(context, 2, fixture.publicKey);
        assertNull(reopened.prepareLaunch("apk-1"));
        assertEquals("web-123-1", preferences.getString("failed", ""));
        assertTrue(reopened.state().getBoolean("error"));
    }

    @Test
    public void failedSecondUpdateRestoresLastWorkingDownloadWithoutNetwork() throws Exception {
        File working = stage(123);
        store.prepareLaunch("apk-1");
        store.ready();
        stage(124);
        store.prepareLaunch("apk-1");
        store.rollback("Startup timeout.");
        assertEquals(working, store.activeDirectory());
        assertFalse(store.isTrial());
        assertEquals("web-124-1", preferences.getString("failed", ""));
        assertEquals(working, new WebUpdateStore(context, 2, fixture.publicKey).prepareLaunch("apk-1"));
    }

    @Test
    public void newApkAndMissingOrTamperedDownloadsUseBundledAssets() throws Exception {
        File pending = stage(123);
        Files.write(new File(pending, "update.json").toPath(), new byte[] {1});
        assertNull(store.prepareLaunch("apk-1"));
        assertTrue(store.state().getBoolean("error"));
        File next = stage(124);
        store.prepareLaunch("apk-1");
        store.ready();
        assertNull(store.prepareLaunch("apk-2"));
        assertFalse(next.exists());
        assertEquals("bundled", store.state().getString("active"));
    }
}
