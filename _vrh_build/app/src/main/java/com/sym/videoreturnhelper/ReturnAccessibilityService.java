package com.sym.videoreturnhelper;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.graphics.Rect;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayDeque;
import java.util.List;
import java.util.Locale;

public class ReturnAccessibilityService extends AccessibilityService {
    static final String PREF="return_helper";
    static final String KEY_PACKAGE="target_package";
    static final String KEY_AUTO="auto_return";

    private String target="";
    private boolean session=false;

    private boolean rewardArmed=false;
    private boolean rewardCueVisible=false;
    private long rewardSeenAt=0L;

    private boolean adSession=false;
    private long adStartedAt=0L;

    private long lastLaunch=0L;
    private long lastManualCloseAt=0L;
    private boolean returnScheduled=false;

    private final Handler handler = new Handler(Looper.getMainLooper());

    @Override public void onAccessibilityEvent(AccessibilityEvent event) {
        target = getSharedPreferences(PREF, MODE_PRIVATE).getString(KEY_PACKAGE, "");
        if (target.isEmpty() || event.getPackageName()==null) return;

        final String pkg = event.getPackageName().toString();
        if (pkg.equals(getPackageName())) return;

        final long now = SystemClock.elapsedRealtime();
        final boolean auto = getSharedPreferences(PREF, MODE_PRIVATE).getBoolean(KEY_AUTO, true);
        AccessibilityNodeInfo root = getRootInActiveWindow();

        if (pkg.equals(target)) {
            session = true;

            boolean rewardNow = root != null && hasRewardCue(root);

            if (rewardNow) {
                rewardArmed = true;
                rewardSeenAt = now;
            } else if (rewardCueVisible && rewardArmed && now - rewardSeenAt <= 30_000) {
                // 보상 화면이 사라졌지만 패키지가 그대로인 광고(WebView/내부 Activity)도
                // 광고 세션으로 인정합니다. 버튼은 자동 클릭하지 않습니다.
                adSession = true;
                adStartedAt = now;
                rewardArmed = false;
            }

            rewardCueVisible = rewardNow;
        } else if (session && rewardArmed && now - rewardSeenAt <= 30_000) {
            // 보상 선택 후 외부 광고 패키지로 이동한 경우.
            adSession = true;
            adStartedAt = now;
            rewardArmed = false;
            rewardCueVisible = false;
        }

        if (!session) return;

        if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_CLICKED) {
            // 사용자가 직접 2배 보상 버튼을 누른 경우에만 광고 세션을 시작합니다.
            if (isRewardClick(event)) {
                adSession = true;
                adStartedAt = now;
                rewardArmed = false;
                rewardCueVisible = false;
                return;
            }

            // 광고 X/닫기 버튼을 사용자가 직접 누른 것을 감지해 복귀합니다.
            // 여기서는 ACTION_CLICK을 호출하지 않습니다.
            if (adSession && isManualCloseClick(event)) {
                lastManualCloseAt = now;
                if (auto) scheduleReturnAfterManualClose();
                return;
            }
        }

        // 광고 세션은 최대 3분까지만 유지.
        if (adSession && now - adStartedAt > 180_000) {
            adSession = false;
            rewardArmed = false;
            rewardCueVisible = false;
        }

        // 사용자가 직접 광고를 닫은 뒤 홈/시스템 화면으로 빠지는 기존 경로도 유지.
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

    private boolean isRewardClick(AccessibilityEvent event) {
        List<CharSequence> texts = event.getText();
        if (texts != null) {
            for (CharSequence text : texts) {
                if (matchesReward(text)) return true;
            }
        }

        AccessibilityNodeInfo source = event.getSource();
        return source != null
                && (matchesReward(source.getText())
                || matchesReward(source.getContentDescription()));
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
                || s.equals("보상수령");
    }

    private boolean isManualCloseClick(AccessibilityEvent event) {
        List<CharSequence> texts = event.getText();
        if (texts != null) {
            for (CharSequence text : texts) {
                if (matchesClose(text)) return true;
            }
        }

        AccessibilityNodeInfo source = event.getSource();
        if (source == null) return false;

        if (matchesClose(source.getText()) || matchesClose(source.getContentDescription())) {
            return true;
        }

        // 일부 광고의 X는 텍스트/설명이 없는 이미지 버튼입니다.
        // 광고 세션 중 사용자가 화면 오른쪽 위/오른쪽 아래의 작은 버튼을
        // 직접 눌렀을 때만 닫기 동작으로 간주합니다.
        Rect bounds = new Rect();
        source.getBoundsInScreen(bounds);

        int screenW = getResources().getDisplayMetrics().widthPixels;
        int screenH = getResources().getDisplayMetrics().heightPixels;

        if (screenW <= 0 || screenH <= 0 || bounds.isEmpty()) return false;

        int cx = bounds.centerX();
        int cy = bounds.centerY();

        boolean rightSide = cx >= (int)(screenW * 0.72f);
        boolean topCloseZone = cy <= (int)(screenH * 0.22f);
        boolean bottomCloseZone = cy >= (int)(screenH * 0.76f);
        boolean smallControl =
                bounds.width() <= (int)(screenW * 0.35f)
                        && bounds.height() <= (int)(screenH * 0.25f);

        return rightSide && smallControl && (topCloseZone || bottomCloseZone);
    }

    private boolean matchesClose(CharSequence value) {
        if (value == null) return false;

        String s = value.toString().trim().toLowerCase(Locale.ROOT);
        if (s.length() > 60) return false;

        String compact = s.replace(" ", "").replace("\n", "");

        return compact.equals("x")
                || compact.equals("×")
                || compact.equals("✕")
                || compact.equals("✖")
                || compact.equals("닫기")
                || compact.equals("광고닫기")
                || compact.equals("광고종료")
                || compact.equals("종료")
                || compact.equals("close")
                || compact.equals("closead")
                || compact.equals("skip")
                || compact.equals("skipad")
                || compact.equals("건너뛰기")
                || compact.equals("완료");
    }

    private void scheduleReturnAfterManualClose() {
        if (returnScheduled) return;
        returnScheduled = true;

        handler.postDelayed(() -> {
            try {
                String currentPkg = getCurrentPackage();

                // 이미 대상 영상 앱으로 정상 복귀했다면 그대로 둡니다.
                if (!target.equals(currentPkg)) {
                    launchTargetTask();
                } else {
                    adSession = false;
                    rewardArmed = false;
                    rewardCueVisible = false;
                }
            } finally {
                returnScheduled = false;
            }
        }, 700);
    }

    private String getCurrentPackage() {
        try {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            if (root != null && root.getPackageName() != null) {
                return root.getPackageName().toString();
            }
        } catch (Exception ignored) { }
        return "";
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
                            | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                            | Intent.FLAG_ACTIVITY_SINGLE_TOP
            );

            lastLaunch = SystemClock.elapsedRealtime();
            startActivity(intent);

            adSession = false;
            rewardArmed = false;
            rewardCueVisible = false;
        } catch (Exception ignored) { }
    }
}
