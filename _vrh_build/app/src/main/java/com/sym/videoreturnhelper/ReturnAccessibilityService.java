package com.sym.videoreturnhelper;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import java.util.ArrayDeque;
import java.util.Locale;

public class ReturnAccessibilityService extends AccessibilityService {
    static final String PREF="return_helper";
    static final String KEY_PACKAGE="target_package";
    static final String KEY_AUTO="auto_return";

    private String target="";
    private boolean session=false;

    private boolean rewardArmed=false;
    private long rewardSeenAt=0L;

    private boolean adSession=false;
    private long adStartedAt=0L;

    private long lastLaunch=0L;

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        target = getSharedPreferences(PREF, MODE_PRIVATE).getString(KEY_PACKAGE, "");
        if (target.isEmpty() || event.getPackageName()==null) return;

        final String pkg = event.getPackageName().toString();
        if (pkg.equals(getPackageName())) return;

        final long now = SystemClock.elapsedRealtime();
        AccessibilityNodeInfo root = getRootInActiveWindow();

        if (pkg.equals(target)) {
            session = true;

            if (root != null && hasRewardCue(root)) {
                rewardArmed = true;
                rewardSeenAt = now;
            }

            if (adSession) {
                adSession = false;
                rewardArmed = false;
            }
            return;
        }

        if (!session) return;

        if (rewardArmed && now - rewardSeenAt <= 30_000) {
            adSession = true;
            adStartedAt = now;
            rewardArmed = false;
        }

        if (adSession && now - adStartedAt > 180_000) {
            adSession = false;
        }

        boolean auto = getSharedPreferences(PREF, MODE_PRIVATE).getBoolean(KEY_AUTO, true);

        if (auto
                && adSession
                && isSystemOrLauncher(pkg)
                && now - lastLaunch > 2_000) {
            launchTargetTask();
        }
    }

    @Override public void onInterrupt() { }

    private boolean hasRewardCue(AccessibilityNodeInfo root) {
        ArrayDeque<AccessibilityNodeInfo> q = new ArrayDeque<>();
        q.add(root);
        int scanned=0;

        while (!q.isEmpty() && scanned++ < 350) {
            AccessibilityNodeInfo n = q.removeFirst();

            if (matchesReward(n.getText()) || matchesReward(n.getContentDescription())) {
                return true;
            }

            for (int i=0;i<n.getChildCount();i++) {
                AccessibilityNodeInfo child = n.getChild(i);
                if (child != null) q.add(child);
            }
        }
        return false;
    }

    private boolean matchesReward(CharSequence value) {
        if (value == null) return false;

        String s = value.toString()
                .replace(" ", "")
                .replace("\n", "")
                .toLowerCase(Locale.ROOT);

        if (s.length() > 80) return false;

        return s.contains("2배보상수령")
                || s.contains("2배보상")
                || s.contains("보상수령");
    }

    private boolean isSystemOrLauncher(String pkg) {
        return pkg.equals("com.sec.android.app.launcher")
                || pkg.equals("com.android.systemui")
                || pkg.equals("com.google.android.apps.nexuslauncher")
                || pkg.equals("com.android.settings");
    }

    private void launchTargetTask() {
        try {
            Intent intent = getPackageManager().getLaunchIntentForPackage(target);
            if (intent == null) return;

            intent.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                            | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            );

            lastLaunch = SystemClock.elapsedRealtime();
            startActivity(intent);

            adSession = false;
            rewardArmed = false;
        } catch (Exception ignored) { }
    }
}
