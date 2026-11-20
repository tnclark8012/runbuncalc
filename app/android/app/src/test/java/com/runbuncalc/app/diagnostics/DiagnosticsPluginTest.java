package com.runbuncalc.app.diagnostics;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import static org.robolectric.Shadows.shadowOf;

import android.app.Activity;
import android.content.Intent;
import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.pm.PackageInfo;
import android.content.pm.ProviderInfo;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.Bundle;
import android.os.Looper;
import android.os.Parcel;
import android.os.ParcelFileDescriptor;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.CapConfig;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import com.runbuncalc.app.MainActivity;
import java.io.File;
import java.io.FileNotFoundException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowContentResolver;
import org.robolectric.shadows.ShadowWebView;
import org.robolectric.util.ReflectionHelpers;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 37)
public class DiagnosticsPluginTest {
    private ActivityController<TestActivity> controller;
    private MainActivity activity;
    private DiagnosticsPlugin plugin;

    @Before
    public void setUp() {
        PackageInfo webView = new PackageInfo();
        webView.packageName = "com.google.android.webview";
        webView.versionName = "140.0";
        ShadowWebView.setCurrentWebViewPackage(webView);
        controller = Robolectric.buildActivity(TestActivity.class);
        controller.setup();
        activity = controller.get();
        plugin = (DiagnosticsPlugin) activity.getBridge().getPlugin("Diagnostics").getInstance();
    }

    @After
    public void tearDown() {
        controller.pause().stop().destroy();
    }

    @Test
    public void keepsLargeZipOutOfBothCapacitorSavedStateCopies() throws Exception {
        byte[] bytes = new byte[1024 * 1024];
        bytes[0] = 80;
        bytes[1] = 75;
        RecordingCall call = save(bytes);

        assertNull(call.errorCode);
        assertFalse(call.getData().has("dataBase64"));
        assertArrayEquals(bytes, ReflectionHelpers.getField(plugin, "pendingZip"));
        assertEquals(Intent.ACTION_CREATE_DOCUMENT, shadowOf(activity).getNextStartedActivity().getAction());

        Bundle state = new Bundle();
        activity.onSaveInstanceState(state);
        assertEquals("{\"name\":\"report.zip\"}", state.getString("capacitorLastPluginCallOptions"));
        assertEquals("{\"name\":\"report.zip\"}",
            state.getBundle("capacitorLastPluginCallBundle").getString("_json"));
        Parcel parcel = Parcel.obtain();
        try {
            parcel.writeBundle(state);
            assertTrue("Saved state must stay small regardless of ZIP size", parcel.dataSize() < 16384);
        } finally {
            parcel.recycle();
        }
    }

    @Test
    public void cancellationClearsBytesAndAllowsAnotherSave() throws Exception {
        RecordingCall cancelled = save(new byte[] {80, 75});
        destination(cancelled, new ActivityResult(Activity.RESULT_CANCELED, null));

        assertEquals("PICKER_CANCELLED", cancelled.errorCode);
        assertNull(ReflectionHelpers.getField(plugin, "pendingZip"));
        RecordingCall retry = save(new byte[] {1, 2, 3});
        assertNull(retry.errorCode);
        assertNotNull(ReflectionHelpers.getField(plugin, "pendingZip"));
    }

    @Test
    public void savesOriginalBytesAfterRemovingPayloadFromCallOptions() throws Exception {
        byte[] bytes = new byte[] {80, 75, 1, 2, 3};
        File file = File.createTempFile("diagnostics", ".zip", activity.getCacheDir());
        try {
            ReportProvider provider = new ReportProvider(file);
            ProviderInfo info = new ProviderInfo();
            info.authority = "reports";
            provider.attachInfo(activity, info);
            ShadowContentResolver.registerProviderInternal("reports", provider);
            RecordingCall call = save(bytes);
            destination(call, new ActivityResult(Activity.RESULT_OK,
                new Intent().setData(Uri.parse("content://reports/report.zip"))));

            assertNull(call.errorCode);
            assertEquals("report.zip", call.response.getString("name"));
            assertArrayEquals(bytes, Files.readAllBytes(file.toPath()));
            assertNull(ReflectionHelpers.getField(plugin, "pendingZip"));
            Bundle state = new Bundle();
            activity.onSaveInstanceState(state);
            assertFalse(state.getString("capacitorLastPluginCallOptions").contains("dataBase64"));
        } finally {
            Files.deleteIfExists(file.toPath());
        }
    }

    @Test
    public void restoredPickerReportsLostDataInsteadOfSavingAnEmptyZip() throws Exception {
        RecordingCall call = save(new byte[] {80, 75});
        ReflectionHelpers.setField(plugin, "pendingZip", null);
        destination(call, new ActivityResult(Activity.RESULT_OK,
            new Intent().setData(Uri.parse("content://reports/report.zip"))));

        assertEquals("DIAGNOSTIC_ERROR", call.errorCode);
        assertTrue(call.errorMessage.contains("Prepare the report again"));
    }

    private RecordingCall save(byte[] bytes) throws Exception {
        JSObject options = new JSObject();
        options.put("name", "report.zip");
        options.put("dataBase64", Base64.encodeToString(bytes, Base64.NO_WRAP));
        RecordingCall call = new RecordingCall(options);
        plugin.saveZip(call);
        drainWorker();
        shadowOf(Looper.getMainLooper()).idle();
        return call;
    }

    private void destination(RecordingCall call, ActivityResult result) throws Exception {
        Method callback = DiagnosticsPlugin.class.getDeclaredMethod("zipDestination", PluginCall.class, ActivityResult.class);
        callback.setAccessible(true);
        callback.invoke(plugin, call, result);
        drainWorker();
    }

    private void drainWorker() throws Exception {
        ExecutorService worker = ReflectionHelpers.getField(plugin, "worker");
        worker.submit(() -> {}).get(10, TimeUnit.SECONDS);
    }

    private static class RecordingCall extends PluginCall {
        private String errorCode;
        private String errorMessage;
        private JSObject response;

        RecordingCall(JSObject options) {
            super(null, "Diagnostics", "save", "saveZip", options);
        }

        @Override
        public void reject(String message, String code, Exception error, JSObject data) {
            errorCode = code;
            errorMessage = message;
        }

        @Override
        public void resolve(JSObject data) {
            response = data;
        }
    }

    public static class TestActivity extends MainActivity {
        @Override
        protected void load() {
            // Robolectric has no system WebView service-worker provider.
            config = new CapConfig.Builder(this).setResolveServiceWorkerRequests(false).create();
            super.load();
        }
    }

    private static class ReportProvider extends ContentProvider {
        private final File file;

        ReportProvider(File file) {
            this.file = file;
        }

        @Override
        public boolean onCreate() {
            return true;
        }

        @Override
        public Cursor query(Uri uri, String[] projection, String selection, String[] args, String order) {
            MatrixCursor cursor = new MatrixCursor(projection);
            cursor.addRow(new Object[] {"report.zip"});
            return cursor;
        }

        @Override
        public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.parseMode(mode));
        }

        @Override
        public String getType(Uri uri) {
            return "application/zip";
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
