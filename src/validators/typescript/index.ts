/**
 * TypeScript validator exports
 */

export { TypeScriptValidator } from './TypeScriptValidator.js';
export type { TypeScriptValidationResult, FileInfo, ValidationResult } from './TypeScriptValidator.js';

// Utility exports for advanced usage
export { 
  loadTSConfigWithDiscovery, 
  findTSConfigFile, 
  loadTSConfig, 
  getDefaultCompilerOptions 
} from './tsconfigLoader.js';
export type { TSConfigOptions, TSConfig, LoadedTSConfig } from './tsconfigLoader.js';

export { 
  parseDiagnostics, 
  parseDiagnostic, 
  filterDiagnosticsForFile, 
  isConfigDiagnostic 
} from './diagnosticParser.js';
export type { DiagnosticParserOptions } from './diagnosticParser.js';