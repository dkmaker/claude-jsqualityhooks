/**
 * TypeScript validator exports
 */

export type { DiagnosticParserOptions } from './diagnosticParser.js';
export {
  filterDiagnosticsForFile,
  isConfigDiagnostic,
  parseDiagnostic,
  parseDiagnostics,
} from './diagnosticParser.js';
export type {
  FileInfo,
  TypeScriptValidationResult,
  ValidationResult,
} from './TypeScriptValidator.js';
export { TypeScriptValidator } from './TypeScriptValidator.js';
export type { LoadedTSConfig, TSConfig, TSConfigOptions } from './tsconfigLoader.js';
// Utility exports for advanced usage
export {
  findTSConfigFile,
  getDefaultCompilerOptions,
  loadTSConfig,
  loadTSConfigWithDiscovery,
} from './tsconfigLoader.js';
