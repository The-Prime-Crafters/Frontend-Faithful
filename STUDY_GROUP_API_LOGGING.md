# Study Group API Logging Documentation

## Overview
Added comprehensive logging for study group creation and fetching operations to help debug timezone handling and API responses.

---

## 🔍 What's Logged

### 1. **Creating a Study Group**

When a user creates a study group, you'll see:

```
🚀 STARTING STUDY GROUP CREATION
📋 Group Type: ONE-TIME (or RECURRING)
📋 Current Form Data: { ... }
👤 User Email: user@example.com
📧 Processed Attendee Emails: [...]
🌍 User selected timezone: America/New_York

🔄 CREATING ONE-TIME STUDY GROUP
📡 API Endpoint: https://faithfulcompanion.ai/api/study-groups/create
📤 Request Headers:
   - Authorization: Bearer xxx...
   - Content-Type: application/json
   - x-timezone: America/New_York
📤 Request Body (One-time): {
  "title": "...",
  "description": "...",
  "maxParticipants": 10,
  "durationMinutes": 60,
  "scheduledTime": "2025-01-04T00:00:00.000Z",
  "attendeeEmails": [...]
}
🕐 TIME DEBUGGING:
🕐 scheduledTime (UTC): 2025-01-04T00:00:00.000Z
🕐 scheduledTime (Local): 1/3/2025, 7:00:00 PM
🕐 User timezone: America/New_York

📥 Response Status: 200 OK
📥 Response Headers: { ... }

═══════════════════════════════════════════════════════════
✅ CREATE STUDY GROUP SUCCESS
═══════════════════════════════════════════════════════════
📦 Full Response Body: { ... }

📊 Response Structure:
   - success: true
   - message: "Study group created successfully"

📋 Created Group Data:
   - id: 123
   - title: "My Study Group"
   - description: "..."
   - maxParticipants: 10
   - durationMinutes: 60
   - isRecurring: false

🕐 TIME FIELDS (from API response):
   - startTime: undefined
   - scheduledTime: undefined
   - scheduled_time: "2025-01-04T00:00:00.000Z"
   - scheduledTimeLocal: undefined
   - scheduled_time_local: "01/03/2025, 07:00 PM"
   - createdAt: undefined
   - created_at: "2025-01-03T19:00:00.000Z"
   - createdAtLocal: undefined
   - created_at_local: "01/03/2025, 07:00 PM"

🔗 Meeting Info:
   - meetLink: "https://meet.google.com/..."
   - meetId: "xxx-yyyy-zzz"
   - theme: null

🌍 Timezone Info:
   - timezone: "America/New_York"

🔁 Recurrence Info (if recurring):
   - frequency: undefined
   - interval: undefined
   - daysOfWeek: undefined
   - endDate: undefined
   - endDateLocal: undefined

👥 Attendees:
   - attendeeEmails: ["user@example.com"]
═══════════════════════════════════════════════════════════

📦 Normalized Group Object: { ... }
```

### 2. **Fetching Study Groups**

When loading study groups:

```
═══════════════════════════════════════════════════════════
🔄 FETCHING STUDY GROUPS FROM API
═══════════════════════════════════════════════════════════
🌍 User timezone for fetch: America/New_York
📡 API Endpoint: https://faithfulcompanion.ai/api/study-groups
📤 Request Headers:
   - Authorization: Bearer xxx...
   - Content-Type: application/json
   - x-timezone: America/New_York

📥 Response Status: 200 OK
📥 Response Headers: { ... }

✅ STUDY GROUPS FETCH SUCCESS
📦 Full Response Body: { ... }
📊 Response Structure:
   - success: true
   - message: "Study groups retrieved successfully"
   - data.groups length: 3

───────────────────────────────────────────────────────────
🔍 PROCESSING EACH GROUP:
───────────────────────────────────────────────────────────

📋 GROUP #1:
─────────────────────────────────────────────────────────
🆔 ID: 123
📝 Title: My Study Group
📄 Description: Let's study together
👥 Max Participants: 10
⏱️ Duration: 60 minutes
🔄 Is Recurring: false
🌍 Timezone: America/New_York

🕐 TIME FIELDS (Raw from API):
   - scheduled_time (UTC): 2025-01-04T00:00:00.000Z
   - scheduled_time_local: 01/03/2025, 07:00 PM
   - next_occurrence (UTC): null
   - next_occurrence_local: null
   - created_at: 2025-01-03T19:00:00.000Z
   - created_at_local: 01/03/2025, 07:00 PM

👤 USER INFO:
   - user_role: admin
   - creator_name: John Doe
   - creator_email: john@example.com
   - current_members: 1
   - is_active: true
   - requires_approval: false

🔗 MEETING INFO:
   - meet_link: https://meet.google.com/...
   - meet_id: xxx-yyyy-zzz
   - theme: null

🔁 RECURRENCE INFO:
   - recurrence_pattern: null
   - recurrence_interval: null
   - recurrence_days_of_week: null
   - recurrence_end_date: null
   - recurrence_end_date_local: null

✅ MAPPED GROUP RESULT:
   - startTime (will use for display): 2025-01-04T00:00:00.000Z
   - startTimeLocal (preferred): 01/03/2025, 07:00 PM
   - timezone: America/New_York
─────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════
✅ FETCH COMPLETE: Loaded 3 study groups
═══════════════════════════════════════════════════════════
```

