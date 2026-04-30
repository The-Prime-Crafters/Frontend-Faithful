#!/bin/bash

# Generate Production Signing Key for Faithful Companion
# This creates a keystore file for signing your Android app

echo "🔐 Faithful Companion - Generate Production Signing Key"
echo "========================================================"
echo ""
echo "⚠️  IMPORTANT: Save the passwords you create!"
echo "⚠️  Backup the keystore file! You can't update your app without it!"
echo ""

# Check if keystore already exists
if [ -f "faithful-companion-release.keystore" ]; then
    echo "❌ Keystore file already exists: faithful-companion-release.keystore"
    echo ""
    read -p "Do you want to create a new one? This will overwrite the existing file. (y/N): " confirm
    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        echo "Cancelled."
        exit 0
    fi
    echo ""
fi

# Generate the keystore
echo "📝 You'll be prompted for the following information:"
echo "  1. Keystore password (SAVE THIS!)"
echo "  2. Key password (SAVE THIS!)"
echo "  3. First and last name"
echo "  4. Organizational unit (e.g., Development)"
echo "  5. Organization (e.g., Faithful Companion)"
echo "  6. City/Locality"
echo "  7. State/Province"
echo "  8. Country code (2 letters, e.g., US)"
echo ""

keytool -genkeypair -v -storetype PKCS12 \
  -keystore faithful-companion-release.keystore \
  -alias faithful-companion \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Keystore created successfully!"
    echo ""
    echo "📂 File location: $(pwd)/faithful-companion-release.keystore"
    echo ""
    echo "🔒 NEXT STEPS:"
    echo ""
    echo "1. BACKUP THIS FILE to a secure location (cloud storage, password manager, etc.)"
    echo "2. SAVE YOUR PASSWORDS securely (you'll need them for every app update)"
    echo "3. Add to .gitignore (already done)"
    echo ""
    echo "4. For EAS builds, upload keystore:"
    echo "   eas credentials"
    echo ""
    echo "5. For manual builds, create android/gradle.properties with:"
    echo "   MYAPP_RELEASE_STORE_FILE=faithful-companion-release.keystore"
    echo "   MYAPP_RELEASE_KEY_ALIAS=faithful-companion"
    echo "   MYAPP_RELEASE_STORE_PASSWORD=your_store_password"
    echo "   MYAPP_RELEASE_KEY_PASSWORD=your_key_password"
    echo ""
    echo "⚠️  NEVER commit gradle.properties or the keystore to git!"
    echo ""
else
    echo ""
    echo "❌ Failed to create keystore"
    echo "Make sure you have Java keytool installed"
    exit 1
fi
