const { withXcodeProject, withMainApplication, withAppBuildGradle, withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add the custom AudioPlayerModule native files
 * This ensures the native audio player module persists across prebuild --clean
 */
function withAudioPlayerModuleIOS(config) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    const platformProjectRoot = config.modRequest.platformProjectRoot;
    const projectName = config.modRequest.projectName;

    // Source files location (preserved across prebuilds)
    const sourceDir = path.join(projectRoot, 'native-modules', 'ios');

    // Target location in iOS project (inside the app folder)
    const targetDir = path.join(platformProjectRoot, projectName);

    const filesToAdd = ['AudioPlayerModule.m', 'AudioPlayerModule.swift'];

    for (const fileName of filesToAdd) {
      const sourcePath = path.join(sourceDir, fileName);
      const targetPath = path.join(targetDir, fileName);

      // Copy file if source exists
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`[AudioPlayerModule] Copied ${fileName} to ${targetDir}`);

        // The path relative to the ios/ directory (for Xcode reference)
        const relativePath = `${projectName}/${fileName}`;

        // Check if file is already in project
        const existingFile = xcodeProject.hasFile(relativePath) || xcodeProject.hasFile(fileName);

        if (!existingFile) {
          // Find the main app group
          let appGroupKey = null;
          for (const key in xcodeProject.hash.project.objects.PBXGroup) {
            const group = xcodeProject.hash.project.objects.PBXGroup[key];
            if (group && group.name === projectName) {
              appGroupKey = key;
              break;
            }
          }

          if (appGroupKey) {
            // Add source file with correct path relative to ios/ folder
            xcodeProject.addSourceFile(
              relativePath,
              { target: xcodeProject.getFirstTarget().uuid },
              appGroupKey
            );
            console.log(`[AudioPlayerModule] Added ${relativePath} to Xcode project`);
          } else {
            console.warn(`[AudioPlayerModule] Could not find group ${projectName}`);
          }
        } else {
          console.log(`[AudioPlayerModule] ${fileName} already in Xcode project`);
        }
      } else {
        console.error(`[AudioPlayerModule] ERROR: Source file not found: ${sourcePath}`);
      }
    }

    return config;
  });
}

/**
 * Copy Android native module files to the Android project
 */
function withAudioPlayerModuleAndroidFiles(config) {
  return withMainApplication(config, async (config) => {
    const projectRoot = config.modRequest.projectRoot;

    // Source files location
    const sourceDir = path.join(projectRoot, 'native-modules', 'android');

    // Target location in Android project
    const targetDir = path.join(
      projectRoot,
      'android',
      'app',
      'src',
      'main',
      'java',
      'com',
      'scarletfire',
      'app'
    );

    const filesToCopy = ['AudioPlayerModule.kt', 'AudioPlayerPackage.kt', 'CastOptionsProvider.kt'];

    for (const fileName of filesToCopy) {
      const sourcePath = path.join(sourceDir, fileName);
      const targetPath = path.join(targetDir, fileName);

      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`[AudioPlayerModule] Copied ${fileName} to Android project`);
      } else {
        console.error(`[AudioPlayerModule] ERROR: Source file not found: ${sourcePath}`);
      }
    }

    // Register the package in MainApplication.kt
    const mainAppPath = path.join(targetDir, 'MainApplication.kt');
    let mainAppContent = config.modResults.contents;

    // Check if AudioPlayerPackage is already added
    if (!mainAppContent.includes('AudioPlayerPackage')) {
      // Add the import (should already be in same package, so no import needed)
      // Add to getPackages()
      mainAppContent = mainAppContent.replace(
        /PackageList\(this\)\.packages\.apply \{/,
        `PackageList(this).packages.apply {
              add(AudioPlayerPackage())`
      );
      config.modResults.contents = mainAppContent;
      console.log('[AudioPlayerModule] Registered AudioPlayerPackage in MainApplication.kt');
    } else {
      console.log('[AudioPlayerModule] AudioPlayerPackage already registered');
    }

    return config;
  });
}

