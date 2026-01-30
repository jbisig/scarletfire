# Scarlet>fire - Production Build Setup Guide

This guide walks you through setting up and building the Scarlet>fire app for production release on iOS and Android.

## Prerequisites

Before you begin, ensure you have:

### Required Accounts:
- [ ] Expo account (free) - Create at https://expo.dev
- [ ] Apple Developer account ($99/year) - Required for iOS App Store
- [ ] Google Play Developer account ($25 one-time) - Required for Android Play Store

### Required Software:
- [ ] Node.js installed (you have this ✓)
- [ ] Git installed (you have this ✓)
- [ ] EAS CLI (will install in step 1)

## Step 1: Install EAS CLI

Install the Expo Application Services CLI globally:

```bash
npm install -g eas-cli
```

**Note**: If you get a permission error, use:
```bash
sudo npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

## Step 2: Login to Expo

Log in to your Expo account (create one at expo.dev if needed):

```bash
eas login
```

This will prompt for your Expo username and password.

## Step 3: Initialize EAS in Your Project

Navigate to the project directory (you're already there):

```bash
cd ~/projects/grateful-dead-player
```

Initialize EAS:

```bash
eas init
```

This will:
- Create or link an Expo project
- Add a project ID to your app.json
- Set up your project for builds

## Step 4: Configure EAS Build

Run:

```bash
eas build:configure
```

This command will:
- Detect that `eas.json` already exists ✓
- Validate the configuration
- Set up build profiles

You should see confirmation that the configuration is valid.

## Step 5: Create App Icons

Before building, you need proper app icons. See `ICON_GUIDE.md` for detailed instructions.

**Quick options:**
1. Use an online tool like icon.kitchen or appicon.co
2. Create simple icons in Canva or Figma
3. Keep placeholder icons for now (can update later)

**Required files:**
- `assets/icon.png` (1024×1024) ✓ (placeholder exists)
- `assets/splash.png` (large image) ✓ (placeholder exists)
- `assets/adaptive-icon.png` (1024×1024) ✓ (placeholder exists)

## Step 6: Host Privacy Policy

The privacy policy has been created at `PRIVACY_POLICY.md`. You need to host it publicly:

### Option A: GitHub Pages (Recommended, Free)

1. Create a new GitHub repository (or use existing)
2. Push your project to GitHub:
   ```bash
   git remote add origin https://github.com/[username]/scarletfire.git
   git push -u origin main
   ```
3. Go to repository Settings > Pages
4. Enable GitHub Pages (select main branch)
5. Your privacy policy will be at:
   `https://[username].github.io/scarletfire/PRIVACY_POLICY.md`

### Option B: Convert to HTML and Host

1. Convert markdown to HTML
2. Upload to any web server
3. Get the public URL

### Update app.json

After hosting, add to your `app.json`:

```json
"ios": {
  ...
  "privacyManifestPath": "https://your-url.com/privacy-policy"
}
```

## Step 7: Test Locally

Before building for production, test the app:

```bash
npm start
```

Or:
```bash
npx expo start
```

Test on:
- iOS Simulator (press 'i')
- Android Emulator (press 'a')
- Physical device (scan QR code with Expo Go)

Verify:
- [ ] App launches without errors
- [ ] All features work correctly
- [ ] Audio streaming works
- [ ] Favorites save/load properly

## Step 8: Create Preview Builds (Recommended)

Before production builds, create preview builds for testing:

### iOS Preview (TestFlight):
```bash
npm run build:ios:preview
```
Or:
```bash
eas build --platform ios --profile preview
```

### Android Preview (APK):
```bash
npm run build:android:preview
```
Or:
```bash
eas build --platform android --profile preview
```

**What happens:**
1. EAS uploads your code to their servers
2. Builds happen in the cloud (takes 10-20 minutes)
3. You get a download link when complete
4. Install on your device and test thoroughly

## Step 9: Create Production Builds

Once preview builds are tested and working:

### iOS Production (App Store):
```bash
npm run build:ios:production
```
Or:
```bash
eas build --platform ios --profile production
```

### Android Production (Play Store):
```bash
npm run build:android:production
```
Or:
```bash
eas build --platform android --profile production
```

### Both Platforms:
```bash
npm run build:all:production
```
Or:
```bash
eas build --platform all --profile production
```

**First time setup:**
- **iOS**: EAS will prompt to create Apple credentials or use existing ones
- **Android**: EAS will create a new keystore or use existing one

## Step 10: Submit to App Stores

### iOS App Store

