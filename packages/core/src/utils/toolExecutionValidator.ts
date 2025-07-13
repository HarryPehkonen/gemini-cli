/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { ToolErrorInfo } from '../tools/tools.js';

/**
 * Information about a recent tool failure
 */
interface FailureInfo {
  timestamp: number;
  errorInfo: ToolErrorInfo;
  requiredActions: string[];
  wasAddressed: boolean;
}

/**
 * Result of validation check before tool execution
 */
export interface ValidationResult {
  allowed: boolean;
  reason?: string;
  requiredActions?: string[];
  previousFailure?: FailureInfo;
}

/**
 * Generates a unique key for tool execution based on tool name and parameters
 */
function generateToolKey(toolName: string, params: unknown): string {
  // Create a stable hash of the tool call for comparison
  const paramsString = JSON.stringify(params, Object.keys(params as object).sort());
  return `${toolName}:${paramsString}`;
}

/**
 * Tool execution validator that prevents immediate retries of failed operations
 */
export class ToolExecutionValidator {
  private recentFailures = new Map<string, FailureInfo>();
  private readonly failureTimeoutMs: number;
  private readonly maxFailureAge: number;

  constructor(
    failureTimeoutMs: number = 30000, // 30 seconds
    maxFailureAge: number = 300000 // 5 minutes
  ) {
    this.failureTimeoutMs = failureTimeoutMs;
    this.maxFailureAge = maxFailureAge;
  }

  /**
   * Validates whether a tool execution should be allowed
   */
  validateBeforeExecution(toolName: string, params: unknown): ValidationResult {
    this.cleanupOldFailures();
    
    const key = generateToolKey(toolName, params);
    const recentFailure = this.recentFailures.get(key);
    
    if (!recentFailure) {
      return { allowed: true };
    }

    // Check if failure was recent and not addressed
    const timeSinceFailure = Date.now() - recentFailure.timestamp;
    
    if (timeSinceFailure < this.failureTimeoutMs && !recentFailure.wasAddressed) {
      return {
        allowed: false,
        reason: `Previous identical tool call failed ${Math.round(timeSinceFailure / 1000)}s ago and required actions have not been addressed.`,
        requiredActions: recentFailure.requiredActions,
        previousFailure: recentFailure
      };
    }

    // Failure is old enough or was addressed, allow execution
    return { allowed: true };
  }

  /**
   * Records a tool execution failure
   */
  recordFailure(toolName: string, params: unknown, errorInfo: ToolErrorInfo): void {
    const key = generateToolKey(toolName, params);
    const failureInfo: FailureInfo = {
      timestamp: Date.now(),
      errorInfo,
      requiredActions: errorInfo.requiredActions,
      wasAddressed: false
    };
    
    this.recentFailures.set(key, failureInfo);
  }

  /**
   * Records a successful tool execution (clears any previous failures)
   */
  recordSuccess(toolName: string, params: unknown): void {
    const key = generateToolKey(toolName, params);
    this.recentFailures.delete(key);
  }

  /**
   * Marks a failure as "addressed" when diagnostic actions have been taken
   */
  markFailureAddressed(toolName: string, params: unknown): void {
    const key = generateToolKey(toolName, params);
    const failure = this.recentFailures.get(key);
    
    if (failure) {
      failure.wasAddressed = true;
      this.recentFailures.set(key, failure);
    }
  }

  /**
   * Checks if a tool execution pattern suggests diagnostic actions were taken
   */
  detectDiagnosticActions(recentToolCalls: Array<{ name: string; params: unknown; success: boolean }>): void {
    // Look for diagnostic tool usage that might address previous failures
    const diagnosticTools = ['read_file', 'list_directory', 'grep', 'glob'];
    
    for (const call of recentToolCalls) {
      if (diagnosticTools.includes(call.name) && call.success) {
        // Mark related failures as potentially addressed
        this.markRelatedFailuresAddressed(call);
      }
    }
  }

  /**
   * Marks failures that might be addressed by diagnostic tool usage
   */
  private markRelatedFailuresAddressed(diagnosticCall: { name: string; params: unknown }): void {
    // If a read_file was successful, mark edit failures on the same file as addressed
    if (diagnosticCall.name === 'read_file') {
      const filePath = (diagnosticCall.params as { file_path?: string })?.file_path;
      if (filePath) {
        for (const [key, failure] of this.recentFailures.entries()) {
          if (key.startsWith('replace:') && 
              failure.errorInfo.context?.filePath === filePath &&
              (failure.errorInfo.code === 'EDIT_TEXT_NOT_FOUND' || 
               failure.errorInfo.code === 'EDIT_MULTIPLE_MATCHES')) {
            failure.wasAddressed = true;
          }
        }
      }
    }
  }

  /**
   * Removes old failure records
   */
  private cleanupOldFailures(): void {
    const now = Date.now();
    for (const [key, failure] of this.recentFailures.entries()) {
      if (now - failure.timestamp > this.maxFailureAge) {
        this.recentFailures.delete(key);
      }
    }
  }

  /**
   * Gets current failure statistics for debugging
   */
  getFailureStats(): { totalFailures: number; activeFailures: number } {
    this.cleanupOldFailures();
    const activeFailures = Array.from(this.recentFailures.values())
      .filter(f => !f.wasAddressed && (Date.now() - f.timestamp) < this.failureTimeoutMs)
      .length;
    
    return {
      totalFailures: this.recentFailures.size,
      activeFailures
    };
  }

  /**
   * Clears all recorded failures (for testing or reset)
   */
  clearAll(): void {
    this.recentFailures.clear();
  }
}