# Splash Screen Setup Guide

## Overview
The app now includes a splash screen with video support. The splash screen will play your video and then automatically navigate to the main app.

## Setup Instructions

### 1. Add Your Video File
Place your splash screen video file in the following location:
```
assets/videos/splash-video.mp4
```

### 2. Video Requirements
- **Format**: MP4 (recommended)
- **Duration**: 3-5 seconds (optimal)
- **Size**: Keep under 10MB for better performance
- **Resolution**: 1080p or lower for mobile optimization

### 3. How It Works
- The splash screen automatically plays when the app starts
- Video plays once and then navigates to the main app
- If video fails to load, it shows a fallback screen with app name
- 5-second timeout ensures the app doesn't get stuck

### 4. Customization
You can modify the splash screen by editing `app/splash.tsx`:

- **Colors**: Change `PRIMARY_COLOR` and `SECONDARY_COLOR`
- **Timeout**: Adjust the timeout duration (currently 5000ms)
- **Fallback Text**: Modify the text shown if video doesn't load
- **Video Settings**: Change video properties like looping, muting, etc.

### 5. Navigation Flow
```
Splash Screen → Main App (index.tsx) → Other Screens
```

### 6. Testing
To test the splash screen:
1. Add your video file to `assets/videos/splash-video.mp4`
2. Run the app: `npm start`
3. The splash screen should appear first, then navigate to the main app

## Troubleshooting

### Video Not Playing
- Check if the video file exists in the correct location
- Ensure the video format is supported (MP4 recommended)
- Check console for any error messages

### App Stuck on Splash
- The 5-second timeout should prevent this
- If it happens, check the video file for corruption
- Try with a different video file

### Performance Issues
- Reduce video file size
- Lower video resolution
- Consider using a shorter video duration 