/**
 * Hook Mode Handler
 *
 * Processes JSON input from Claude Code when running as a hook.
 * This is the core integration point between Claude Code and the validation system.
 */

import { loadConfig } from '../config/index.js';
// Unused import removed for linting

export interface HookInput {
  hook_event_name: string;
  tool_name: string;
  tool_input: {
    file_path: string;
    content?: string;
    old_string?: string;
    new_string?: string;
    edits?: Array<{
      old_string: string;
      new_string: string;
    }>;
  };
}

export interface HookOutput {
  success: boolean;
  message?: string;
  errors?: string[];
  warnings?: string[];
  fixes_applied?: string[];
}

/**
 * Read JSON input from stdin
 */
export async function readStdinJson(): Promise<HookInput | null> {
  return new Promise((resolve) => {
    let data = '';

    // Set up timeout for stdin reading
    const timeout = setTimeout(() => {
      resolve(null);
    }, 5000);

    process.stdin.setEncoding('utf8');

    process.stdin.on('data', (chunk) => {
      data += chunk;
    });

    process.stdin.on('end', () => {
      clearTimeout(timeout);
      try {
        const parsed = JSON.parse(data.trim()) as HookInput;
        resolve(parsed);
      } catch {
        resolve(null);
      }
    });

    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve(null);
    });
  });
}

/**
 * Check if configuration file exists
 */
async function checkConfigExists(): Promise<{ exists: boolean; message?: string }> {
  try {
    await loadConfig();
    return { exists: true };
  } catch (_error) {
    const configMissingMessage = `⚠️  Configuration file not found: claude-jsqualityhooks.config.yaml

To get started:
1. Run: npx claude-jsqualityhooks init
   This will create claude-jsqualityhooks.config.yaml in your project root

2. Or manually create claude-jsqualityhooks.config.yaml with minimal config:
   ---
   enabled: true
   validators:
     biome:
       enabled: true

Without this configuration file, the hook will not run.
For details, see: https://github.com/dkmaker/claude-jsqualityhooks#configuration`;

    return {
      exists: false,
      message: configMissingMessage,
    };
  }
}

/**
 * Process hook input and return results
 */
export async function processHookInput(input: HookInput): Promise<HookOutput> {
  try {
    // Check if configuration exists
    const configCheck = await checkConfigExists();
    if (!configCheck.exists) {
      return {
        success: false,
        message: configCheck.message || 'Configuration file not found',
      };
    }

    // Load configuration
    const config = await loadConfig();

    // Check if hooks are enabled
    if (!config.enabled) {
      return {
        success: true,
        message: 'Hooks disabled in configuration',
      };
    }

    // Validate tool name
    const supportedTools = ['Write', 'Edit', 'MultiEdit'];
    if (!supportedTools.includes(input.tool_name)) {
      return {
        success: true,
        message: `Tool ${input.tool_name} not configured for hooks`,
      };
    }

    // Extract file path
    const filePath = input.tool_input.file_path;
    if (!filePath) {
      return {
        success: false,
        message: 'No file path provided in tool input',
      };
    }

    // Check if file matches patterns
    const patterns: { include?: string[]; exclude?: string[] } = {};
    if (config.include) patterns.include = config.include;
    if (config.exclude) patterns.exclude = config.exclude;

    if (!shouldProcessFile(filePath, patterns)) {
      return {
        success: true,
        message: `File ${filePath} excluded by patterns`,
      };
    }

    // TODO: Implement validation pipeline
    // This will be implemented in Phase 2 when validators are ready
    const warnings: string[] = [];
    const errors: string[] = [];
    const fixesApplied: string[] = [];

    // For now, just log that we received the hook
    console.error(`[claude-jsqualityhooks] Processing ${input.tool_name} on ${filePath}`);

    // Placeholder validation results
    return {
      success: true,
      message: `Processed ${input.tool_name} on ${filePath}`,
      warnings,
      errors,
      fixes_applied: fixesApplied,
    };
  } catch (error) {
    return {
      success: false,
      message: `Hook processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Check if file should be processed based on patterns
 */
function shouldProcessFile(
  filePath: string,
  patterns?: { include?: string[]; exclude?: string[] }
): boolean {
  if (!patterns || (!patterns.include && !patterns.exclude)) {
    // Default patterns for TypeScript/JavaScript files
    return /\.(ts|tsx|js|jsx|mts|cts)$/.test(filePath);
  }

  const { include = ['**/*.{ts,tsx,js,jsx,mts,cts}'], exclude = [] } = patterns;

  // Check exclude patterns first
  for (const excludePattern of exclude) {
    if (matchesPattern(filePath, excludePattern)) {
      return false;
    }
  }

  // Check include patterns
  for (const includePattern of include) {
    if (matchesPattern(filePath, includePattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Simple pattern matching (basic glob support)
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.') // Escape dots first
    .replace(/\*\*\/\*/g, '.*') // **/* matches anything (greedy)
    .replace(/\*\*/g, '.*') // ** matches anything
    .replace(/\*/g, '[^/]*') // * matches anything except path separator
    .replace(/\{([^}]+)\}/g, '(?:$1)') // {a,b,c} becomes (?:a|b|c)
    .replace(/,/g, '|'); // Convert commas to OR

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Format hook output for Claude Code
 */
export function formatHookOutput(output: HookOutput): string {
  // Return clean JSON without ANSI codes for AI consumption
  return JSON.stringify(output, null, 2);
}

/**
 * Main entry point for hook mode
 */
export async function runHookMode(): Promise<void> {
  try {
    // Read JSON from stdin
    const input = await readStdinJson();

    if (!input) {
      const errorOutput: HookOutput = {
        success: false,
        message: 'Failed to read JSON input from stdin',
      };
      console.log(formatHookOutput(errorOutput));
      process.exit(1);
      return;
    }

    // Process the hook input
    const output = await processHookInput(input);

    // Output results to stdout for Claude
    console.log(formatHookOutput(output));

    // Exit with appropriate code
    process.exit(output.success ? 0 : 1);
  } catch (error) {
    const errorOutput: HookOutput = {
      success: false,
      message: `Hook mode failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };

    console.log(formatHookOutput(errorOutput));
    process.exit(1);
  }
}
