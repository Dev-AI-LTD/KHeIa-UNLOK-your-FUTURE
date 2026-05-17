# R8 / ProGuard rules for KHEYA (Expo React Native)
# Copiază acest fișier în proiect sau folosește conținutul în expo-build-properties (extraProguardRules).
# La primul build cu R8, rulează: npx expo install expo-build-properties

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keepattributes SourceFile,LineNumberTable
-keepattributes *Annotation*

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }

# RevenueCat (react-native-purchases)
-keep class com.revenuecat.purchases.** { *; }

# Supabase / GoTrue (dacă folosești native modules)
-keep class io.supabase.** { *; }

# OkHttp / networking (folosit de multe SDK-uri)
-dontwarn okhttp3.**
-dontwarn javax.annotation.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}
