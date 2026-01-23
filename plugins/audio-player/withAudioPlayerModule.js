const { withXcodeProject, IOSConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to add the custom AudioPlayerModule native files
 * This ensures the native audio player module persists across prebuild --clean
 */
function withAudioPlayerModule(config) {
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

module.exports = withAudioPlayerModule;
