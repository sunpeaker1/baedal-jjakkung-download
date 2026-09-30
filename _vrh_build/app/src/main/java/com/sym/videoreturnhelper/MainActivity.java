package com.sym.videoreturnhelper;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ResolveInfo;
import android.os.Bundle;
import android.provider.Settings;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.ViewGroup;
import android.widget.*;
import java.util.*;

public class MainActivity extends Activity {
    static final String PREF="return_helper";
    static final String KEY_PACKAGE="target_package";
    static final String KEY_LABEL="target_label";
    static final String KEY_AUTO="auto_return";

    private final ArrayList<AppEntry> apps = new ArrayList<>();
    private Spinner spinner;
    private TextView selected;
    private Switch autoSwitch;

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(22), dp(28), dp(22), dp(22));
        root.setBackgroundColor(Color.rgb(247,249,252));

        root.addView(text("영상복귀 도우미", 28, true, 0xFF101828));

        TextView version = text("V0.3 · 조용한 자동복귀", 13, true, 0xFF1677FF);
        version.setPadding(0, dp(4), 0, dp(8));
        root.addView(version);

        TextView desc = text(
                "보상 화면은 조용히 감지하고, 보상 선택과 광고 종료는 직접 합니다. 광고 종료 뒤 홈으로 빠지면 기존 영상 화면으로 자동 복귀합니다.",
                15, false, 0xFF667085);
        desc.setPadding(0, 0, 0, dp(18));
        root.addView(desc);

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setPadding(dp(18), dp(18), dp(18), dp(18));

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.WHITE);
        bg.setCornerRadius(dp(20));
        card.setBackground(bg);

        card.addView(text("1. 돌아갈 영상 앱 선택", 18, true, 0xFF101828));

        spinner = new Spinner(this);
        LinearLayout.LayoutParams spinnerParams =
                new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(58));
        spinnerParams.topMargin = dp(10);
        card.addView(spinner, spinnerParams);

        selected = text("선택된 앱: 없음", 14, false, 0xFF475467);
        selected.setPadding(0, dp(8), 0, dp(12));
        card.addView(selected);

        Button save = button("대상 영상 앱 저장");
        card.addView(save);

        TextView serviceTitle = text("2. 접근성 서비스 켜기", 18, true, 0xFF101828);
        serviceTitle.setPadding(0, dp(20), 0, dp(8));
        card.addView(serviceTitle);

        Button settings = button("접근성 설정 열기");
        card.addView(settings);

        autoSwitch = new Switch(this);
        autoSwitch.setText("직접 광고 종료 후 영상 화면 자동 복귀");
        autoSwitch.setTextSize(16);
        autoSwitch.setPadding(0, dp(16), 0, dp(10));
        card.addView(autoSwitch);

        Button test = button("대상 앱 복귀 테스트");
        card.addView(test);

        root.addView(card,
                new LinearLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.WRAP_CONTENT));

        TextView cycle = text(
                "동작: 영상 → 보상 화면 조용히 감지 → 2배 보상 직접 누름 → 광고 직접 닫기 → 영상 화면 자동 복귀 → 다음 영상 대기",
                14, false, 0xFF344054);
        cycle.setPadding(0, dp(18), 0, 0);
        root.addView(cycle);

        TextView note = text(
                "※ 진동·음성 알림 없음. 보상 버튼과 광고 닫기 버튼은 자동 클릭하지 않습니다.",
                13, false, 0xFFB42318);
        note.setPadding(0, dp(12), 0, 0);
        root.addView(note);

        setContentView(root);

        loadApps();
        loadPrefs();

        save.setOnClickListener(v -> saveSelection());
        settings.setOnClickListener(v ->
                startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
        autoSwitch.setOnCheckedChangeListener((buttonView, checked) ->
                getSharedPreferences(PREF, MODE_PRIVATE)
                        .edit()
                        .putBoolean(KEY_AUTO, checked)
                        .apply());
        test.setOnClickListener(v -> launchTarget());
    }

    private void loadApps() {
        Intent i = new Intent(Intent.ACTION_MAIN);
        i.addCategory(Intent.CATEGORY_LAUNCHER);

        List<ResolveInfo> list = getPackageManager().queryIntentActivities(i, 0);
        Set<String> seen = new HashSet<>();

        for (ResolveInfo r : list) {
            String pkg = r.activityInfo.packageName;
            if (pkg.equals(getPackageName()) || !seen.add(pkg)) continue;

            apps.add(new AppEntry(
                    r.loadLabel(getPackageManager()).toString(),
                    pkg));
        }

        apps.sort(Comparator.comparing(
                a -> a.label,
                String.CASE_INSENSITIVE_ORDER));

        ArrayList<String> names = new ArrayList<>();
        for (AppEntry a : apps) names.add(a.label);

        spinner.setAdapter(new ArrayAdapter<>(
                this,
                android.R.layout.simple_spinner_dropdown_item,
                names));
    }

    private void loadPrefs() {
        SharedPreferences p = getSharedPreferences(PREF, MODE_PRIVATE);

        String pkg = p.getString(KEY_PACKAGE, "");
        String label = p.getString(KEY_LABEL, "");

        autoSwitch.setChecked(p.getBoolean(KEY_AUTO, true));

        if (!pkg.isEmpty()) {
            selected.setText("선택된 앱: " + label);

            for (int n=0;n<apps.size();n++) {
                if (apps.get(n).pkg.equals(pkg)) {
                    spinner.setSelection(n);
                    break;
                }
            }
        }
    }

    private void saveSelection() {
        if (apps.isEmpty()) return;

        AppEntry a = apps.get(spinner.getSelectedItemPosition());

        getSharedPreferences(PREF, MODE_PRIVATE)
                .edit()
                .putString(KEY_PACKAGE, a.pkg)
                .putString(KEY_LABEL, a.label)
                .apply();

        selected.setText("선택된 앱: " + a.label);
        Toast.makeText(this, "저장 완료", Toast.LENGTH_SHORT).show();
    }

    private void launchTarget() {
        String pkg = getSharedPreferences(PREF, MODE_PRIVATE)
                .getString(KEY_PACKAGE, "");

        Intent i = getPackageManager().getLaunchIntentForPackage(pkg);

        if (i != null) {
            i.addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED
                            | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(i);
        } else {
            Toast.makeText(
                    this,
                    "먼저 대상 앱을 선택하세요.",
                    Toast.LENGTH_SHORT).show();
        }
    }

    private TextView text(String s, int sp, boolean bold, int color) {
        TextView v = new TextView(this);
        v.setText(s);
        v.setTextSize(sp);
        v.setTextColor(color);

        if (bold) {
            v.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        }
        return v;
    }

    private Button button(String s) {
        Button b = new Button(this);
        b.setText(s);
        b.setAllCaps(false);
        b.setTextSize(16);
        return b;
    }

    private int dp(int x) {
        return Math.round(
                x * getResources().getDisplayMetrics().density);
    }

    static class AppEntry {
        final String label;
        final String pkg;

        AppEntry(String label, String pkg) {
            this.label = label;
            this.pkg = pkg;
        }
    }
}