/**
 * Add Media3 ExoPlayer dependencies to Android build.gradle
 */
function withAudioPlayerModuleAndroidDependencies(config) {
  return withAppBuildGradle(config, async (config) => {
    let buildGradle = config.modResults.contents;

    // Check if Media3 dependencies are already added
    if (!buildGradle.includes('androidx.media3')) {
      // Find the dependencies block and add Media3 and Cast
      const media3Dependencies = `
    // Media3 ExoPlayer for AudioPlayerModule
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-session:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")
    implementation("androidx.media:media:1.7.0")
    // Cast Support
    implementation("androidx.media3:media3-cast:1.2.1")
    implementation("com.google.android.gms:play-services-cast-framework:22.2.0")
    implementation("androidx.mediarouter:mediarouter:1.7.0")`;

      // Insert before the closing brace of dependencies block
      buildGradle = buildGradle.replace(
        /(dependencies\s*\{[\s\S]*?)(^\})/m,
        (match, p1, p2) => {
          // Find last line before closing brace
          const lines = p1.split('\n');
          const lastIndex = lines.length - 1;
          lines.splice(lastIndex, 0, media3Dependencies);
          return lines.join('\n') + p2;
        }
      );

      config.modResults.contents = buildGradle;
      console.log('[AudioPlayerModule] Added Media3 dependencies to build.gradle');
    } else {
      console.log('[AudioPlayerModule] Media3 dependencies already present');
    }

    // Add Cast dependencies if not already present
    buildGradle = config.modResults.contents;
    if (!buildGradle.includes('media3-cast')) {
      const castDependencies = `
    // Cast Support
    implementation("androidx.media3:media3-cast:1.2.1")
    implementation("com.google.android.gms:play-services-cast-framework:22.2.0")
    implementation("androidx.mediarouter:mediarouter:1.7.0")`;

      buildGradle = buildGradle.replace(
        /(dependencies\s*\{[\s\S]*?)(^\})/m,
        (match, p1, p2) => {
          const lines = p1.split('\n');
          const lastIndex = lines.length - 1;
          lines.splice(lastIndex, 0, castDependencies);
          return lines.join('\n') + p2;
        }
      );
      config.modResults.contents = buildGradle;
      console.log('[AudioPlayerModule] Added Cast dependencies to build.gradle');
    } else {
      console.log('[AudioPlayerModule] Cast dependencies already present');
    }

    return config;
  });
}

/**
 * Add Cast options provider to AndroidManifest.xml
 */
function withCastManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];

    if (application) {
      // Initialize meta-data array if it doesn't exist
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      // Check if Cast options provider is already added
      const hasCastProvider = application['meta-data'].some(
        (item) => item.$?.['android:name'] === 'com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME'
      );

      if (!hasCastProvider) {
        application['meta-data'].push({
          $: {
            'android:name': 'com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME',
            'android:value': 'com.scarletfire.app.CastOptionsProvider',
          },
        });
        console.log('[AudioPlayerModule] Added CastOptionsProvider to AndroidManifest.xml');
      } else {
        console.log('[AudioPlayerModule] CastOptionsProvider already in AndroidManifest.xml');
      }
    }

    return config;
  });
}

