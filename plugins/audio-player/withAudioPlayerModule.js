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

    // Source files location (preserved across prebuilds)
    const sourceDir = path.join(projectRoot, 'native-modules', 'ios');

    // Target location in iOS project
    const targetDir = path.join(platformProjectRoot, config.modRequest.projectName);

    const filesToAdd = ['AudioPlayerModule.m', 'AudioPlayerModule.swift'];

    for (const fileName of filesToAdd) {
      const sourcePath = path.join(sourceDir, fileName);
      const targetPath = path.join(targetDir, fileName);

      // Copy file if source exists
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`Copied ${fileName} to iOS project`);

        // Add file to Xcode project if not already present
        const groupName = config.modRequest.projectName;

        // Find the main group
        const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
        const projectGroup = xcodeProject.getPBXGroupByKey(mainGroup);

        // Find or get the app group
        let appGroupKey = null;
        for (const key in xcodeProject.hash.project.objects.PBXGroup) {
          const group = xcodeProject.hash.project.objects.PBXGroup[key];
          if (group && group.name === groupName) {
            appGroupKey = key;
            break;
          }
        }

        if (appGroupKey) {
          // Check if file is already in project
          const existingFile = xcodeProject.hasFile(fileName);

          if (!existingFile) {
            // Add file to project
            if (fileName.endsWith('.swift')) {
              xcodeProject.addSourceFile(fileName, { target: xcodeProject.getFirstTarget().uuid }, appGroupKey);
            } else if (fileName.endsWith('.m')) {
              xcodeProject.addSourceFile(fileName, { target: xcodeProject.getFirstTarget().uuid }, appGroupKey);
            }
            console.log(`Added ${fileName} to Xcode project`);
          } else {
            console.log(`${fileName} already in Xcode project`);
          }
        }
      } else {
        console.warn(`Warning: ${sourcePath} not found`);
      }
    }

    return config;
  });
}

module.exports = withAudioPlayerModule;
