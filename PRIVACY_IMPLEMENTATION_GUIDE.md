# Privacy Policy Implementation Guide

**For:** Faithful Companion App  
**Date:** January 18, 2026

This guide explains how to implement the privacy policy and prepare for Google Play Store submission.

---

## 📋 Quick Action Checklist

### Immediate Actions (Before App Store Submission):

- [ ] **1. Host Privacy Policy and Terms of Service**
- [ ] **2. Update App Code References**
- [ ] **3. Update Google Play Console**
- [ ] **4. Add In-App Privacy Links**
- [ ] **5. Test All Privacy Features**
- [ ] **6. Prepare Store Listing**

---

## 1. Host Privacy Policy and Terms of Service

### Option A: Host on Your Website (Recommended)

Upload the documents to your website:

```
https://faithfulcompanion.ai/privacy-policy
https://faithfulcompanion.ai/terms-of-service
```

**Steps:**
1. Convert `PRIVACY_POLICY.md` and `TERMS_OF_SERVICE.md` to HTML
2. Upload to your website at the URLs above
3. Ensure they are publicly accessible (no login required)
4. Test the URLs in a browser

### Option B: Use GitHub Pages (Free Alternative)

If you don't have a website yet:

1. Create a GitHub repository (can be private)
2. Enable GitHub Pages
3. Upload HTML versions of the documents
4. URLs will be: `https://yourusername.github.io/faithful-companion/privacy-policy.html`

### Option C: Use a Third-Party Service

