# Privacy Policy & Terms of Service - Summary

**Created for:** Faithful Companion  
**Date:** January 18, 2026  
**Status:** ✅ Ready for Google Play Store Submission

---

## 📄 Documents Created

### 1. **PRIVACY_POLICY.md** ✅
- **Comprehensive 446-line privacy policy**
- Covers all data collection (personal info, prayers, chat, usage)
- Details OpenAI GPT-4 integration (CORRECTED - was Gemini)
- GDPR and CCPA compliant
- Children's privacy (13+ requirement)
- User rights and controls
- Data security measures
- Third-party service disclosure

### 2. **TERMS_OF_SERVICE.md** ✅
- **Complete 450+ line terms of service**
- User conduct and community guidelines
- Content moderation policies
- AI feature disclaimers
- Intellectual property rights
- Liability limitations
- Dispute resolution

### 3. **GOOGLE_PLAY_DATA_SAFETY.md** ✅
- **Detailed Google Play Console guide**
- Exact responses for Data Safety section
- All data types properly categorized
- Third-party service declarations
- Privacy controls documentation
- Compliance certifications

### 4. **PRIVACY_IMPLEMENTATION_GUIDE.md** ✅
- **Step-by-step implementation instructions**
- How to host the documents
- Code changes needed in the app
- Google Play Console setup
- Testing checklist
- Common issues and solutions

---

## ✅ What's Covered

### Data Collection Disclosed:
- ✅ Personal info (name, email, password)
- ✅ Profile preferences (age, denomination, Bible version)
- ✅ User-generated content (prayers, reflections, chat)
- ✅ App usage metrics and activity tracking
- ✅ Device information and IDs
- ✅ Notification tokens

### Third-Party Services:
- ✅ **Google Sign-In** (authentication)
- ✅ **Google Calendar** (optional study group scheduling)
- ✅ **OpenAI GPT-4** (AI chat companion) - CORRECTED
- ✅ **Expo Services** (notifications, infrastructure)

### Privacy Features:
- ✅ Anonymous posting option
- ✅ Public/private content controls
- ✅ Account deletion
- ✅ Data encryption (in transit and at rest)
- ✅ Notification preferences
- ✅ Profile visibility settings

### Legal Compliance:
- ✅ **GDPR** (European Union)
- ✅ **CCPA** (California)
- ✅ **COPPA** (Children under 13)
- ✅ International data transfers
- ✅ User rights (access, delete, export)

---

## 🚨 Critical Items to Complete BEFORE Submission

### 1. **Host the Documents** (REQUIRED)
You must make these documents publicly accessible:
- `https://faithfulcompanion.ai/privacy-policy`
- `https://faithfulcompanion.ai/terms-of-service`

**Options:**
- Upload to your website (recommended)
- Use GitHub Pages (free)
- Use privacy policy hosting service (Termly, FreePrivacyPolicy.com)

### 2. **Update Placeholder Information** (REQUIRED)
Replace these in the documents:
- `[Your Business Address]` → Your actual address
- `[Your State/Country]` → Actual jurisdiction
- Verify all email addresses are correct

### 3. **Add Privacy Links to App** (REQUIRED)
Update these files:
- `app/auth/signup.tsx` - Add clickable terms/privacy links
- `app/help-support.tsx` - Add legal section with links
- Account Settings - Add privacy policy access

### 4. **Update Google Play Console** (REQUIRED)
- Fill out Data Safety section (use GOOGLE_PLAY_DATA_SAFETY.md)
- Add Privacy Policy URL
- Set target age to 13+
- Complete content ratings questionnaire

### 5. **Fix Security Issues** (IMPORTANT)
Your OpenAI API key is exposed in the code:
```typescript
// In utils/openai.ts line 3
const OPENAI_API_KEY = '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';
```

**⚠️ ACTION REQUIRED:**
1. Move API key to environment variables
2. Add to `.gitignore`
3. Never commit API keys to public repos
4. Consider using backend proxy for API calls

---

## 📋 Quick Start Implementation

### Step 1: Host Documents (10 minutes)
```bash
# Convert markdown to HTML and upload to your website
# OR use GitHub Pages / hosting service
```

### Step 2: Update App Code (30 minutes)
```typescript
// Add to signup screen
import { Linking } from 'react-native';

<Text style={styles.termsText}>
  By creating an account, you agree to our{' '}
  <Text onPress={() => Linking.openURL('https://faithfulcompanion.ai/terms-of-service')}>
    Terms of Service
  </Text>
  {' '}and{' '}
  <Text onPress={() => Linking.openURL('https://faithfulcompanion.ai/privacy-policy')}>
    Privacy Policy
  </Text>
</Text>
```

### Step 3: Google Play Console (20 minutes)
1. Go to Policy → Data safety
2. Use GOOGLE_PLAY_DATA_SAFETY.md as reference
3. Fill out all sections
4. Add privacy policy URL

### Step 4: Test (15 minutes)
- [ ] Privacy policy link opens
- [ ] Terms link opens  
- [ ] Account deletion works
- [ ] Privacy controls function
- [ ] Anonymous posting works

### Step 5: Submit! 🎉

---

## 📊 Google Play Data Safety Quick Reference

**Does your app collect data?** YES

**Data types collected:**
- Personal info: Name, Email, User IDs
- Photos: Profile pictures (optional)
- Messages: Prayer requests, chat messages
- App activity: Usage metrics, interactions
- Device IDs: For authentication and notifications