---

## ❌ Error Logging

### Create Error:
```
═══════════════════════════════════════════════════════════
❌ CREATE STUDY GROUP ERROR
═══════════════════════════════════════════════════════════
📥 Error Status: 400 Bad Request
📥 Error Headers: { ... }
📥 Error Body (raw): {"success":false,"message":"Invalid timezone"}
📥 Error Body (parsed): {
  "success": false,
  "message": "Invalid timezone",
  "details": "..."
}
📥 Error Message: Invalid timezone
📥 Error Details: ...
═══════════════════════════════════════════════════════════
```

### Fetch Error:
```
═══════════════════════════════════════════════════════════
❌ FETCH FAILED
📥 Status: 401 Unauthorized
📥 Error Body: {"message":"Authentication required"}
═══════════════════════════════════════════════════════════
```

---

## 🎯 What to Look For

### ✅ **Backend is Working Correctly** if you see:
1. **Create Response includes:**
   - `scheduled_time` (UTC) AND `scheduled_time_local` (formatted)
   - `timezone` field matches what was sent in `x-timezone` header
   - `meet_link` is present

2. **Fetch Response includes:**
   - Each group has `scheduled_time_local` OR `next_occurrence_local`
   - `timezone` field is present
   - Times are formatted correctly for the user's timezone

### ⚠️ **Backend Needs Updates** if you see:
1. **Missing Fields:**
   - `scheduled_time_local` is `undefined` or `null`
   - `timezone` is `undefined` or `null`
   - Only UTC times, no local formatted times

2. **Wrong Times:**
   - `scheduled_time_local` doesn't match expected timezone
   - Times are off by hours (timezone conversion issue)

3. **Errors:**
   - `400` errors about timezone
   - Missing `x-timezone` header error

---

## 🔧 How to Use These Logs

### Step 1: Create a Study Group
1. Select a timezone (e.g., Pacific Time)
2. Set a time (e.g., 7:00 PM)
3. Create the group
4. **Check the logs:**
   - Does `x-timezone` header show `America/Los_Angeles`?
   - Is `scheduledTime` sent as UTC ISO string?
   - Does response include `scheduled_time_local`?
   - Does response include `timezone: "America/Los_Angeles"`?

### Step 2: Fetch Study Groups
1. Reload the app or navigate to study groups
2. **Check the logs:**
   - Are groups returned with `scheduled_time_local`?
   - Do the local times match the timezone?
   - Is each group showing the correct time?

### Step 3: Debug Issues
- If times are wrong, compare:
  - `scheduled_time` (should be UTC)
  - `scheduled_time_local` (should be in creator's timezone)
  - `timezone` (should match creator's selection)
- Copy the full logs and send to backend team for debugging

---

## 📱 Finding Logs

### React Native Debugger:
1. Open React Native Debugger
2. Check the Console tab
3. Look for the colored emoji sections (🔄, ✅, ❌)

### Metro Bundler:
1. Check the terminal where Metro is running
2. Logs will appear in the console

### Expo Go:
1. Shake device → Open Debug Menu → Remote JS Debugging
2. Check browser console

---

## 🚀 Next Steps

Once you see the logs:
1. **Take a screenshot** of the full create/fetch log cycle
2. **Share with backend team** if issues are found
3. **Verify** the `x-timezone` header is being read
4. **Confirm** backend is returning `scheduled_time_local` field
5. **Test** with different timezones to ensure conversions work

The logs now show **everything** the backend sends and receives! 🎉

