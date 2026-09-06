# FxSound Mobile

Android 系统级音频增强器 —— 捕获设备所有声音进行实时音效处理，功能对标 FxSound 桌面版。

## 功能特性

### 系统级音频处理
- 通过 `MediaProjection` + `AudioPlaybackCapture` 捕获设备全部音频（音乐、视频、游戏等）
- 实时 PCM 级信号处理，不依赖特定播放器
- 前台服务保障后台持续运行

### 10 段均衡器
| 频率 | 31Hz | 62Hz | 125Hz | 250Hz | 500Hz | 1kHz | 2kHz | 4kHz | 8kHz | 16kHz |
|------|------|------|-------|-------|-------|------|------|------|------|-------|
| 范围 | -12dB ~ +12dB，基于 RBJ Audio EQ Cookbook 的 Biquad Peaking Filter |

### 5 大音效
| 效果 | 实现方式 | 范围 |
|------|---------|------|
| Clarity（清晰度）| High-shelf Biquad 滤波器 | 0-10 |
| Ambience（氛围）| Android `PresetReverb` | 0-10 |
| Surround（环绕）| Android `Virtualizer` | 0-10 |
| Dynamic Boost（动态增益）| Android `LoudnessEnhancer` | 0-10 |
| Bass（低音）| Low-shelf Biquad 滤波器 | 0-10 |

### 12 种预设
Standard / Bass Boost / Vocal Boost / Treble Boost / Ambience / Surround 3D / Jazz / Classical / Rock / Pop / Electronic / Country

### 主控参数
- Master Gain（主增益）：-12 ~ +12 dB
- Volume Leveling（音量平衡）：0 ~ 4 dB
- Filter Q（滤波器 Q 值）：1.0 ~ 3.0
- Balance（声道平衡）：-1.0 ~ +1.0

### 多语言支持
English / 简体中文 / 日本語 / Español

## 技术架构

```
┌─────────────────────────────────────────────────┐
│                   WebView UI                      │
│  (index.html + app.js + styles.css + i18n.js)    │
│                                                   │
│  10-Band EQ │ 5 Effects │ 12 Presets │ 4 Languages│
└────────────────────┬────────────────────────────┘
                     │ JS Bridge (window.FxNative)
                     ▼
┌─────────────────────────────────────────────────┐
│              Native Audio Engine                 │
│                                                   │
│  ┌──────────┐    ┌──────────────┐    ┌─────────┐│
│  │MediaProj │───▶│  AudioRecord  │───▶│ PCM     ││
│  │Capture   │    │ 44.1kHz/16bit │    │Process  ││
│  └──────────┘    └──────────────┘    └────┬────┘│
│                                            │     │
│                   ┌──────────────────────┘     │
│                   ▼                             │
│  ┌──────────────┐  ┌───────────┐  ┌──────────┐│
│  │Biquad EQ x10 │  │Bass/Clarity│  │AudioTrack││
│  │(Peaking)     │  │(Shelf)    │  │+ Effects ││
│  └──────────────┘  └───────────┘  └──────────┘│
│                                                   │
│  Effects: PresetReverb / Virtualizer /           │
│           LoudnessEnhancer                       │
└─────────────────────────────────────────────────┘
```

### 音频处理流程
1. `MediaProjection` 获取系统音频捕获权限
2. `AudioRecord` 以 44.1kHz / 立体声 / 16-bit PCM 格式读取音频数据
3. PCM 数据流经信号处理链：
   - 10 段 Peaking EQ Biquad 滤波器（每段独立增益）
   - Low-shelf Biquad（低音增强）
   - High-shelf Biquad（清晰度增强）
   - 主增益 + 音量平衡 + 声道平衡
4. `AudioTrack` 输出处理后的音频，系统音效（Reverb/Virtualizer/LoudnessEnhancer）挂载到 AudioTrack 的 audioSessionId

## 项目结构

```
FxSound手机版/
├── index.html              # WebView 主页面
├── app.js                  # UI 控制器 + NativeBridge
├── styles.css              # 全部样式
├── presets.js              # 预设定义（EQ/效果/主控参数）
├── i18n.js                 # 多语言字典（英/中/日/西）
├── manifest.json            # PWA manifest
├── FxSound.apk              # 构建产物
├── android/
│   ├── AndroidManifest.xml # 清单（权限 + 服务声明）
│   ├── assets/              # WebView 资源副本
│   ├── res/                 # Android 资源（图标/主题/字符串）
│   └── src/com/fxsound/mobile/
│       ├── MainActivity.java   # WebView + JS Bridge + 权限流程
│       ├── AudioService.java   # 前台服务：音频捕获 + PCM处理 + 输出
│       └── Biquad.java         # 双二阶滤波器（RBJ 公式）
```

## 构建

### 前提条件
- Android SDK (API 36)
- Android Build Tools 36.1.0
- JDK 17+

### 构建步骤
```powershell
cd android

$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$bt = "$sdk\build-tools\36.1.0"
$java = "path/to/jdk"

$env:JAVA_HOME = $java
$env:PATH = "$java\bin;$bt;$sdk\platform-tools;$env:PATH"

# 编译资源
aapt2 compile --dir res -o build\res.zip
aapt2 link -o build\app-unsigned.apk -I "$sdk\platforms\android-36\android.jar" --manifest AndroidManifest.xml --java build\gen -A assets build\res.zip

# 编译 Java
javac -classpath "$sdk\platforms\android-36\android.jar" -d build\classes src\com\fxsound\mobile\*.java build\gen\com\fxsound\mobile\R.java

# 生成 DEX
d8 --lib "$sdk\platforms\android-36\android.jar" --output build\dex build\classes\com\fxsound\mobile\*.class

# 打包 + 对齐 + 签名
aapt add build\app-unsigned.apk build\dex\classes.dex
zipalign -f 4 build\app-unsigned.apk build\app-aligned.apk
apksigner sign --ks build\debug.keystore --ks-pass pass:android --key-pass pass:android --out FxSound.apk build\app-aligned.apk
```

## 使用说明

1. 安装 APK
2. 点击电源按钮启动音频捕获
3. 系统会弹出录屏授权对话框（Android 系统音频捕获的必要流程），点击「允许」
4. 授权后设备上所有声音都会经过 FxSound 处理
5. 在 Effects / Equalizer / Master 标签页中调节参数
6. 点击预设芯片快速切换音效模式

### 权限说明
| 权限 | 用途 |
|------|------|
| `RECORD_AUDIO` | 捕获系统音频 |
| `FOREGROUND_SERVICE_MEDIA_PROJECTION` | 前台服务进行媒体投影 |
| `POST_NOTIFICATIONS` | 显示前台服务通知 |
| `INTERNET` | WebView 加载本地资源 |

## 系统要求

- Android 10 (API 29) 及以上（`AudioPlaybackCapture` 最低要求）
- 真机运行（模拟器不支持 `MediaProjection` 系统音频捕获）

## 许可

本项目为 FxSound 桌面版的 Android 移植版本，仅供学习交流使用。
