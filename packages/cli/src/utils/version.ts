/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getPackageJson } from './package.js';

export interface VersionInfo {
  version: string;
  buildTime?: string;
  gitCommit?: string;
  gitBranch?: string;
  nodeVersion?: string;
  platform?: string;
}

let buildInfo: any = null;
try {
  // Try to import build info (may not exist in development)
  buildInfo = await import('../generated/build-info.js').then(m => m.BUILD_INFO).catch(() => null);
} catch {
  // Build info not available
}

export async function getCliVersion(): Promise<string> {
  const pkgJson = await getPackageJson();
  return process.env.CLI_VERSION || pkgJson?.version || 'unknown';
}

export async function getVersionInfo(): Promise<VersionInfo> {
  const version = await getCliVersion();
  
  if (buildInfo) {
    return {
      version,
      buildTime: buildInfo.buildTime,
      gitCommit: buildInfo.gitCommit,
      gitBranch: buildInfo.gitBranch,
      nodeVersion: buildInfo.nodeVersion,
      platform: buildInfo.platform
    };
  }
  
  return { version };
}

export function formatVersionInfo(info: VersionInfo): string {
  let output = `Gemini CLI v${info.version}`;
  
  if (info.buildTime) {
    const buildDate = new Date(info.buildTime);
    output += `\nBuilt: ${buildDate.toLocaleString()}`;
  }
  
  if (info.gitCommit) {
    output += `\nGit: ${info.gitBranch}@${info.gitCommit}`;
  }
  
  if (info.platform) {
    output += `\nPlatform: ${info.platform}`;
  }
  
  if (info.nodeVersion) {
    output += `\nNode: ${info.nodeVersion}`;
  }
  
  return output;
}
