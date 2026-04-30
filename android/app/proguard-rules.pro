# Faithful Companion - ProGuard Rules for Production

# Keep line numbers for better crash reports
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Keep all annotation classes
-keepattributes *Annotation*

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo
-keep class expo.modules.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Retrofit / Gson
-keepattributes Signature
-keepattributes Exceptions
-keepclassmembers,allowobfuscation class * {
  @com.google.gson.annotations.SerializedName <fields>;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep crashlytics
-keepattributes SourceFile,LineNumberTable

# Keep Enum
-keepclassmembers enum * { *; }

# Security: Remove all logging in production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep JavaScript Interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Secure Store / Crypto
-keep class expo.modules.securestore.** { *; }
-keep class androidx.security.crypto.** { *; }

# Google Play Services
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.android.gms.**

# Remove console.log in production
-assumenosideeffects class * {
    void console.log(...);
    void console.debug(...);
    void console.info(...);
}
