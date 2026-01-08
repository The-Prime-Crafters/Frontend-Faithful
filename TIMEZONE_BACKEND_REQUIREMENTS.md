# Backend Requirements for US Timezone Selection

## Overview
The frontend now allows users to **select a US timezone** when creating study groups, instead of auto-detecting their device timezone. This makes coordination easier for US-based users.

---

## ✅ What Frontend Sends

### 1. **Timezone Header**
The frontend sends the **user-selected timezone** in the `x-timezone` header:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'x-timezone': 'America/New_York'  // ← User's selected timezone
}
```

### 2. **Available US Timezones**
Users can select from these 6 US timezones:

| Label | IANA Timezone | UTC Offset |
|-------|---------------|------------|
| Eastern Time (ET) | `America/New_York` | UTC-5 |
| Central Time (CT) | `America/Chicago` | UTC-6 |
| Mountain Time (MT) | `America/Denver` | UTC-7 |
| Pacific Time (PT) | `America/Los_Angeles` | UTC-8 |
| Alaska Time (AKT) | `America/Anchorage` | UTC-9 |
| Hawaii Time (HT) | `Pacific/Honolulu` | UTC-10 |

### 3. **Default Timezone**
If the user doesn't change it, **Eastern Time (`America/New_York`)** is the default.

---

## ⚙️ What Backend Needs to Do

### ✅ **Already Working (No Changes Needed)**
If your backend already:
1. Accepts the `x-timezone` header ✅
2. Stores the timezone with the study group ✅
3. Returns `scheduledTimeLocal` field (formatted in user's timezone) ✅
4. Converts times correctly for display ✅

**Then you're all set!** 🎉

---

### ⚠️ **If Backend is NOT Using `x-timezone` Header**

You need to:

#### 1. **Read the `x-timezone` Header**
```javascript
// Example (Node.js/Express)
const userTimezone = req.headers['x-timezone'] || 'America/New_York'; // Default to Eastern
```

#### 2. **Store Timezone with Study Group**
Add a `timezone` field to your study groups table:
```sql
ALTER TABLE study_groups ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/New_York';
```

Store it when creating:
```javascript
const newGroup = {
  title,
  scheduled_time: scheduledTime, // UTC ISO string
  timezone: userTimezone,         // ← Store this
  // ... other fields
};
```

#### 3. **Return Formatted Times**
When sending study groups back to frontend, include both:
- `scheduled_time` (UTC, for calculations)
- `scheduledTimeLocal` (formatted in creator's timezone, for display)

Example:
```javascript
// Backend (using moment-timezone or similar)
const scheduledTimeLocal = moment.tz(group.scheduled_time, group.timezone)
  .format('MM/DD/YYYY, hh:mm A');

return {
  id: group.id,
  title: group.title,
  scheduled_time: group.scheduled_time,     // "2025-01-04T19:00:00.000Z"
  scheduledTimeLocal: scheduledTimeLocal,   // "01/04/2025, 02:00 PM" (in creator's timezone)
  timezone: group.timezone,                 // "America/New_York"
  // ... other fields
};
```

---

## 🔄 API Endpoints Affected

Both endpoints already receive the `x-timezone` header:

1. **One-time Groups:** `POST /api/study-groups/create`
2. **Recurring Groups:** `POST /api/study-groups/create-recurring`
3. **Fetch Groups:** `GET /api/study-groups/public` (for display conversions)

---

## 🧪 Testing

### Test Case 1: Create Group with Different Timezones
1. User in **New York** creates group for "7:00 PM ET"
2. Backend should store: `2025-01-04T00:00:00.000Z` (UTC)
3. Backend should return: `scheduledTimeLocal: "01/03/2025, 07:00 PM"`

### Test Case 2: User in Different Timezone Views Group
1. User in **Los Angeles** views the same group
2. Backend should convert: "01/03/2025, 04:00 PM" (PT)

---

## 📝 Summary

| Item | Frontend | Backend |
|------|----------|---------|
| **Timezone Selection** | ✅ User selects from dropdown | Accept `x-timezone` header |
| **Send Timezone** | ✅ Sends in `x-timezone` header | Read header, store with group |
| **UTC Conversion** | ✅ Sends UTC ISO strings | Store in UTC |
| **Display Conversion** | ✅ Uses `scheduledTimeLocal` from backend | Return formatted local time |

---

## 🚀 Implementation Status

- ✅ Frontend: Complete
- ⚠️ Backend: **Check if `x-timezone` is being used**
  - If YES: No changes needed
  - If NO: Implement header reading and timezone storage

---

## Questions?

If you're unsure whether your backend already handles this, check:
1. Does your backend read `req.headers['x-timezone']`?
2. Do you store the timezone with each study group?
3. Do you return `scheduledTimeLocal` formatted in the creator's timezone?

If NO to any of these, implement the changes above! 🎯

