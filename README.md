# 📱 Faithful Companion - Mobile App

Your daily companion for Bible study, prayer, and spiritual growth.

[![Made with Expo](https://img.shields.io/badge/Made%20with-Expo-000020.svg?style=flat&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## 📖 About

Faithful Companion is a comprehensive mobile application designed to help believers grow in their faith through:

- 📖 **Daily Bible Reading** - Personalized verses, multiple translations, audio support
- 🙏 **Prayer Journal** - Track prayers, share with community, celebrate answered prayers
- 💬 **AI Spiritual Companion** - Ask questions, get biblically-grounded guidance
- 📚 **Study Groups** - Join or create groups, schedule meetings, connect globally
- 📊 **Progress Tracking** - Streaks, XP, levels, and spiritual growth insights
- 🔔 **Smart Notifications** - Daily reminders for prayer and Bible reading

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Android Studio** (for Android development)
- **Xcode** (for iOS development, macOS only)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/faithful-companion.git
cd faithful-companion
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**

Create a `.env` file in the root directory:
```bash
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key_here
EXPO_PUBLIC_API_BASE_URL=https://your-api.com
```

4. **Start the development server:**
```bash
npx expo start
```

5. **Run on device/emulator:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)
   - Scan QR code with Expo Go app on physical device

---

## 📁 Project Structure

```
faithful-companion/
├── app/                      # App screens and navigation
│   ├── (tabs)/              # Bottom tab navigation
│   │   ├── index.tsx        # Home screen
│   │   ├── reading.tsx      # Bible reading & study groups
│   │   ├── prayer.tsx       # Prayer journal
│   │   ├── chat.tsx         # AI spiritual companion
│   │   └── profile.tsx      # User profile & settings
│   ├── (main)/              # Onboarding flow
│   │   ├── onboarding.tsx
│   │   ├── welcome.tsx
│   │   └── ...
│   ├── auth/                # Authentication screens
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── _layout.tsx          # Root layout
├── components/              # Reusable UI components
│   ├── modals/             # Modal components
│   ├── home/               # Home screen components
│   └── ui/                 # UI primitives
├── constants/              # App constants
│   ├── API.ts             # API endpoints
│   └── Colors.ts          # Color scheme
├── contexts/              # React contexts
│   └── LoadingContext.tsx
├── hooks/                 # Custom React hooks
│   ├── useDailyContent.ts
│   ├── useStreak.ts
│   ├── useTTS.ts
│   └── ...
├── utils/                 # Utility functions
│   ├── api/              # API clients
│   ├── gemini.ts         # Gemini AI integration
│   ├── openai.ts         # OpenAI integration
│   ├── notifications.ts  # Push notifications
│   └── ...
├── types/                # TypeScript type definitions
├── assets/               # Images, fonts, videos
├── android/              # Native Android project
├── scripts/              # Build and utility scripts
└── docs/                 # Documentation files
```

---

## 🛠️ Development

### Available Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Type checking
npx tsc

# Linting
npm run lint

# Clean and rebuild
npm run clean
cd android && ./gradlew clean && cd ..
```

### Environment Setup

**Android:**
1. Install Android Studio
2. Set up Android SDK (API 33+)
3. Create virtual device (AVD)
4. Set `ANDROID_HOME` environment variable

**iOS (macOS only):**
1. Install Xcode from App Store
2. Install Xcode Command Line Tools
3. Install CocoaPods: `sudo gem install cocoapods`

---

## 🏗️ Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI:**
```bash
npm install -g eas-cli
```

2. **Login to Expo:**
```bash
eas login
```

3. **Configure build:**
```bash
eas build:configure
```

4. **Build for Android:**
```bash
eas build --platform android --profile production
```

5. **Build for iOS:**
```bash
eas build --platform ios --profile production
```

### Manual Build (Android)

1. **Generate signing key:**
```bash
cd scripts
bash generate-keystore.sh
```

2. **Configure gradle.properties:**
```bash
# android/gradle.properties
MYAPP_RELEASE_STORE_FILE=faithful-companion-release.keystore
MYAPP_RELEASE_KEY_ALIAS=faithful-companion
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password
```

3. **Build APK/AAB:**
```bash
cd android
./gradlew bundleRelease  # For AAB (Play Store)
./gradlew assembleRelease  # For APK
```

4. **Find output:**
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm test

# E2E tests (if configured)
npm run test:e2e
```

### Manual Testing Checklist
See [PRE_LAUNCH_TESTING_CHECKLIST.md](./PRE_LAUNCH_TESTING_CHECKLIST.md)

---

## 📦 Dependencies

### Core
- **React Native** - Mobile framework
- **Expo** - Development platform
- **Expo Router** - File-based navigation
- **TypeScript** - Type safety

### UI/UX
- **React Native** components
- **Expo AV** - Audio/video playback
- **Expo Notifications** - Push notifications

### Backend/API
- **OpenAI API** - AI chat functionality
- **Google Gemini API** - Alternative AI
- **Firebase** - Authentication & analytics

### Storage
- **Expo SecureStore** - Encrypted storage
- **AsyncStorage** - Local persistence

### Utilities
- **date-fns** - Date manipulation
- **expo-calendar** - Calendar integration
- **expo-linking** - Deep linking

---

## 🔒 Security

### Best Practices

✅ **API Keys:**
- Never commit API keys to git
- Use environment variables
- Store in `.env` file (gitignored)
- Use `expo-constants` for runtime access

✅ **Data Storage:**
- Use `SecureStore` for sensitive data
- Encrypt tokens at rest
- Clear auth data on logout

✅ **Network:**
- All API calls use HTTPS
- Validate SSL certificates
- Implement request timeouts

✅ **Code:**
- ProGuard/R8 enabled for Android
- Minification enabled
- Source maps excluded from production

### Security Audit
See [PLAY_STORE_SECURITY_AUDIT.md](./PLAY_STORE_SECURITY_AUDIT.md)

---

## 🚀 Deployment

### Google Play Store

**Step-by-step guide:**
See [GOOGLE_PLAY_SUBMISSION_GUIDE.md](./GOOGLE_PLAY_SUBMISSION_GUIDE.md)

**Quick checklist:**
- [ ] Build production AAB
- [ ] Complete Play Console setup
- [ ] Upload screenshots & graphics
- [ ] Set up content rating
- [ ] Configure data safety
- [ ] Submit for review

### Apple App Store (Future)

1. Enroll in Apple Developer Program ($99/year)
2. Configure app in App Store Connect
3. Build with EAS or Xcode
4. Upload via Transporter
5. Submit for review

---

## 📄 Documentation

- **[IMMEDIATE_ACTION_ITEMS.md](./IMMEDIATE_ACTION_ITEMS.md)** - Critical tasks before launch
- **[PLAY_STORE_READY_SUMMARY.md](./PLAY_STORE_READY_SUMMARY.md)** - Launch readiness status
- **[PLAY_STORE_SECURITY_AUDIT.md](./PLAY_STORE_SECURITY_AUDIT.md)** - Security review
- **[PRE_LAUNCH_TESTING_CHECKLIST.md](./PRE_LAUNCH_TESTING_CHECKLIST.md)** - Complete testing guide
- **[PLAY_STORE_LISTING_CONTENT.md](./PLAY_STORE_LISTING_CONTENT.md)** - Store descriptions
- **[GOOGLE_PLAY_SUBMISSION_GUIDE.md](./GOOGLE_PLAY_SUBMISSION_GUIDE.md)** - Submission steps
- **[PRIVACY_POLICY.md](./PRIVACY_POLICY.md)** - Privacy policy
- **[TERMS_OF_SERVICE.md](./TERMS_OF_SERVICE.md)** - Terms of service

---

## 🐛 Troubleshooting

### Common Issues

**Metro bundler errors:**
```bash
# Clear cache
npx expo start -c

# Reset node_modules
rm -rf node_modules
npm install
```

**Android build errors:**
```bash
# Clean gradle
cd android
./gradlew clean
cd ..

# Rebuild native modules
npx expo prebuild --clean
```

**iOS build errors:**
```bash
# Clean build folder
rm -rf ios/build

# Reinstall pods
cd ios
pod deintegrate
pod install
cd ..
```

**Environment variable not loading:**
- Restart Metro bundler
- Check `.env` file exists
- Verify `EXPO_PUBLIC_` prefix
- Clear Expo cache: `npx expo start -c`

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit your changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style
- Use TypeScript
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation

---

## 📞 Support

### Get Help

- **Email:** support@faithfulcompanion.ai
- **Documentation:** [Project Wiki](./docs)
- **Issues:** [GitHub Issues](https://github.com/yourusername/faithful-companion/issues)

### Report Bugs

Please include:
1. Device model and OS version
2. App version
3. Steps to reproduce
4. Expected vs actual behavior
5. Screenshots/logs if available

---

## 📜 License

Copyright © 2026 Faithful Companion

All rights reserved. This software is proprietary and confidential.

---

## 🙏 Acknowledgments

**Technologies:**
- [Expo](https://expo.dev) - React Native platform
- [React Native](https://reactnative.dev) - Mobile framework
- [OpenAI](https://openai.com) - AI chat capabilities
- [Google Gemini](https://ai.google.dev) - AI alternatives
- [Firebase](https://firebase.google.com) - Backend services

**Resources:**
- Bible translations from various sources
- Prayer content from community contributions
- Icons from [Expo Icons](https://icons.expo.fyi)

---

## 📊 Project Status

- ✅ **Core Features:** Complete
- ✅ **Security Audit:** Passed
- ✅ **Testing:** In Progress
- 🔄 **Play Store Submission:** Preparing
- ⏳ **iOS Version:** Planned

---

## 🗺️ Roadmap

### Version 1.0 (Current)
- [x] Daily Bible reading
- [x] Prayer journal
- [x] AI spiritual companion
- [x] Study groups
- [x] Progress tracking
- [x] Push notifications

### Version 1.1 (Next)
- [ ] Offline Bible access
- [ ] Advanced search
- [ ] Custom reading plans
- [ ] Social sharing improvements
- [ ] Performance optimizations

### Version 2.0 (Future)
- [ ] iPad/tablet optimization
- [ ] Web version
- [ ] Live video groups
- [ ] Multi-language support
- [ ] Desktop apps (Windows/Mac)

---

## 💖 Mission

Our mission is to help believers grow in their faith through technology, providing tools for daily spiritual disciplines, community connection, and biblical learning.

**"Your word is a lamp to my feet and a light to my path." - Psalm 119:105**

---

**Built with ❤️ for the Body of Christ**

Last Updated: January 26, 2026
