package com.runbuncalc.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.ServerPath;
import com.runbuncalc.app.storage.SaveAccessPlugin;
import com.runbuncalc.app.diagnostics.DiagnosticsPlugin;
import com.runbuncalc.app.updates.WebUpdateStore;
import com.runbuncalc.app.updates.WebUpdatesPlugin;

import java.io.File;
import java.io.IOException;

public class MainActivity extends BridgeActivity {
    private WebUpdateStore updates;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable startupTimeout = () -> {
        if (!updates.isTrial()) return;
        try {
            updates.rollback("The downloaded calculator did not start within 30 seconds. Restored the previous version.");
            File fallback = updates.activeDirectory();
            if (fallback == null) bridge.setServerAssetPath("public");
            else bridge.setServerBasePath(fallback.getAbsolutePath());
            Toast.makeText(this, "Web update failed. Restored the previous calculator.", Toast.LENGTH_LONG).show();
        } catch (IOException error) {
            Log.e("WebUpdates", "Cannot restore downloaded fallback.", error);
            bridge.setServerAssetPath("public");
            Toast.makeText(this, "Web update recovery failed. Using the bundled calculator.", Toast.LENGTH_LONG).show();
        }
    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SaveAccessPlugin.class);
        registerPlugin(DiagnosticsPlugin.class);
        registerPlugin(WebUpdatesPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    protected void load() {
        updates = WebUpdateStore.getInstance(this);
        try {
            long installed = getPackageManager().getPackageInfo(getPackageName(), 0).lastUpdateTime;
            File active = updates.prepareLaunch(BuildConfig.VERSION_CODE + ":" + installed);
            bridgeBuilder.setServerPath(active == null
                ? new ServerPath(ServerPath.PathType.ASSET_PATH, "public")
                : new ServerPath(ServerPath.PathType.BASE_PATH, active.getAbsolutePath()));
        } catch (IOException | android.content.pm.PackageManager.NameNotFoundException error) {
            Log.e("WebUpdates", "Cannot initialize web updates. Using APK assets.", error);
            bridgeBuilder.setServerPath(new ServerPath(ServerPath.PathType.ASSET_PATH, "public"));
            Toast.makeText(this, "Cannot load web update state. Using the bundled calculator.", Toast.LENGTH_LONG).show();
        }
        super.load();
    }

    public void webUpdateReady() {
        handler.removeCallbacks(startupTimeout);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (updates != null && updates.isTrial()) handler.postDelayed(startupTimeout, 30000);
    }

    @Override
    public void onPause() {
        handler.removeCallbacks(startupTimeout);
        super.onPause();
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacks(startupTimeout);
        super.onDestroy();
    }
}
