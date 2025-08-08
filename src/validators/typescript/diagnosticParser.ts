/**
 * TypeScript Diagnostic Parser
 *
 * Converts TypeScript compiler diagnostics to ValidationIssue format
 * for consistent reporting across all validators.
 */

import type ts from 'typescript';
import type { ValidationIssue } from '../biome/adapters/BiomeAdapter.js';

export interface DiagnosticParserOptions {
  /** Project root for relative path calculation */
  projectRoot?: string;
}

/**
 * Convert TypeScript diagnostic category to severity
 */
function mapDiagnosticSeverity(category: ts.DiagnosticCategory): ValidationIssue['severity'] {
  switch (category) {
    case 0: // ts.DiagnosticCategory.Warning
      return 'warning';
    case 1: // ts.DiagnosticCategory.Error  
      return 'error';
    case 2: // ts.DiagnosticCategory.Suggestion
      return 'info';
    case 3: // ts.DiagnosticCategory.Message
      return 'info';
    default:
      return 'error';
  }
}

/**
 * Get line and column numbers from TypeScript diagnostic
 */
function getPositionFromDiagnostic(diagnostic: ts.Diagnostic): { line: number; column: number } {
  if (!diagnostic.file || diagnostic.start === undefined) {
    return { line: 0, column: 0 };
  }

  const lineAndChar = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  
  // Convert to 1-based indexing to match other validators
  return {
    line: lineAndChar.line + 1,
    column: lineAndChar.character + 1,
  };
}

/**
 * Format diagnostic message text
 */
function formatDiagnosticMessage(messageText: string | ts.DiagnosticMessageChain): string {
  if (typeof messageText === 'string') {
    return messageText;
  }

  // Handle DiagnosticMessageChain
  let message = messageText.messageText;
  if (messageText.next) {
    const chainedMessages = messageText.next
      .map(chain => formatDiagnosticMessage(chain))
      .join(' ');
    message += ` ${chainedMessages}`;
  }

  return message;
}

/**
 * Get relative file path
 */
function getRelativeFilePath(filePath: string | undefined, projectRoot: string): string {
  if (!filePath) {
    return '<unknown>';
  }

  // Try to make path relative to project root
  if (projectRoot && filePath.startsWith(projectRoot)) {
    return filePath.substring(projectRoot.length + 1);
  }

  return filePath;
}

/**
 * Convert single TypeScript diagnostic to ValidationIssue
 */
export function parseDiagnostic(
  diagnostic: ts.Diagnostic,
  options: DiagnosticParserOptions = {}
): ValidationIssue {
  const { projectRoot = process.cwd() } = options;
  const position = getPositionFromDiagnostic(diagnostic);
  const filePath = diagnostic.file?.fileName;

  return {
    file: getRelativeFilePath(filePath, projectRoot),
    line: position.line,
    column: position.column,
    severity: mapDiagnosticSeverity(diagnostic.category),
    message: formatDiagnosticMessage(diagnostic.messageText),
    fixed: false, // TypeScript validation doesn't auto-fix
    fixable: false, // We don't implement TypeScript quick fixes in v1
  };
}

/**
 * Convert array of TypeScript diagnostics to ValidationIssues
 */
export function parseDiagnostics(
  diagnostics: readonly ts.Diagnostic[],
  options: DiagnosticParserOptions = {}
): ValidationIssue[] {
  return diagnostics
    .map(diagnostic => parseDiagnostic(diagnostic, options))
    .sort((a, b) => {
      // Sort by file first, then by line, then by column
      if (a.file !== b.file) {
        return a.file.localeCompare(b.file);
      }
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return a.column - b.column;
    });
}

/**
 * Filter diagnostics for a specific file
 */
export function filterDiagnosticsForFile(
  diagnostics: readonly ts.Diagnostic[],
  targetFile: string
): ts.Diagnostic[] {
  return diagnostics.filter(diagnostic => {
    if (!diagnostic.file) {
      return false;
    }
    
    const diagnosticFile = diagnostic.file.fileName;
    
    // Match exact path or normalized path
    return diagnosticFile === targetFile ||
           diagnosticFile.replace(/\\/g, '/') === targetFile.replace(/\\/g, '/');
  });
}

/**
 * Check if diagnostic is related to TypeScript configuration
 */
export function isConfigDiagnostic(diagnostic: ts.Diagnostic): boolean {
  // Common TypeScript config error codes
  const configErrorCodes = [
    5009, // Cannot find the common subdirectory path for the input files
    5023, // Unknown compiler option
    5024, // Compiler option requires a value
    5025, // Unknown compiler option
    6064, // Cannot find tsconfig.json file
  ];
  
  return configErrorCodes.includes(diagnostic.code);
}