/**
 * CLI Helper Functions
 *
 * Utilities for config file creation, settings management, and user feedback.
 */

import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { stringify } from 'yaml';
import {
  type DetectedVersions,
  detectBiomeVersion,
  getBiomeFixFlag,
} from '../utils/versionDetector.js';

export interface ConfigOptions {
  minimal?: boolean;
  force?: boolean;
  biomeVersion?: string;
}

export interface InstallOptions {
  settingsPath?: string;
  noBackup?: boolean;
  tools?: string | string[];
}

/**
 * Generate default configuration content
 */
export async function generateConfigContent(options: ConfigOptions = {}): Promise<string> {
  const biomeInfo = await detectBiomeVersion();
  const biomeFlag = getBiomeFixFlag(biomeInfo);

  // Override biome version if specified
  let _biomeVersion = biomeInfo.version;
  if (options.biomeVersion) {
    _biomeVersion = options.biomeVersion;
  }

  const config = {
    // Core settings
    enabled: true,
    autoFix: {
      enabled: true,
    },

    // Validators configuration
    validators: {
      biome: {
        enabled: true,
        version: 'auto', // Auto-detect 1.x or 2.x
        fixFlag: biomeFlag, // --apply for 1.x, --write for 2.x
      },
      typescript: {
        enabled: true,
        strict: true,
      },
    },

    // Output configuration for AI
    output: {
      format: 'ai-optimized',
      includeContext: true,
      removeAnsiCodes: true,
    },

    // File patterns
    patterns: {
      include: ['**/*.{ts,tsx,js,jsx,mts,cts}'],
      exclude: ['node_modules/**', 'dist/**', 'build/**', '**/*.d.ts', '**/*.min.js'],
    },

    // Hook configuration
    hooks: {
      enabled: true,
      tools: ['Write', 'Edit', 'MultiEdit'],
    },
  };

  // Minimal configuration removes optional settings
  if (options.minimal) {
    return stringify({
      enabled: true,
      autoFix: {
        enabled: true,
      },
      validators: {
        biome: {
          enabled: true,
        },
        typescript: {
          enabled: true,
        },
      },
    });
  }

  return stringify(config);
}

/**
 * Create configuration file
 */
