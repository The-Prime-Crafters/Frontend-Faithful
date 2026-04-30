# 🚨 BACKEND: Account Deletion Feature Implementation

## Overview
We need to add an account deletion endpoint to comply with GDPR/Play Store requirements. Users must be able to permanently delete their accounts and all associated data.

---

## Required Endpoint

### DELETE /api/users/account

**Authentication:** Required (Bearer token)

**Description:** Permanently deletes the user's account and all associated data.

**Request:**
```http
DELETE /api/users/account HTTP/1.1
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "success": false,
  "message": "Authentication required"
}
```

500 Internal Server Error:
```json
{
  "success": false,
  "message": "Failed to delete account"
}
```

---

## Implementation Requirements

### 1. Data to Delete

The endpoint must permanently delete:

**User Account:**
- User record from `users` table
- Email, password hash, and all profile data

**Prayer Data:**
- All prayer requests created by the user
- All prayer responses/replies by the user
- Prayer statistics

**Study Groups:**
- Remove user from all groups they've joined
- Delete groups they created (or reassign ownership)
- Delete join requests

**Chat History:**
- All AI chat conversations
- Chat messages and history

**Activity Data:**
- App usage tracking
- Daily activity logs
- XP and progress data

**Preferences:**
- Bible version preferences
- Notification settings
- Voice preferences

**Calendar Integration:**
- Revoke Google Calendar tokens
- Remove calendar permissions

**Other Data:**
- Referral sources
- Profile pictures
- Any cached data

### 2. Data Handling Options

**Option A: Hard Delete (Recommended for GDPR)**
```javascript
// Permanently delete all data
await db.query('DELETE FROM prayer_requests WHERE user_id = ?', [userId]);
await db.query('DELETE FROM study_group_participants WHERE user_id = ?', [userId]);
await db.query('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
// ... delete all related data
await db.query('DELETE FROM users WHERE id = ?', [userId]);
```

**Option B: Anonymize Some Data**
```javascript
// Keep some data for integrity but anonymize it
await db.query('UPDATE prayer_requests SET user_id = NULL, name = "Deleted User" WHERE user_id = ?', [userId]);
await db.query('DELETE FROM users WHERE id = ?', [userId]);
```

**Recommended:** Use Option A (hard delete) for better GDPR compliance.

### 3. Transaction Handling

Use database transactions to ensure all-or-nothing deletion:

```javascript
router.delete('/account', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Delete all related data in order
    await connection.query('DELETE FROM prayer_responses WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM prayer_requests WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM study_group_participants WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM study_groups WHERE creator_id = ?', [userId]);
    await connection.query('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM app_sessions WHERE user_id = ?', [userId]);
    await connection.query('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    
    // Finally, delete the user
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    
    await connection.commit();
    
    console.log(`✅ Account deleted for user ID: ${userId}`);
    res.json({ success: true, message: 'Account deleted successfully' });
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error deleting account:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  } finally {
    connection.release();
  }
});
```

### 4. Logging

Log account deletions for audit purposes:

```javascript
// Before deleting, log the deletion
await connection.query(
  'INSERT INTO audit_log (action, user_id, user_email, timestamp) VALUES (?, ?, ?, NOW())',
  ['account_deletion', userId, user.email]
);
```

### 5. Google Calendar Token Revocation

Before deleting, revoke Google Calendar tokens:

```javascript
// Revoke Google access token
const tokens = await getGoogleCalendarTokens(userId);
if (tokens && tokens.access_token) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
      method: 'POST'
    });
    console.log('✅ Google Calendar access revoked');
  } catch (error) {
    console.error('⚠️ Failed to revoke Google token:', error);
    // Continue with deletion anyway
  }
}
```

---

## Security Considerations

### 1. Re-authentication (Optional but Recommended)

For extra security, require the user to re-enter their password:

```javascript
{
  "password": "user_password"
}
```

```javascript
router.delete('/account', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;
  
  // Verify password
  const user = await getUserById(userId);
  const validPassword = await bcrypt.compare(password, user.password);
  
  if (!validPassword) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid password' 
    });
  }
  
  // Proceed with deletion...
});
```

### 2. Rate Limiting

Add rate limiting to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts per hour
  message: 'Too many deletion attempts, please try again later'
});

router.delete('/account', deleteAccountLimiter, authenticateToken, async (req, res) => {
  // ...
});
```

### 3. Email Confirmation (Optional)

Send a confirmation email before deletion:

```javascript
// Send email with confirmation link
const confirmationToken = generateToken();
await sendEmail(user.email, 'Confirm Account Deletion', {
  confirmUrl: `${FRONTEND_URL}/confirm-delete?token=${confirmationToken}`
});

res.json({ 
  success: true, 
  message: 'Confirmation email sent. Please check your email to confirm deletion.' 
});
```

---

## Testing the Endpoint

### Test 1: Successful Deletion
```bash
curl -X DELETE https://faithfulcompanion.ai/api/users/account \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json"
```

Expected: 200 OK, account deleted, all data removed

### Test 2: Unauthorized Access
```bash
curl -X DELETE https://faithfulcompanion.ai/api/users/account \
  -H "Content-Type: application/json"
```

Expected: 401 Unauthorized

### Test 3: Data Verification
After deletion, verify:
```sql
SELECT COUNT(*) FROM users WHERE id = <deleted_user_id>;
-- Should return 0

