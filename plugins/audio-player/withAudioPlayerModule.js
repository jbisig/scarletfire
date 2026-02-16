const { withXcodeProject, withMainApplication, withAppBuildGradle, withAndroidManifest } = require('@expo/config-plugins');
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

  return config;
}

module.exports = withAudioPlayerModule;
