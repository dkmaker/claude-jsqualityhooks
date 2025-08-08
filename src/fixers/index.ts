/**
 * Auto-Fix Engine exports
 *
 * Phase 3: Auto-Fix implementation
 */

export { AutoFixEngine } from './AutoFixEngine.js';
export type { FixResult, FixStatistics, FileInfo } from './AutoFixEngine.js';

export { ConflictResolver } from './ConflictResolver.js';
export type {
  FixPriority,
  FixWithMeta,
  FixConflict,
  ConflictResolutionResult,
  RollbackInfo,
} from './ConflictResolver.js';
export {
  classifyFixPriority,
  getFixLineRange,
  generateFixGroup,
} from './ConflictResolver.js';

export { FixVerifier } from './FixVerifier.js';
export type {
  IssueComparison,
  FileIntegrityResult,
  VerificationMetrics,
  VerificationResult,
} from './FixVerifier.js';