Services like:
- **Termly** (https://termly.io) - Free privacy policy hosting
- **FreePrivacyPolicy.com** - Free hosting and generation
- **Netlify** - Free static site hosting

---

## 2. Update App Code References

### Add Privacy Policy Links to Your App

#### Step 1: Update the Signup Screen

Add a link to the terms text:

```typescript
// app/auth/signup.tsx (around line 328)

<Text style={styles.termsText}>
  By creating an account, you agree to our{' '}
  <Text 
    style={styles.termsLink}
    onPress={() => Linking.openURL('https://faithfulcompanion.ai/terms-of-service')}
  >
    Terms of Service
  </Text>
  {' '}and{' '}
  <Text 
    style={styles.termsLink}
    onPress={() => Linking.openURL('https://faithfulcompanion.ai/privacy-policy')}
  >
    Privacy Policy
  </Text>
</Text>
```

Add to styles:
```typescript
termsLink: {
  color: WHITE,
  textDecorationLine: 'underline',
  fontWeight: '600',
},
```

Don't forget to import Linking:
```typescript
import { Alert, Dimensions, Image, KeyboardAvoidingView, Linking, Platform, ... } from 'react-native';
```

#### Step 2: Add to Help & Support Screen

Create or update `app/help-support.tsx`:

```typescript
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpSupportScreen = () => {
  const openPrivacyPolicy = () => {
    Linking.openURL('https://faithfulcompanion.ai/privacy-policy');
  };

  const openTerms = () => {
    Linking.openURL('https://faithfulcompanion.ai/terms-of-service');
  };

  return (
    <ScrollView style={styles.container}>
      {/* ... other help content ... */}
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <TouchableOpacity style={styles.linkItem} onPress={openPrivacyPolicy}>
          <Ionicons name="shield-checkmark" size={24} color="#7b4d62" />
          <Text style={styles.linkText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.linkItem} onPress={openTerms}>
          <Ionicons name="document-text" size={24} color="#7b4d62" />
          <Text style={styles.linkText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
```

#### Step 3: Add to Account Settings

In `app/account-settings.tsx` or the Account Management Modal, add:

```typescript
<TouchableOpacity 
  style={styles.settingItem}
  onPress={() => Linking.openURL('https://faithfulcompanion.ai/privacy-policy')}
>
  <Ionicons name="shield-checkmark" size={24} color={PRIMARY_COLOR} />
  <Text style={styles.settingText}>Privacy Policy</Text>
  <Ionicons name="chevron-forward" size={20} color="#999" />
</TouchableOpacity>
```

---

## 3. Update Google Play Console

### Step 1: Data Safety Section

Go to **Google Play Console → Your App → Policy → Data safety**

Fill out using the `GOOGLE_PLAY_DATA_SAFETY.md` document as reference:

**Key Points:**
- Data collection: YES
- Data types: Personal info, Messages, App activity, Device IDs
- Data sharing: YES (with Google, OpenAI, Expo)
- Encryption in transit: YES
- Encryption at rest: YES
- Users can request deletion: YES

### Step 2: App Content

Go to **App content** section:

#### Privacy Policy
- Add URL: `https://faithfulcompanion.ai/privacy-policy`

#### Target Audience
- Age: 13+
- Not designed for children

#### Content Ratings
- Complete the questionnaire (Religious/Christian content)
- Expected rating: Everyone or Teen

#### Government Apps
- Select "No"

### Step 3: Store Listing

Update your store listing to mention privacy:

**Short Description (80 chars):**
```
Your personal Christian companion for daily prayer, Bible study, and faith growth
```

**Full Description:**

Include a privacy section:
```
📱 PRIVACY & SECURITY
Your privacy matters to us:
• Secure account protection
• Control what you share publicly
• Anonymous prayer option
• Data encryption
• Easy account deletion

Read our Privacy Policy: https://faithfulcompanion.ai/privacy-policy
```

---

## 4. Add Constants File (Optional but Recommended)

Create a new file for easy URL management:

```typescript
// constants/Legal.ts

export const LEGAL_URLS = {
  PRIVACY_POLICY: 'https://faithfulcompanion.ai/privacy-policy',
  TERMS_OF_SERVICE: 'https://faithfulcompanion.ai/terms-of-service',
  SUPPORT_EMAIL: 'support@faithfulcompanion.ai',
  PRIVACY_EMAIL: 'privacy@faithfulcompanion.ai',
};
```

Then use throughout your app:
```typescript
import { LEGAL_URLS } from '@/constants/Legal';
Linking.openURL(LEGAL_URLS.PRIVACY_POLICY);
```

---

## 5. Testing Checklist

Before submission, test these features:

### Privacy Controls
- [ ] Users can post anonymous prayer requests
- [ ] Users can make prayer requests private
- [ ] Users can control study group visibility
- [ ] Notification settings work properly
- [ ] Profile visibility controls function correctly

### Account Deletion
- [ ] Delete account option is accessible
- [ ] Confirmation dialog appears
- [ ] Account is actually deleted from backend
- [ ] User is logged out after deletion

### Data Access
- [ ] Users can view their profile information
- [ ] Users can update their preferences
- [ ] Profile picture upload/change works (if enabled)

### Third-Party Integrations
- [ ] Google Sign-In works
- [ ] Google Calendar connection is optional
- [ ] Calendar can be disconnected
- [ ] OpenAI chat functions properly

### Legal Links
- [ ] Privacy Policy link opens correctly
- [ ] Terms of Service link opens correctly
- [ ] Links work from all places in the app

---

## 6. Required Changes to app.json

Update your `app.json`:

```json
{
  "expo": {
    "name": "Faithful Companion",
    "android": {
      "versionCode": 1,
      "package": "com.faithfulcompanion.app",
      "permissions": [
        "INTERNET",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "privacy": "public",
    "extra": {
      "privacyPolicy": "https://faithfulcompanion.ai/privacy-policy",
      "termsOfService": "https://faithfulcompanion.ai/terms-of-service"
    }
  }
}
```

---

## 7. Important Information to Update

### Replace Placeholders

In the privacy documents, replace these placeholders with actual information:

1. **Business Address:**
   ```
   Find: [Your Business Address]
   Replace with: Your actual business address
   ```

2. **Contact Email (if different):**
   - The documents use: support@faithfulcompanion.ai
   - Update if you want to use a different email

3. **Country/State for Legal Jurisdiction:**
   ```
   Find: [Your State/Country]
   Replace with: Your actual state/country
   ```

---

## 8. Backend API Considerations

Ensure your backend supports these privacy features:

### Account Deletion Endpoint
```
DELETE /api/users/account
```
Should delete:
- User account
- Personal information
- Prayer requests (or anonymize if preferred)
- Chat history
- Study groups created (or reassign ownership)

### Data Export Endpoint (Optional)
```
GET /api/users/data-export
```
Should return user's data in JSON format.

### Privacy Settings Endpoints
Make sure these work:
- Update anonymous mode
- Update content visibility
- Update notification preferences

---

## 9. Communication Plan

### Email Template for Existing Users (If Any)

Subject: "Important Privacy Policy Update for Faithful Companion"

```
Dear [Name],

We're committed to protecting your privacy and want to inform you about our updated Privacy Policy and Terms of Service.

What's New:
• Clear explanation of data we collect
• Your privacy rights and controls
• How we protect your information
• Third-party services we use (Google, OpenAI)

Review our policies:
Privacy Policy: https://faithfulcompanion.ai/privacy-policy
Terms of Service: https://faithfulcompanion.ai/terms-of-service

Your privacy matters to us. You have full control over:
✓ Anonymous posting
✓ Public/private content
✓ Notification preferences
✓ Account deletion

Questions? Contact us at support@faithfulcompanion.ai

Blessings,
The Faithful Companion Team
```

---

## 10. Pre-Submission Verification

### Final Checklist

- [ ] **Privacy Policy URL is live and accessible**
- [ ] **Terms of Service URL is live and accessible**
- [ ] **Both URLs work without login**
- [ ] **URLs are HTTPS (secure)**
- [ ] **All placeholder text replaced with actual info**
- [ ] **App version number updated**
- [ ] **Version code added to app.json**
- [ ] **Google Play Data Safety section completed**
- [ ] **Store listing includes privacy information**
- [ ] **In-app links to privacy policy added**
- [ ] **Account deletion tested**
- [ ] **Privacy controls tested**
- [ ] **OpenAI API key is valid and working**
- [ ] **Google OAuth credentials configured**

---

## 11. Common Issues and Solutions

### Issue: Privacy Policy Link Returns 404
**Solution:** Ensure the URL is publicly accessible and not behind authentication.

### Issue: Google Play Rejects Data Safety
**Solution:** Double-check that declared data types match what your app actually collects.

### Issue: Users Can't Delete Account
**Solution:** Verify backend endpoint works and actually deletes data.

### Issue: OpenAI API Key Exposed
**Solution:** Move API key to environment variables, never commit to Git:
```typescript
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
```

---

## 12. Post-Submission Monitoring

After approval:

1. **Monitor for Privacy Violations:**
   - Set up alerts for reported content
   - Review user-generated content regularly
   - Respond to privacy inquiries within 30 days

2. **Update Privacy Policy When Needed:**
   - New features that collect data
   - New third-party integrations
   - Changes in data handling
   - Notify users of material changes

3. **Handle User Requests:**
   - Data access requests (GDPR)
   - Data deletion requests (CCPA)
   - Data correction requests
   - Export requests

---

## 13. Support Resources

### For Privacy Questions:
**Email:** privacy@faithfulcompanion.ai

### For Technical Issues:
**Email:** support@faithfulcompanion.ai

### For Legal Compliance:
**Email:** legal@faithfulcompanion.ai

---

## 14. Important Security Notes

### Protect Your API Keys

1. **OpenAI API Key** (Currently in code):
   ```typescript
   // DON'T commit this to public repos!
   // Move to .env file:
   EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
   ```

2. **Use Environment Variables:**
   ```typescript
   import Constants from 'expo-constants';
   const OPENAI_API_KEY = Constants.expoConfig?.extra?.openaiKey;
   ```

3. **Add to .gitignore:**
   ```
   .env
   .env.local
   utils/gemini.ts  # If it contains keys
   ```

---

## 15. Next Steps After Implementation

1. ✅ Host privacy documents
2. ✅ Update all app code with privacy links
3. ✅ Fill out Google Play Data Safety
4. ✅ Update store listing
5. ✅ Test all privacy features
6. ✅ Submit for review
7. ✅ Monitor feedback
8. ✅ Respond to user privacy requests

---

## Questions or Need Help?

If you need assistance with implementation:
1. Review the `GOOGLE_PLAY_DATA_SAFETY.md` for specific answers
2. Check Google's Play Console help documentation
3. Consider consulting with a privacy attorney for legal compliance

---

**Good luck with your Google Play Store submission!** 🎉

Your privacy policy is comprehensive and should meet all Google Play requirements.

---

**Document Version:** 1.0  
**Last Updated:** January 18, 2026

© 2026 Faithful Companion. All rights reserved.