// Our android:fullBackupContent / android:dataExtractionRules below WIN over
// expo-secure-store's own withSecureStore plugin (see
// node_modules/expo-secure-store/plugin/src/withSecureStore.ts): whichever
// plugin's AndroidManifest mod applies its attributes first "claims" them,
// and the other backs off with a console.warn ("tried to apply Android Auto
// Backup rules, but other backup rules are already present"). Since ours
// wins, expo-secure-store's own secure_store_backup_rules.xml /
// secure_store_data_extraction_rules.xml (bundled inside its module,
// pointed at only when IT wins) never get referenced by the manifest — so
// our XML below must carry secure-store's exclusions itself, or its
// SecureStore SharedPreferences file (Keystore-encrypted secrets) would
// fall back to Android's default "back up everything" behavior and get
// included in Auto Backup / device transfer, where it cannot be decrypted
// after restore (the Keystore key doesn't travel with a backup).
//
// The moment any <include> element appears anywhere in one of these files,
// backup switches from "back up everything except <exclude>s" to whitelist
// mode: ONLY domains/paths named in an <include> are backed up at all (see
// https://developer.android.com/guide/topics/data/autobackup#XMLSyntax).
// We only ever add an <include>+<exclude> pair for the `sharedpref` domain
// (secure-store's), so under that whitelist the `file` domain is never
// included at all — offline downloads (and the video cache) stay out of
// Auto Backup / cloud backup / device transfer implicitly, with no
// file-domain rows needed here.
const BACKUP_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Offline downloads are re-downloadable; keep them out of Auto Backup
     (which silently stops backing the app up past 25 MB otherwise). We do
     this by omission: only sharedpref is <include>d below, which — per
     Android's whitelist semantics once any <include> is present — means the
     file domain (downloads/, videos/) is never backed up at all. No
     explicit "downloads" exclude is needed or present.

     This file supersedes expo-secure-store's generated
     secure_store_backup_rules.xml (our android:fullBackupContent wins over
     secure-store's — see the comment above withDownloadsBackupRules), so it
     also carries secure-store's own SecureStore exclusion below. Keep the
     sharedpref rows in sync with
     node_modules/expo-secure-store/android/src/main/res/xml/secure_store_backup_rules.xml
     if that file ever changes. -->
<full-backup-content>
  <include domain="sharedpref" path="." />
  <exclude domain="sharedpref" path="SecureStore" />
</full-backup-content>
`;

const DATA_EXTRACTION_RULES_XML = `<?xml version="1.0" encoding="utf-8"?>
<!-- Supersedes expo-secure-store's generated
     secure_store_data_extraction_rules.xml for the same reason as
     backup_rules.xml above — keep the sharedpref rows in sync with
     node_modules/expo-secure-store/android/src/main/res/xml/secure_store_data_extraction_rules.xml
     if that file ever changes. The downloads exclusion is implicit here too:
     no file-domain <include> means the file domain is not backed up. -->
<data-extraction-rules>
  <cloud-backup>
    <include domain="sharedpref" path="." />
    <exclude domain="sharedpref" path="SecureStore" />
  </cloud-backup>
  <device-transfer>
    <include domain="sharedpref" path="." />
    <exclude domain="sharedpref" path="SecureStore" />
  </device-transfer>
</data-extraction-rules>
`;

/**
 * Write res/xml backup rules that exclude the offline-downloads directory,
 * and point the <application> at them.
 */
function withDownloadsBackupRules(config) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const xmlDir = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      fs.mkdirSync(xmlDir, { recursive: true });
      fs.writeFileSync(path.join(xmlDir, 'backup_rules.xml'), BACKUP_RULES_XML);
      fs.writeFileSync(path.join(xmlDir, 'data_extraction_rules.xml'), DATA_EXTRACTION_RULES_XML);
      console.log('[AudioPlayerModule] Wrote downloads backup rules');
      return config;
    },
  ]);
  // NOTE: this intentionally overrides whatever expo-secure-store's own
  // withSecureStore plugin set (or will set) on these two attributes — see
  // the comment above BACKUP_RULES_XML for why our XML has to carry
  // secure-store's SecureStore exclusion forward as a result.
  return withAndroidManifest(config, async (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:fullBackupContent'] = '@xml/backup_rules';
      application.$['android:dataExtractionRules'] = '@xml/data_extraction_rules';
    }
    return config;
  });
}

/**
 * Main plugin that combines iOS and Android setup
 */
function withAudioPlayerModule(config) {
  // Apply iOS configuration
  config = withAudioPlayerModuleIOS(config);

  // Apply Android configuration
  config = withAudioPlayerModuleAndroidFiles(config);
  config = withAudioPlayerModuleAndroidDependencies(config);
  config = withCastManifest(config);
  config = withDownloadsBackupRules(config);

  return config;
}

module.exports = withAudioPlayerModule;
