#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates build information for version tracking
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function getBuildInfo() {
  const buildTime = new Date().toISOString();
  
  let gitCommit = 'unknown';
  let gitBranch = 'unknown';
  
  try {
    gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    // Git not available or not a git repo
  }
  
  try {
    gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch (e) {
    // Git not available or not a git repo
  }

  return {
    buildTime,
    gitCommit: gitCommit.substring(0, 8), // Short commit hash
    gitBranch,
    nodeVersion: process.version,
    platform: `${process.platform}-${process.arch}`
  };
}

function generateBuildInfo() {
  const buildInfo = getBuildInfo();
  
  // Write to core package
  const coreOutputPath = path.join(rootDir, 'packages/core/src/generated/build-info.ts');
  const coreContent = `/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// AUTO-GENERATED FILE - DO NOT EDIT
// Generated at build time by scripts/generate-build-info.js

export interface BuildInfo {
  buildTime: string;
  gitCommit: string;
  gitBranch: string;
  nodeVersion: string;
  platform: string;
}

export const BUILD_INFO: BuildInfo = ${JSON.stringify(buildInfo, null, 2)};
`;

  // Write to CLI package  
  const cliOutputPath = path.join(rootDir, 'packages/cli/src/generated/build-info.ts');
  const cliContent = coreContent; // Same content for both packages

  // Ensure generated directories exist
  fs.mkdirSync(path.dirname(coreOutputPath), { recursive: true });
  fs.mkdirSync(path.dirname(cliOutputPath), { recursive: true });
  
  // Write build info files
  fs.writeFileSync(coreOutputPath, coreContent);
  fs.writeFileSync(cliOutputPath, cliContent);
  
  console.log(`✅ Build info generated:`);
  console.log(`   Build time: ${buildInfo.buildTime}`);
  console.log(`   Git: ${buildInfo.gitBranch}@${buildInfo.gitCommit}`);
  console.log(`   Platform: ${buildInfo.platform}`);
  console.log(`   Node: ${buildInfo.nodeVersion}`);
  console.log(`   Files: ${coreOutputPath}, ${cliOutputPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateBuildInfo();
}