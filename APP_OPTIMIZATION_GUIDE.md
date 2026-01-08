# App Optimization Guide

## ✅ Completed Fixes

### 1. **Error Boundaries** ✓
- Created `ErrorBoundary` component to catch and handle React errors gracefully
- Wrapped root app in ErrorBoundary to prevent full app crashes
- Shows user-friendly error messages with retry functionality
- Logs errors for debugging (in dev mode shows error details)

**Location**: `components/ErrorBoundary.tsx`

### 2. **Memory Leak Fixes** ✓
- Added proper cleanup for all timers, intervals, and event listeners
- Added `isMounted` ref to prevent state updates on unmounted components
- Properly clear timeouts in `app/_layout.tsx`
- Added cleanup for TTS, timers, and AbortController in `index.tsx`

**Files Fixed**:
- `app/_layout.tsx` - Fixed timeout leaks, added isMounted checks
- `app/(tabs)/index.tsx` - Added proper cleanup for card timers

### 3. **Safe JSON Parsing** ✓
- Created `safeJson.ts` utility to prevent JSON.parse crashes
- Replaced all unsafe `JSON.parse()` calls with `safeJsonParse()`
- Added fallback values and error logging

**Files Updated**:
- `utils/safeJson.ts` - New utility
- `app/(tabs)/index.tsx` - 7 instances fixed
- `app/(tabs)/chat.tsx` - 4 instances fixed  
- `app/(tabs)/prayer.tsx` - 3 instances fixed
- `app/(tabs)/profile.tsx` - 4 instances fixed

## 🔧 Recommended Next Steps

### 4. **Optimize Re-renders**
**Problem**: Components re-render unnecessarily, causing performance issues

**Solution**:
```typescript
// Wrap expensive calculations in useMemo
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Wrap callback functions in useCallback
const handlePress = useCallback(() => {
  doSomething(param);
}, [param]);
```

**Priority Files**:
- `app/(tabs)/index.tsx` (3929 lines - CRITICAL)
- `app/(tabs)/prayer.tsx`
- `app/(tabs)/chat.tsx`

### 5. **Fix Race Conditions**
**Problem**: Multiple API calls can happen simultaneously, causing conflicts

**Solution**:
```typescript
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  // Cancel previous request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // Create new controller
  abortControllerRef.current = new AbortController();
  
  fetchData(abortControllerRef.current.signal);
  
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, [dependency]);
```

### 6. **Add Request Cancellation**
**Problem**: API requests continue even when component unmounts

**Solution**: Use AbortController for all fetch requests
```typescript
const response = await fetch(url, {
  signal: abortController.signal,
  // ... other options
});
```

### 7. **Fix Concurrent State Updates**
**Problem**: Multiple setState calls can cause race conditions

**Solution**:
```typescript
// Use functional updates when state depends on previous state
setState(prevState => ({
  ...prevState,
  newValue: value
}));

// Batch multiple updates
import { unstable_batchedUpdates } from 'react-native';

unstable_batchedUpdates(() => {
  setState1(value1);
  setState2(value2);
  setState3(value3);
});
```

### 8. **Refactor index.tsx**
**Problem**: File is 3929 lines - way too large!

**Solution**: Break into smaller components:
- Extract card components → `components/DailyCard.tsx`
- Extract modals → `components/modals/`
- Extract hooks → `hooks/useDailyContent.ts`
- Extract API calls → `utils/api/`

**Recommended Structure**:
```
components/
  home/
    DailyCard.tsx
    StatsCard.tsx
    PrayerStories.tsx
  modals/
    ReadModal.tsx
    TTSModal.tsx
    ViewMoreModal.tsx
hooks/
  useDailyVerse.ts
  useDailyPrayer.ts
  useDailyReflection.ts
utils/
  api/
    dailyContent.ts
    prayerStories.ts
```

## 🎯 Best Practices Going Forward

### 1. Always Use Safe JSON Parsing
```typescript
import { safeJsonParse } from '@/utils/safeJson';

// ❌ Bad
const data = JSON.parse(jsonString);

// ✅ Good
const data = safeJsonParse(jsonString, defaultValue);
```

### 2. Always Cleanup Effects
```typescript
useEffect(() => {
  const timer = setTimeout(() => {}, 1000);
  const subscription = someAPI.subscribe();
  
  return () => {
    clearTimeout(timer);
    subscription.unsubscribe();
  };
}, []);
```

### 3. Check isMounted Before setState
```typescript
const isMounted = useRef(true);

useEffect(() => {
  fetchData().then(data => {
    if (isMounted.current) {
      setData(data);
    }
  });
  
  return () => {
    isMounted.current = false;
  };
}, []);
```

### 4. Use AbortController for Fetch
```typescript
useEffect(() => {
  const abortController = new AbortController();
  
  fetch(url, { signal: abortController.signal })
    .then(response => response.json())
    .then(data => {
      if (isMounted.current) {
        setData(data);
      }
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    });
  
  return () => {
    abortController.abort();
  };
}, [url]);
```

### 5. Optimize Large Lists with FlatList
```typescript
<FlatList
  data={items}
  renderItem={({ item }) => <Item {...item} />}
  keyExtractor={item => item.id}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  initialNumToRender={10}
  windowSize={21}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## 📊 Performance Monitoring

### Key Metrics to Watch:
1. **App crashes** - Should be 0 with error boundaries
2. **Memory usage** - Monitor with React DevTools
3. **Re-render count** - Use React DevTools Profiler
4. **API call frequency** - Check console logs
5. **Component mount/unmount** - Watch for cleanup issues

### Tools to Use:
- React Native Debugger
- Flipper
- React DevTools Profiler
- Chrome DevTools (for memory leaks)

## 🐛 Common Crash Causes Fixed

1. **JSON.parse on malformed data** ✅ Fixed with safeJsonParse
2. **Memory leaks from timers** ✅ Fixed with proper cleanup
3. **setState on unmounted components** ✅ Fixed with isMounted refs
4. **Uncaught promise rejections** ✅ Fixed with try-catch blocks
5. **Missing error boundaries** ✅ Added ErrorBoundary component

## 📝 Testing Checklist

- [ ] App starts without crashes
- [ ] Navigation works smoothly
- [ ] No memory leaks (monitor for 5+ minutes)
- [ ] API errors don't crash the app
- [ ] JSON parse errors are handled gracefully
- [ ] All modals open/close properly
- [ ] TTS starts/stops without issues
- [ ] Background/foreground transitions work
- [ ] Deep links don't cause crashes
- [ ] Notifications don't crash the app

## 🚀 Deployment Notes

Before deploying:
1. Test on both iOS and Android
2. Test on different device sizes
3. Test with slow network conditions
4. Test with no network (offline mode)
5. Test background/foreground transitions
6. Monitor crash reports (if using crash reporting service)

---

**Last Updated**: December 2025
**Status**: Phase 1 Complete (Critical fixes done)
**Next Phase**: Performance optimization and code refactoring
