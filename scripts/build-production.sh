#!/bin/bash

# Faithful Companion - Production Build Script
# This script prepares and builds the app for Google Play Store

echo "🚀 Faithful Companion - Production Build"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "Please create .env file with:"
    echo "EXPO_PUBLIC_OPENAI_API_KEY=your-key-here"
    echo "EXPO_PUBLIC_GEMINI_API_KEY=your-key-here"
    exit 1
fi

echo "✅ Environment file found"

# Check if EAS is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g eas-cli
fi

echo "✅ EAS CLI ready"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linter
echo "🔍 Running linter..."
npm run lint -- --max-warnings=0

# Build for Android
echo "🏗️  Building for Android (Production)..."
echo ""
echo "Select build type:"
echo "1) APK (for testing)"
echo "2) AAB (for Play Store)"
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo "Building APK..."
        eas build --platform android --profile preview
        ;;
    2)
        echo "Building AAB for Play Store..."
        eas build --platform android --profile production
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Build complete!"
echo "📋 Next steps:"
echo "  1. Download the build from EAS dashboard"
echo "  2. Test on a physical device"
echo "  3. Upload to Play Store Console"
echo ""
echo "📚 See PLAY_STORE_SECURITY_AUDIT.md for complete checklist"