SELECT COUNT(*) FROM prayer_requests WHERE user_id = <deleted_user_id>;
-- Should return 0

SELECT COUNT(*) FROM study_group_participants WHERE user_id = <deleted_user_id>;
-- Should return 0
```

---

## Database Tables to Update

Based on your schema, update these tables:

1. `users` - Main user record
2. `prayer_requests` - User's prayers
3. `prayer_responses` - User's prayer replies
4. `study_groups` - Groups created by user
5. `study_group_participants` - User's group memberships
6. `study_group_join_requests` - User's join requests
7. `chat_messages` - AI chat history
8. `user_preferences` - User settings
9. `app_sessions` - Session tracking
10. `google_calendar_tokens` - Calendar integration
11. `daily_activities` - Activity logs
12. `prayer_notes` - Prayer journal entries

---

## Implementation Checklist

- [ ] Create DELETE /api/users/account endpoint
- [ ] Add authentication middleware
- [ ] Implement transaction for safe deletion
- [ ] Delete user data from all related tables
- [ ] Revoke Google Calendar tokens (if applicable)
- [ ] Log deletion for audit trail
- [ ] Add rate limiting
- [ ] Test successful deletion
- [ ] Test unauthorized access
- [ ] Verify all data is deleted
- [ ] Update API documentation

---

## Example Full Implementation

```javascript
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiter for account deletion
const deleteAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts
  message: 'Too many deletion attempts, please try again later'
});

/**
 * DELETE /api/users/account
 * Permanently delete user account and all associated data
 */
router.delete('/account', deleteAccountLimiter, authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const userEmail = req.user.email;
  const connection = await db.getConnection();
  
  try {
    console.log(`🗑️ Starting account deletion for user ID: ${userId}`);
    
    await connection.beginTransaction();
    
    // 1. Revoke Google Calendar access (if exists)
    const [calendarTokens] = await connection.query(
      'SELECT access_token FROM google_calendar_tokens WHERE user_id = ?',
      [userId]
    );
    
    if (calendarTokens.length > 0 && calendarTokens[0].access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${calendarTokens[0].access_token}`, {
          method: 'POST'
        });
        console.log('✅ Google Calendar access revoked');
      } catch (error) {
        console.error('⚠️ Failed to revoke Google token:', error);
        // Continue with deletion anyway
      }
    }
    
    // 2. Delete all related data (in order of foreign key dependencies)
    await connection.query('DELETE FROM prayer_responses WHERE user_id = ?', [userId]);
    console.log('✅ Deleted prayer responses');
    
    await connection.query('DELETE FROM prayer_requests WHERE user_id = ?', [userId]);
    console.log('✅ Deleted prayer requests');
    
    await connection.query('DELETE FROM study_group_participants WHERE user_id = ?', [userId]);
    console.log('✅ Deleted study group participations');
    
    await connection.query('DELETE FROM study_group_join_requests WHERE user_id = ?', [userId]);
    console.log('✅ Deleted join requests');
    
    // Delete or reassign study groups (choose one approach)
    await connection.query('DELETE FROM study_groups WHERE creator_id = ?', [userId]);
    console.log('✅ Deleted created study groups');
    
    await connection.query('DELETE FROM chat_messages WHERE user_id = ?', [userId]);
    console.log('✅ Deleted chat messages');
    
    await connection.query('DELETE FROM user_preferences WHERE user_id = ?', [userId]);
    console.log('✅ Deleted user preferences');
    
    await connection.query('DELETE FROM app_sessions WHERE user_id = ?', [userId]);
    console.log('✅ Deleted app sessions');
    
    await connection.query('DELETE FROM daily_activities WHERE user_id = ?', [userId]);
    console.log('✅ Deleted daily activities');
    
    await connection.query('DELETE FROM google_calendar_tokens WHERE user_id = ?', [userId]);
    console.log('✅ Deleted Google Calendar tokens');
    
    // 3. Log the deletion for audit purposes
    await connection.query(
      'INSERT INTO audit_log (action, user_id, user_email, timestamp) VALUES (?, ?, ?, NOW())',
      ['account_deletion', userId, userEmail]
    );
    
    // 4. Finally, delete the user account
    await connection.query('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✅ Deleted user account');
    
    // Commit transaction
    await connection.commit();
    
    console.log(`✅ Account deletion completed for user ID: ${userId}`);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
    
  } catch (error) {
    // Rollback on error
    await connection.rollback();
    console.error('❌ Error deleting account:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete account. Please try again or contact support.'
    });
  } finally {
    connection.release();
  }
});

module.exports = router;
```

---

## Audit Log Table (If Not Exists)

Create an audit log table to track deletions:

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(50) NOT NULL,
  user_id INT,
  user_email VARCHAR(255),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_action (action),
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp)
);
```

---

## Final Notes

1. **Test thoroughly** before deploying to production
2. **Backup database** before implementing
3. **Monitor logs** after deployment for any issues
4. **Consider soft delete** for first 30 days (optional)
5. **Update privacy policy** to reflect 30-day deletion timeline

---

## Questions?

If you have any questions about this implementation, please ask!

**Priority:** HIGH - Required for Play Store compliance
**Estimated Time:** 2-4 hours
**Complexity:** Medium

---

Last Updated: January 26, 2026
