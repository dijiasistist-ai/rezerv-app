import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar as NativeStatusBar,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";

const APP_URL = "https://tyee.app";
const ALLOWED_HOSTS = new Set(["tyee.app", "www.tyee.app"]);

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  const handleNavigation = useCallback((event: WebViewNavigation) => {
    setCanGoBack(event.canGoBack);
  }, []);

  const allowNavigation = useCallback((request: { url: string }) => {
    const url = request.url;

    if (url === "about:blank") return true;
    if (/^(tel|mailto|sms|maps):/i.test(url)) {
      Linking.openURL(url).catch(() => undefined);
      return false;
    }

    try {
      const host = new URL(url).hostname.toLocaleLowerCase("en-US");
      if (ALLOWED_HOSTS.has(host)) return true;
    } catch {
      return false;
    }

    Linking.openURL(url).catch(() => undefined);
    return false;
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webView}
        originWhitelist={["https://*", "http://*"]}
        onNavigationStateChange={handleNavigation}
        onShouldStartLoadWithRequest={allowNavigation}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        domStorageEnabled
        javaScriptEnabled
        geolocationEnabled
        allowsBackForwardNavigationGestures
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2f80ed" />
            <Text style={styles.loadingText}>tyee hazırlanıyor…</Text>
          </View>
        )}
        renderError={() => (
          <View style={styles.center}>
            <Text style={styles.errorTitle}>Bağlantı kurulamadı</Text>
            <Text style={styles.errorText}>İnternet bağlantını kontrol edip tekrar deneyebilirsin.</Text>
            <Pressable style={styles.retryButton} onPress={() => setReloadKey((value) => value + 1)}>
              <Text style={styles.retryButtonText}>Tekrar dene</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? NativeStatusBar.currentHeight : 0,
    backgroundColor: "#ffffff",
  },
  webView: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 28,
    backgroundColor: "#ffffff",
  },
  loadingText: {
    color: "#526079",
    fontSize: 15,
    fontWeight: "600",
  },
  errorTitle: {
    color: "#101828",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  errorText: {
    color: "#667085",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  retryButton: {
    minWidth: 150,
    marginTop: 6,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#2f80ed",
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
});
