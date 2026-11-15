package com.runbuncalc.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.runbuncalc.app.storage.SaveAccessPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SaveAccessPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
