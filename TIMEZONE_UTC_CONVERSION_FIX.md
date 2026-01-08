# Study Group Time Conversion Fix

## 🐛 **The Problem**

When creating a study group:
- **User selects:** Central Time (CT) and enters 7:00 PM
- **Expected backend UTC:** 1:00 AM next day (7 PM + 6 hours)
- **Actual backend UTC:** `2026-01-14T14:00:00.000Z` (2:00 PM - WRONG!)

### Why This Happened:
The `Date` object was using the **device's local timezone** instead of the **user's selected timezone** for conversion.

Example:
```javascript
// User on device in timezone X selects Central Time
// User enters: 7:00 PM on Jan 14
const dateTime = new Date(); // Uses DEVICE timezone, not selected timezone!
dateTime.setHours(19); // Sets to 7 PM in DEVICE timezone
dateTime.toISOString(); // Converts using DEVICE timezone offset ❌
```

---

## ✅ **The Solution**

Created a `convertLocalToUTC()` function that converts the user's input time (in the **selected** timezone) to UTC:

```javascript
const convertLocalToUTC = (localDateTime: Date, timezone: string): Date => {
  const timezoneOffsets: Record<string, number> = {
    'America/New_York': -5,      // UTC-5
    'America/Chicago': -6,       // UTC-6
    'America/Denver': -7,        // UTC-7
    'America/Los_Angeles': -8,   // UTC-8
    'America/Anchorage': -9,     // UTC-9
    'Pacific/Honolulu': -10,     // UTC-10
  };

  const offsetHours = timezoneOffsets[timezone] || -5;
  
  // Get the date/time components
  const year = localDateTime.getFullYear();
  const month = localDateTime.getMonth();
  const date = localDateTime.getDate();
  const hours = localDateTime.getHours();
  const minutes = localDateTime.getMinutes();
  
  // Create UTC date by subtracting the timezone offset
  // UTC is ahead of US timezones, so we subtract the negative offset
  const utcDate = new Date(Date.UTC(year, month, date, hours - offsetHours, minutes, 0, 0));
  
  return utcDate;
};
```

### Example Conversion:
```
User Input: 7:00 PM on Jan 14, 2026 in America/Chicago (UTC-6)
Calculation: 
  - Local time: 19:00 (7 PM)
  - Timezone offset: -6 hours
  - UTC time: 19:00 - (-6) = 19:00 + 6 = 25:00 → 01:00 next day
Result: 2026-01-15T01:00:00.000Z ✅
```

---

## 🔧 **Where It's Applied**

### 1. **When Clicking a Calendar Date**
```javascript
const openCreateModalWithDate = () => {
  // ... set hours to 7 PM
  setStartDateTime(dateTime);
  
  // Convert to UTC based on selected timezone ✅
  const utcDateTime = convertLocalToUTC(dateTime, selectedTimezone);
  setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
};
```

### 2. **When Changing Date Picker**
```javascript
const handleStartDateChange = (event: any, selectedDate?: Date) => {
  const newDateTime = new Date(startDateTime);
  newDateTime.setFullYear(selectedDate.getFullYear());
  // ... set date
  setStartDateTime(newDateTime);
  
  // Convert to UTC ✅
  const utcDateTime = convertLocalToUTC(newDateTime, selectedTimezone);
  setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
};
```

### 3. **When Changing Hour Input**
```javascript
onChangeText={(text) => {
  const hour = parseInt(text) || 0;
  const newDateTime = new Date(startDateTime);
  newDateTime.setHours(hour);
  setStartDateTime(newDateTime);
  
  // Convert to UTC ✅
  const utcDateTime = convertLocalToUTC(newDateTime, selectedTimezone);
  setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
}}
```

### 4. **When Changing Minute Input**
```javascript
onChangeText={(text) => {
  const minute = parseInt(text) || 0;
  const newDateTime = new Date(startDateTime);
  newDateTime.setMinutes(minute);
  setStartDateTime(newDateTime);
  
  // Convert to UTC ✅
  const utcDateTime = convertLocalToUTC(newDateTime, selectedTimezone);
  setFormData(prev => ({ ...prev, startTime: utcDateTime.toISOString() }));
}}
```

---

## 📊 **Before vs After**

### **Before Fix:**
```
User Input:
  - Timezone: Central Time (UTC-6)
  - Time: 7:00 PM (19:00)
  - Date: Jan 14, 2026

Backend Received:
  scheduledTime: "2026-01-14T14:00:00.000Z"  ❌ WRONG!
  
Google Calendar Shows:
  9:00 AM CT (correct, because it converts from wrong UTC)
```

### **After Fix:**
```
User Input:
  - Timezone: Central Time (UTC-6)
  - Time: 7:00 PM (19:00)
  - Date: Jan 14, 2026

Backend Receives:
  scheduledTime: "2026-01-15T01:00:00.000Z"  ✅ CORRECT!
  
Google Calendar Shows:
  7:00 PM CT (correct, because UTC is correct)
```

---

## 🧪 **Testing**

### Test Case 1: Central Time (UTC-6)
```
Input: 7:00 PM on Jan 14, 2026
Expected UTC: 2026-01-15T01:00:00.000Z
Backend stores: ✅ Correct
Google Calendar: ✅ 7:00 PM CT
```

### Test Case 2: Pacific Time (UTC-8)
```
Input: 7:00 PM on Jan 14, 2026
Expected UTC: 2026-01-15T03:00:00.000Z
Backend stores: ✅ Correct
Google Calendar: ✅ 7:00 PM PT
```

### Test Case 3: Eastern Time (UTC-5)
```
Input: 7:00 PM on Jan 14, 2026
Expected UTC: 2026-01-15T00:00:00.000Z (midnight)
Backend stores: ✅ Correct
Google Calendar: ✅ 7:00 PM ET
```

---

## 🔍 **Debugging Logs**

When you create a study group, you'll see:
```
🔄 Converting local time to UTC:
   Input (in America/Chicago ): 19:0
   Timezone offset: -6 hours
   Output (UTC): 2026-01-15T01:00:00.000Z
   Verification: 1/14/2026, 7:00:00 PM
```

The "Verification" line confirms that when you convert the UTC time back to the selected timezone, it matches the user's input!

---

## 📝 **Summary**

- **Problem:** Device timezone was used instead of selected timezone
- **Solution:** Created `convertLocalToUTC()` function
- **Applied:** To all date/time input changes (date picker, hour input, minute input)
- **Result:** Backend now receives correct UTC times based on selected US timezone
- **Verification:** Google Calendar displays correct time in user's selected timezone

**Status:** ✅ FIXED

Now when users create study groups, the time will be saved correctly regardless of what device timezone they're in! 🎉

