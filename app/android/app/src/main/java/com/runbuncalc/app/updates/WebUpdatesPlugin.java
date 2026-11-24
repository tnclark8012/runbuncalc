package com.runbuncalc.app.updates;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.runbuncalc.app.MainActivity;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "WebUpdates")
public final class WebUpdatesPlugin extends Plugin {
    private static final ExecutorService WORKER = Executors.newSingleThreadExecutor();
    private final AtomicBoolean checking = new AtomicBoolean();
    private boolean automaticCheckStarted;
    private WebUpdateStore updates;

    @Override
    public void load() {
        updates = WebUpdateStore.getInstance(getContext());
    }

    @PluginMethod
    public void getState(PluginCall call) {
        JSObject state = updates.state();
        state.put("checking", checking.get());
        call.resolve(state);
    }

    @PluginMethod
    public void ready(PluginCall call) {
        try {
            updates.ready();
            ((MainActivity) getActivity()).webUpdateReady();
            call.resolve();
            if (!automaticCheckStarted) {
                automaticCheckStarted = true;
                check(null);
            }
        } catch (IOException error) {
            call.reject(error.getMessage(), "UPDATE_STATE_ERROR", error);
        }
    }

    @PluginMethod
    public void check(PluginCall call) {
        if (!checking.compareAndSet(false, true)) {
            if (call != null) call.reject("An update check is already running.", "BUSY");
            return;
        }
        try {
            WORKER.execute(() -> {
                try {
                    updates.check();
                    if (call != null) call.resolve(updates.state());
                } catch (IOException | SecurityException error) {
                    Log.w("WebUpdates", "Web update failed; keeping the working calculator.", error);
                    try {
                        updates.failure("Update check failed. Using the existing calculator. " + error.getMessage());
                    } catch (IOException stateError) {
                        Log.e("WebUpdates", "Cannot save update failure.", stateError);
                    }
                    if (call != null) call.reject(error.getMessage(), "UPDATE_FAILED", error);
                } finally {
                    checking.set(false);
                }
            });
        } catch (RejectedExecutionException error) {
            checking.set(false);
            if (call != null) call.reject("The updater has stopped. Reopen the app.", "APP_CLOSED", error);
            else Log.w("WebUpdates", "The updater has stopped.", error);
        }
    }
}
