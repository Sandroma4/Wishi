package app.cadeoly.mobile;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.MotionEvent;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

/** Online Android client. Account data stays on the existing Cadéoly server. */
public class MainActivity extends Activity {
    private static final String HOST = "wishi-production.up.railway.app";
    private static final String HOME = "https://" + HOST + "/";
    private static final int PHOTO = 41;
    private WebView browser;
    private ValueCallback<Uri[]> photoCallback;
    private String retryUrl = HOME;
    private boolean offline = false;

    private boolean trusted(Uri uri) {
        return "https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
            && (uri.getPort() == -1 || uri.getPort() == 443);
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(Color.rgb(33, 27, 53));
        layout.setFitsSystemWindows(android.os.Build.VERSION.SDK_INT < 30);
        if (android.os.Build.VERSION.SDK_INT >= 30) {
            layout.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.ime());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
                return WindowInsets.CONSUMED;
            });
        }
        ProgressBar progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        layout.addView(progress, new LinearLayout.LayoutParams(-1, 6));
        browser = new WebView(this) {
            @Override public boolean onTouchEvent(MotionEvent event) {
                if (event.getAction() == MotionEvent.ACTION_UP) postDelayed(() -> syncSystemBars(layout), 350);
                return super.onTouchEvent(event);
            }
        };
        layout.addView(browser, new LinearLayout.LayoutParams(-1, 0, 1));
        setContentView(layout);
        WebSettings settings = browser.getSettings();
        settings.setUserAgentString(settings.getUserAgentString() + " CadeolyAndroid/1.1");
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        WebView.setWebContentsDebuggingEnabled(false);
        CookieManager.getInstance().setAcceptThirdPartyCookies(browser, false);
        browser.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (trusted(uri)) { offline = false; return false; }
                if (request.isForMainFrame() && request.hasGesture() && "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException error) { Toast.makeText(MainActivity.this, "Aucun navigateur disponible", Toast.LENGTH_SHORT).show(); }
                }
                return true;
            }
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap icon) {
                if (trusted(Uri.parse(url))) retryUrl = url;
            }
            @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) showOffline();
            }
            @Override public void onPageFinished(WebView view, String url) { CookieManager.getInstance().flush(); syncSystemBars(layout); }
        });
        browser.setWebChromeClient(new WebChromeClient() {
            @Override public void onProgressChanged(WebView view, int value) {
                progress.setProgress(value);
                progress.setVisibility(value == 100 ? View.GONE : View.VISIBLE);
            }
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (!trusted(Uri.parse(view.getUrl() == null ? "" : view.getUrl()))) return false;
                if (photoCallback != null) photoCallback.onReceiveValue(null);
                photoCallback = callback;
                Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                picker.addCategory(Intent.CATEGORY_OPENABLE);
                picker.setType("image/*");
                picker.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/jpeg", "image/png", "image/webp"});
                try { startActivityForResult(picker, PHOTO); }
                catch (ActivityNotFoundException error) { photoCallback.onReceiveValue(null); photoCallback = null; }
                return true;
            }
            @Override public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
                if (!trusted(Uri.parse(url))) { result.cancel(); return true; }
                new AlertDialog.Builder(MainActivity.this).setTitle("Cadéoly").setMessage(message)
                    .setPositiveButton(android.R.string.ok, (dialog, which) -> result.confirm())
                    .setNegativeButton(android.R.string.cancel, (dialog, which) -> result.cancel())
                    .setOnCancelListener(dialog -> result.cancel()).show();
                return true;
            }
        });
        browser.loadUrl(HOME);
    }

    private void syncSystemBars(LinearLayout layout) {
        if (browser == null || !trusted(Uri.parse(browser.getUrl() == null ? "" : browser.getUrl()))) return;
        browser.evaluateJavascript("JSON.stringify({bg:getComputedStyle(document.documentElement).getPropertyValue('--background').trim(),dark:getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim()==='#fafafa'})", value -> {
            try {
                Object parsed = new org.json.JSONTokener(value).nextValue();
                if (!(parsed instanceof String)) return;
                org.json.JSONObject theme = new org.json.JSONObject((String) parsed);
                int color = Color.parseColor(theme.getString("bg"));
                boolean dark = theme.getBoolean("dark");
                layout.setBackgroundColor(color);
                getWindow().setStatusBarColor(color);
                getWindow().setNavigationBarColor(color);
                int flags = getWindow().getDecorView().getSystemUiVisibility();
                int light = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                getWindow().getDecorView().setSystemUiVisibility(dark ? flags & ~light : flags | light);
            } catch (Exception ignored) { /* Retain readable default bars during loading. */ }
        });
    }

    private void showOffline() {
        offline = true;
        String page = "<!doctype html><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{background:#14111c;color:#faf8ff;font:16px/1.6 sans-serif;text-align:center;padding:20vh 24px}a{display:inline-block;background:#6543be;color:white;padding:12px 24px;border-radius:12px;text-decoration:none}</style><h1>Cadéoly</h1><h2>Connexion indisponible</h2><p>Reconnecte-toi à Internet pour retrouver tes envies.</p><a href='" + HOME + "'>Réessayer</a>";
        browser.loadDataWithBaseURL(HOME, page, "text/html", "UTF-8", null);
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PHOTO && photoCallback != null) {
            Uri uri = result == RESULT_OK && data != null ? data.getData() : null;
            photoCallback.onReceiveValue(uri != null && "content".equals(uri.getScheme()) ? new Uri[]{uri} : null);
            photoCallback = null;
        }
    }
    @Override public void onBackPressed() {
        if (offline) { offline = false; browser.loadUrl(retryUrl); }
        else if (browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        if (photoCallback != null) photoCallback.onReceiveValue(null);
        browser.destroy();
        super.onDestroy();
    }
}