1. **Automated submission:**
   ```bash
   npm run submit:ios
   ```
   Or:
   ```bash
   eas submit --platform ios
   ```

2. **Manual submission:**
   - Download the .ipa file from EAS build
   - Go to App Store Connect (appstoreconnect.apple.com)
   - Create new app listing
   - Upload build using Transporter app or Xcode

3. **Fill out App Store Connect:**
   - App name: Scarlet>fire
   - Subtitle: Grateful Dead Concerts
   - Description: Stream Grateful Dead concerts from the Internet Archive
   - Keywords: grateful dead, live music, concerts, archive, streaming
   - Category: Music
   - Screenshots: Required (6.7" and 5.5" devices)
   - Privacy policy URL: [Your hosted URL]

4. **Submit for review**

### Android Play Store

1. **Automated submission:**
   ```bash
   npm run submit:android
   ```
   Or:
   ```bash
   eas submit --platform android
   ```

2. **Manual submission:**
   - Download the .aab file from EAS build
   - Go to Google Play Console (play.google.com/console)
   - Create new app listing
   - Upload AAB file

3. **Fill out Play Console:**
   - App name: Scarlet>fire
   - Short description: Stream thousands of Grateful Dead concerts from the Internet Archive
   - Full description: [Detailed features]
   - Category: Music & Audio
   - Screenshots: Required (Phone and Tablet)
   - Feature graphic: 1024×500px
   - Privacy policy URL: [Your hosted URL]

4. **Create release and submit**

## Troubleshooting

### Common Issues:

**"eas: command not found"**
- EAS CLI not installed or not in PATH
- Run: `sudo npm install -g eas-cli`

**"Not logged in"**
- Run: `eas login`

**"Missing credentials"**
- For iOS: EAS will guide you through Apple Developer setup
- For Android: EAS creates keystore automatically

**"Build failed"**
- Check build logs at the URL provided
- Common issues: syntax errors in app.json, missing dependencies

**"App.json validation failed"**
- Check for JSON syntax errors
- Ensure all required fields are present

## Build Status and Logs

Track your builds:
- Web dashboard: https://expo.dev/accounts/[username]/projects/scarletfire/builds
- CLI: `eas build:list`
- Specific build: `eas build:view [build-id]`

## App Store Review Timeline

**iOS (Apple)**:
- Initial review: 1-3 days typically
- Resubmissions: 24-48 hours
- Can expedite in emergencies (limited)

**Android (Google)**:
- Initial review: Few hours to 2 days
- Resubmissions: Few hours
- Generally faster than Apple

## Post-Release

After approval:
- Monitor user reviews
- Track crash reports
- Plan updates

## OTA Updates

For JavaScript/asset updates without store review:

```bash
eas update
```

This publishes over-the-air updates for:
- Bug fixes
- UI changes
- Content updates

Native changes still require store review.

## Cost Summary

- EAS Build: Free for limited builds, paid plans for more
- Apple Developer: $99/year
- Google Play Developer: $25 one-time
- Total first year: ~$125 + optional EAS subscription

## Support and Resources

- EAS documentation: https://docs.expo.dev/eas/
- Expo forums: https://forums.expo.dev/
- Build troubleshooting: https://docs.expo.dev/build-reference/troubleshooting/
- App Store guidelines: https://developer.apple.com/app-store/review/guidelines/
- Play Store guidelines: https://support.google.com/googleplay/android-developer/

## Quick Reference Commands

```bash
# Development
npm start                       # Start development server

# Building
npm run build:ios:preview       # iOS preview build
npm run build:android:preview   # Android preview build
npm run build:all:production    # Production builds for both platforms

# Submitting
npm run submit:ios             # Submit to App Store
npm run submit:android         # Submit to Play Store

# EAS Commands
eas login                      # Login to Expo
eas build:list                 # List all builds
eas build:view [id]            # View specific build
eas update                     # Publish OTA update
```

## Current Status

✅ Configuration completed:
- app.json updated with production metadata
- eas.json created with build profiles
- package.json updated with build scripts
- Privacy policy created
- Bundle identifier updated to com.scarletfire.app

⏳ Remaining tasks:
- Install EAS CLI (Step 1)
- Login to Expo (Step 2)
- Initialize EAS project (Step 3)
- Create/update app icons (Step 5)
- Host privacy policy (Step 6)
- Test and build (Steps 7-10)

## Next Steps

Start with Step 1 (Install EAS CLI) and follow this guide sequentially. Each step builds on the previous one.

Good luck with your app launch! 🚀🎸
