/**
 * claude-jsqualityhooks - Main entry point
 *
 * A Claude Code Hooks extension that validates and auto-fixes TypeScript/JavaScript code
 * after Claude writes files.
 *
 * @version 1.0.0
 * @author DKMaker
 */

export * from './config/index.js';
export * from './hooks/index.js';
// Core exports - these will be implemented in subsequent tasks
export * from './types/index.js';
export * from './validators/index.js';

// Main API - placeholder for now
export const version = '1.0.0';

/**
 * Initialize the hooks system
 * This will be implemented in Phase 1 Task 2
 */
export async function initialize(): Promise<void> {
  // TODO: Implement in Phase 1 Task 2
  console.log('claude-jsqualityhooks v1.0.0 - Hooks system not yet implemented');
}

/**
 * Default export for the main library
 */
export default {
  version,
  initialize,
};
