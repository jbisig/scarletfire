# App Icon Guide for Scarlet>fire

This guide explains how to create app icons for the Scarlet>fire app that match the branding and meet app store requirements.

## Required Assets

You need to create the following assets:

1. **App Icon** (`assets/icon.png`): 1024×1024px PNG
2. **Splash Screen** (`assets/splash.png`): 1284×2778px PNG (or use icon)
3. **Android Adaptive Icon** (`assets/adaptive-icon.png`): 1024×1024px PNG

## Icon Design Guidelines

### Brand Colors
- Primary: `#ff6b6b` (coral red)
- Secondary: `#ff8c42` (orange)
- Background: `#1a1a1a` (dark gray/black)
- Text: `#ffffff` (white)

### Design Concepts

The icon should reflect:
- **Scarlet>fire** brand name (play on Grateful Dead's "Scarlet Begonias > Fire on the Mountain")
- Grateful Dead aesthetic (roses, lightning bolts, dancing bears, or psychedelic elements)
- Music/audio streaming purpose
- Clean, modern, recognizable at small sizes

### Suggested Designs

1. **Minimalist Text**: "S>F" in bold white text on gradient background (red to orange)
2. **Symbolic**: Lightning bolt or rose silhouette with gradient
3. **Abstract**: Stylized greater-than symbol (>) with flame/fire effect
4. **Retro**: Grateful Dead-inspired psychedelic design with modern twist

## Option 1: Use Online Icon Generators

### Recommended Tools:

1. **Figma** (Free): https://figma.com
   - Professional design tool
   - Export at any size
   - Templates available

2. **Canva** (Free): https://canva.com
   - Easy to use
   - Icon templates
   - Export as PNG

3. **IconKitchen**: https://icon.kitchen
   - Specifically for app icons
   - Generates all sizes
   - Simple interface

4. **AppIcon.co**: https://appicon.co
   - Upload one image
   - Generates all required sizes
   - Free to use

### Using These Tools:

1. Create a 1024×1024 design with your chosen concept
2. Export as PNG
3. Save to `assets/icon.png`
4. Copy to `assets/adaptive-icon.png`
5. For splash, either reuse the icon or create larger version

## Option 2: AI-Generated Icons

Use AI tools like DALL-E, Midjourney, or Stable Diffusion with prompts like:

```
"App icon for music streaming app called Scarlet>fire, dark background,
Grateful Dead aesthetic with roses and lightning bolt, vibrant red and
orange fire gradient, modern minimalist design, flat design, 1024x1024"
```

## Option 3: Hire a Designer

Platforms to find icon designers:
- Fiverr ($5-$50)
- 99designs ($99-$500)
- Dribbble/Behance (find freelancers)

## Option 4: Use Current Placeholder

The app currently has placeholder icons. You can:
1. Keep them for initial development/testing
2. Replace before production release
3. Use them for preview builds

## Creating Icons Yourself

### Simple Approach (No Design Skills):

1. **Use PowerPoint or Keynote**:
   - Create 1024×1024 slide
   - Add dark background
   - Add "S>F" text in white, bold font
   - Apply gradient (red to orange)
   - Export as PNG at highest quality

2. **Use Google Slides**:
   - Same as above, free and web-based
   - File > Download > PNG

### For Splash Screen:

The splash screen should be simple:
- Dark background (#1a1a1a)
- Centered logo/icon
- No text needed (app name appears separately)

You can reuse the app icon as the splash screen element, just center it on a larger canvas.

## Android Adaptive Icon

For Android's adaptive icon:
- Use the same 1024×1024 design
- Ensure important elements are in the center "safe zone" (66% of icon)
- Outer edges may be cropped on some devices

## Validation Checklist

Before building, ensure:

- [ ] `assets/icon.png` exists and is 1024×1024px
- [ ] `assets/splash.png` exists (or uses icon reference)
- [ ] `assets/adaptive-icon.png` exists and is 1024×1024px
- [ ] Icons are PNG format
- [ ] Icons are not transparent (should have solid background)
- [ ] Text is readable at small sizes (test by shrinking)
- [ ] Design looks good in both light and dark contexts

## Testing Your Icons

1. **Local Testing**:
   ```bash
   npx expo start
   ```
   Check the app on your device/simulator

2. **Icon Preview**:
   - iOS: Check in app switcher and home screen
   - Android: Check in launcher and settings

3. **Preview Builds**:
   ```bash
   npm run build:ios:preview
   npm run build:android:preview
   ```
   Install on device and test in real context

## What Happens During Build

When you run `eas build`, Expo will:
1. Take your 1024×1024 icon
2. Generate all required sizes automatically:
   - iOS: 20pt @1x through 1024pt @1x (15+ sizes)
   - Android: mdpi through xxxhdpi (6+ sizes)
3. Apply proper formats and optimizations
4. Include in the app bundle

## Need Help?

If you need assistance creating icons:
1. Provide a rough sketch or description of what you want
2. I can help generate them using available tools
3. Or follow the simple PowerPoint/Google Slides approach above

## Next Steps

Once icons are ready:
1. Place them in the `assets/` folder
2. Verify with: `ls -la assets/`
3. Test locally: `npx expo start`
4. Proceed with EAS build

## Privacy Policy Hosting

The privacy policy (`PRIVACY_POLICY.md`) needs to be hosted at a public URL. Options:

1. **GitHub Pages** (Free, Recommended):
   - Create a GitHub repo
   - Enable GitHub Pages in settings
   - Upload PRIVACY_POLICY.md
   - URL: `https://[username].github.io/[repo]/PRIVACY_POLICY.html`

2. **Netlify** (Free):
   - Drag and drop the file
   - Instant hosting

3. **Personal Website**:
   - Host on your existing domain

4. **Simple HTML Page**:
   Convert the markdown to HTML and host anywhere

After hosting, add the URL to `app.json`:
```json
"ios": {
  ...
  "privacyPolicy": "https://your-url.com/privacy"
},
"android": {
  ...
  "privacyPolicy": "https://your-url.com/privacy"
}
```
