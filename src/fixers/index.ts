/**
 * Auto-Fix Engine exports
 *
 * Phase 3: Auto-Fix implementation
 */

export type { FileInfo, FixResult, FixStatistics } from './AutoFixEngine.js';
export { AutoFixEngine } from './AutoFixEngine.js';
export type {
  ConflictResolutionResult,
  FixConflict,
  FixPriority,
  FixWithMeta,
  RollbackInfo,
} from './ConflictResolver.js';
export {
  ConflictResolver,
  classifyFixPriority,
  generateFixGroup,
  getFixLineRange,
} from './ConflictResolver.js';
export type {
  FileIntegrityResult,
  IssueComparison,
  VerificationMetrics,
  VerificationResult,
} from './FixVerifier.js';
export { FixVerifier } from './FixVerifier.js';