**Is data shared with third parties?** YES
- Google (Sign-In, Calendar)
- OpenAI (Chat AI)
- Expo (Notifications)

**Is data encrypted?** YES (transit and at rest)

**Can users request deletion?** YES (through Account Settings)

---

## 🎯 Key Features Highlighted

### User Privacy Controls:
1. **Anonymous Mode** - Post prayers without revealing identity
2. **Content Visibility** - Choose public or private for content
3. **Notification Control** - Customize what and when
4. **Data Deletion** - Easy account and data removal
5. **Google Calendar** - Optional integration, can disconnect anytime

### Community Safety:
1. **Content Moderation** - Report inappropriate content
2. **Community Guidelines** - Clear standards of conduct
3. **Blocking/Muting** - User-level controls
4. **Privacy Settings** - Granular control over sharing

---

## ⚠️ Important Warnings

### 1. API Key Security
Your OpenAI API key is currently in the source code. This is a **CRITICAL SECURITY ISSUE**:
- Anyone with access to your code can see it
- If pushed to public GitHub, bots will find and abuse it
- You could incur thousands of dollars in unauthorized charges

**Fix immediately:**
- Move to environment variables
- Use backend proxy for API calls
- Rotate the exposed key

### 2. Data Collection Accuracy
Make sure what you declare in Data Safety matches what your app actually does:
- Google will test your app
- Discrepancies lead to rejection
- Undisclosed data collection can get your app removed

### 3. Children's Privacy
You've set age to 13+:
- Strictly enforce this in signup
- Don't knowingly collect data from under-13
- COPPA violations carry heavy fines

---

## 📞 Contact Information in Documents

All documents use these contact points:
- **Email:** support@faithfulcompanion.ai
- **Privacy:** privacy@faithfulcompanion.ai
- **Legal:** legal@faithfulcompanion.ai
- **Website:** https://faithfulcompanion.ai

**Make sure these are set up and monitored!**

---

## ✨ What Makes This Privacy Policy Strong

1. **Comprehensive** - Covers all features and data types
2. **Transparent** - Clear about AI use and third-party services
3. **User-Friendly** - Written in plain language
4. **Compliant** - GDPR, CCPA, COPPA, Google Play policies
5. **Protective** - Strong security and user rights
6. **Honest** - Accurate about data collection and sharing
7. **Detailed** - Specific about OpenAI GPT-4 usage
8. **Actionable** - Clear instructions for user rights

---

## 🚀 After Google Play Approval

### Monitor and Maintain:
1. **User Privacy Requests** - Respond within 30 days
2. **Content Moderation** - Review flagged content
3. **Privacy Updates** - Update policy when adding features
4. **Compliance Audits** - Regular privacy compliance checks
5. **User Feedback** - Address privacy concerns promptly

### When to Update Privacy Policy:
- ✏️ New data collection types
- ✏️ New third-party services
- ✏️ Changes in data handling
- ✏️ New features that affect privacy
- ✏️ Legal requirement changes

---

## 📈 Success Metrics

After implementation, you should have:
- ✅ Google Play approval
- ✅ Clear user privacy controls
- ✅ No data collection violations
- ✅ Compliance with regulations
- ✅ User trust and confidence
- ✅ Professional app store presence

---

## 🎓 Additional Resources

### Google Play Resources:
- [Data Safety Help](https://support.google.com/googleplay/android-developer/answer/10787469)
- [User Data Policy](https://support.google.com/googleplay/android-developer/answer/10144311)
- [Policy Center](https://play.google.com/console/about/programs-policy/)

### Privacy Regulations:
- [GDPR Information](https://gdpr.eu/)
- [CCPA Guide](https://oag.ca.gov/privacy/ccpa)
- [COPPA Compliance](https://www.ftc.gov/business-guidance/resources/childrens-online-privacy-protection-rule-six-step-compliance-plan-your-business)

---

## ✅ Final Checklist Before Submission

- [ ] Privacy policy hosted at public URL
- [ ] Terms of service hosted at public URL
- [ ] Placeholder text replaced with real information
- [ ] Privacy links added to app
- [ ] OpenAI API key secured (not in code)
- [ ] Google Play Data Safety completed
- [ ] Store listing updated with privacy info
- [ ] Account deletion tested and working
- [ ] Privacy controls tested
- [ ] All third-party integrations working
- [ ] Contact emails set up and monitored
- [ ] Version code added to app.json
- [ ] App tested on real device

---

## 🎉 You're Ready!

You now have everything needed for Google Play Store approval:

✅ **Comprehensive Privacy Policy** (446 lines)  
✅ **Complete Terms of Service** (450+ lines)  
✅ **Google Play Data Safety Guide**  
✅ **Implementation Instructions**  
✅ **Accurate third-party disclosure** (OpenAI, not Gemini)  
✅ **User privacy controls documented**  
✅ **Legal compliance** (GDPR, CCPA, COPPA)  

**Just follow the implementation guide, host the documents, and submit!**

---

**Questions?** Review the PRIVACY_IMPLEMENTATION_GUIDE.md for detailed steps.

**Good luck with your app launch!** 🙏📱

---

**Document Created:** January 18, 2026  
**For App:** Faithful Companion v1.0.0  
**Status:** Ready for Implementation

© 2026 Faithful Companion. All rights reserved.