export async function createConfigFile(
  options: ConfigOptions = {}
): Promise<{ success: boolean; message: string; configPath?: string }> {
  const configPath = join(process.cwd(), 'claude-jsqualityhooks.config.yaml');

  try {
    // Check if file exists
    if (!options.force) {
      try {
        await access(configPath);
        return {
          success: false,
          message: `Configuration file already exists: ${configPath}\nUse --force to overwrite`,
        };
      } catch {
        // File doesn't exist, proceed
      }
    }

    // Generate configuration content
    const content = await generateConfigContent(options);

    // Write the file
    await writeFile(configPath, content, 'utf-8');

    return {
      success: true,
      message: `✓ Configuration file created: ${configPath}`,
      configPath,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Find Claude settings file
 */
export async function findClaudeSettings(
  customPath?: string
): Promise<{ success: boolean; path?: string; message: string }> {
  const possiblePaths = [
    customPath,
    join(homedir(), '.claude', 'settings.json'),
    join(homedir(), 'Library', 'Application Support', 'Claude', 'settings.json'), // macOS
    join(homedir(), 'AppData', 'Roaming', 'Claude', 'settings.json'), // Windows
  ].filter(Boolean) as string[];

  for (const path of possiblePaths) {
    try {
      await access(path);
      return {
        success: true,
        path,
        message: `✓ Claude settings found: ${path}`,
      };
    } catch {
      // Skip this path
    }
  }

  return {
    success: false,
    message: `Claude settings file not found. Checked paths:\n${possiblePaths.map((p) => `  - ${p}`).join('\n')}\n\nPlease ensure Claude Code is installed and has been run at least once.`,
  };
}

/**
 * Read and parse Claude settings
 */
export async function readClaudeSettings(
  settingsPath: string
): Promise<{ success: boolean; settings?: any; message: string }> {
  try {
    const content = await readFile(settingsPath, 'utf-8');
    const settings = JSON.parse(content);

    return {
      success: true,
      settings,
      message: 'Settings loaded successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to read settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Create backup of settings file
 */
export async function backupSettings(
  settingsPath: string
): Promise<{ success: boolean; backupPath?: string; message: string }> {
  const backupPath = `${settingsPath}.backup`;

  try {
    await copyFile(settingsPath, backupPath);
    return {
      success: true,
      backupPath,
      message: `✓ Backup created: ${backupPath}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Update Claude settings with hooks
 */
export async function updateClaudeSettings(
  settingsPath: string,
  currentSettings: any,
  options: InstallOptions = {}
): Promise<{ success: boolean; message: string }> {
  try {
    const toolsArray = Array.isArray(options.tools)
      ? options.tools
      : typeof options.tools === 'string'
        ? [options.tools]
        : ['Write', 'Edit', 'MultiEdit'];
    const toolPattern = toolsArray.join('|');

    // Ensure hooks structure exists
    const updatedSettings = {
      ...currentSettings,
      hooks: {
        ...currentSettings.hooks,
        PostToolUse: [
          // Remove any existing claude-jsqualityhooks hooks
          ...(currentSettings.hooks?.PostToolUse || []).filter(
            (hook: any) =>
              !hook.hooks?.some((h: any) => h.command?.includes('claude-jsqualityhooks'))
          ),
          // Add new hook
          {
            matcher: toolPattern,
            hooks: [
              {
                type: 'command',
                command: 'npx claude-jsqualityhooks',
              },
            ],
          },
        ],
      },
    };

    // Write updated settings
    const content = JSON.stringify(updatedSettings, null, 2);
    await writeFile(settingsPath, content, 'utf-8');

    return {
      success: true,
      message: `✓ Hook registered for tools: ${toolsArray.join(', ')}\n✓ Installation complete! The hook will run automatically when Claude modifies files`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update settings: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Remove hooks from Claude settings
 */
export async function removeHooksFromSettings(
  settingsPath: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { success, settings, message } = await readClaudeSettings(settingsPath);
    if (!success || !settings) {
      return { success: false, message };
    }

    // Remove claude-jsqualityhooks hooks
    const updatedSettings = {
      ...settings,
      hooks: {
        ...settings.hooks,
        PostToolUse: (settings.hooks?.PostToolUse || []).filter(
          (hook: any) => !hook.hooks?.some((h: any) => h.command?.includes('claude-jsqualityhooks'))
        ),
      },
    };

    // Write updated settings
    const content = JSON.stringify(updatedSettings, null, 2);
    await writeFile(settingsPath, content, 'utf-8');

    return {
      success: true,
      message: '✓ claude-jsqualityhooks hooks removed from Claude settings',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to remove hooks: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Format version information for display
 */
export function formatVersionInfo(versions: DetectedVersions): string {
  const lines = [
    `Claude JS Quality Hooks: ${versions.package}`,
    `Node.js: ${versions.node.version}`,
  ];

  if (versions.biome) {
    const sourceInfo =
      versions.biome.source === 'default'
        ? ' (defaulted to 2.x)'
        : ` (detected from ${versions.biome.source})`;
    lines.push(`Biome: ${versions.biome.version}${sourceInfo}`);
  } else {
    lines.push('Biome: Not found - install @biomejs/biome to enable validation');
  }

  if (versions.typescript) {
    lines.push(
      `TypeScript: ${versions.typescript.version} (detected from ${versions.typescript.source})`
    );
  } else {
    lines.push('TypeScript: Not found - install typescript to enable type checking');
  }

  return lines.join('\n');
}

/**
 * Format success message
 */
export function formatSuccess(message: string): string {
  return `✅ ${message}`;
}

/**
 * Format error message
 */
export function formatError(message: string): string {
  return `❌ ${message}`;
}

/**
 * Format warning message
 */
export function formatWarning(message: string): string {
  return `⚠️  ${message}`;
}
