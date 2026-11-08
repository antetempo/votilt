package com.antetempo.votilt.qa;

import com.android.uiautomator.core.Configurator;
import com.android.uiautomator.testrunner.UiAutomatorTestCase;
import android.os.Environment;
import java.io.File;

/** Read-only hierarchy capture for screens with continuous native animations. */
public class HierarchyDump extends UiAutomatorTestCase {
    public void testDump() throws Exception {
        Configurator.getInstance().setWaitForIdleTimeout(0);
        sleep(600);
        new File(Environment.getDataDirectory(), "local/tmp").mkdirs();
        getUiDevice().dumpWindowHierarchy("votilt-live.xml");
    }
}
