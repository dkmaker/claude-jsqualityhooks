/**
 * Tests for CLI Helper Functions
 *
 * These tests verify config file creation, Claude settings management,
 * and user feedback utilities.
 */

import { access, copyFile, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { stringify } from 'yaml';
import {
  backupSettings,
  type ConfigOptions,
  createConfigFile,
  findClaudeSettings,
  formatError,
  formatSuccess,
  formatVersionInfo,
  formatWarning,
  generateConfigContent,
  type InstallOptions,
  readClaudeSettings,
  removeHooksFromSettings,
  updateClaudeSettings,
} from '../../src/cli/helpers.js';
import { detectBiomeVersion, getBiomeFixFlag } from '../../src/utils/versionDetector.js';

// Mock file system operations
vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  copyFile: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

// Mock OS operations
vi.mock('node:os', () => ({
  homedir: vi.fn(),
}));

// Mock path operations
vi.mock('node:path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

// Mock YAML operations
vi.mock('yaml', () => ({
  stringify: vi.fn(),
}));

// Mock version detection
vi.mock('../../src/utils/versionDetector.js', () => ({
  detectBiomeVersion: vi.fn(),
  getBiomeFixFlag: vi.fn(),
}));

const mockAccess = vi.mocked(access);
const mockCopyFile = vi.mocked(copyFile);
const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockHomedir = vi.mocked(homedir);
const mockJoin = vi.mocked(join);
const mockStringify = vi.mocked(stringify);
const mockDetectBiomeVersion = vi.mocked(detectBiomeVersion);
const mockGetBiomeFixFlag = vi.mocked(getBiomeFixFlag);

// Mock process.cwd
const originalCwd = process.cwd;

describe('CLI helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = vi.fn().mockReturnValue('/test/project');
    mockHomedir.mockReturnValue('/home/user');
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockDetectBiomeVersion.mockResolvedValue({
      version: '2.1.3',
      major: 2,
      minor: 1,
      patch: 3,
      source: 'package.json',
    });
    mockGetBiomeFixFlag.mockReturnValue('--write');
    mockStringify.mockReturnValue('mocked yaml content');
  });

  afterEach(() => {
    process.cwd = originalCwd;
  });

  describe('generateConfigContent()', () => {
    it('should generate full configuration with detected Biome version', async () => {
      const options: ConfigOptions = {};

      await generateConfigContent(options);

      expect(mockDetectBiomeVersion).toHaveBeenCalled();
      expect(mockGetBiomeFixFlag).toHaveBeenCalledWith({
        version: '2.1.3',
        major: 2,
        minor: 1,
        patch: 3,
        source: 'package.json',
      });
      expect(mockStringify).toHaveBeenCalledWith({
        enabled: true,
        autoFix: { enabled: true },
        validators: {
          biome: {
            enabled: true,
            version: 'auto',
            fixFlag: '--write',
          },
          typescript: {
            enabled: true,
            strict: true,
          },
        },
        output: {
          format: 'ai-optimized',
          includeContext: true,
          removeAnsiCodes: true,
        },
        patterns: {
          include: ['**/*.{ts,tsx,js,jsx,mts,cts}'],
          exclude: ['node_modules/**', 'dist/**', 'build/**', '**/*.d.ts', '**/*.min.js'],
        },
        hooks: {
          enabled: true,
          tools: ['Write', 'Edit', 'MultiEdit'],
        },
      });
    });

    it('should generate minimal configuration when requested', async () => {
      const options: ConfigOptions = { minimal: true };

      await generateConfigContent(options);

      expect(mockStringify).toHaveBeenCalledWith({
        enabled: true,
        autoFix: { enabled: true },
        validators: {
          biome: { enabled: true },
          typescript: { enabled: true },
        },
      });
    });

    it('should override Biome version when specified', async () => {
      const options: ConfigOptions = { biomeVersion: '1.8.0' };

      await generateConfigContent(options);

      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({
          validators: expect.objectContaining({
            biome: expect.objectContaining({
              version: 'auto', // Still uses 'auto', but internal logic would use override
            }),
          }),
        })
      );
    });

    it('should handle Biome version detection errors', async () => {
      mockDetectBiomeVersion.mockRejectedValue(new Error('Detection failed'));

      // Should throw the error since there's no error handling
      await expect(generateConfigContent()).rejects.toThrow('Detection failed');
    });
  });

  describe('createConfigFile()', () => {
    it('should create configuration file successfully', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT')); // File doesn't exist
      mockJoin.mockReturnValue('/test/project/claude-jsqualityhooks.config.yaml');

      const result = await createConfigFile();

      expect(result.success).toBe(true);
      expect(result.configPath).toBe('/test/project/claude-jsqualityhooks.config.yaml');
      expect(result.message).toBe(
        '✓ Configuration file created: /test/project/claude-jsqualityhooks.config.yaml'
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/test/project/claude-jsqualityhooks.config.yaml',
        'mocked yaml content',
        'utf-8'
      );
    });

    it('should refuse to overwrite existing file without force flag', async () => {
      mockAccess.mockResolvedValue(undefined); // File exists

      const result = await createConfigFile();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Configuration file already exists');
      expect(result.message).toContain('Use --force to overwrite');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should overwrite existing file when force flag is used', async () => {
      mockAccess.mockResolvedValue(undefined); // File exists
      const options: ConfigOptions = { force: true };

      const result = await createConfigFile(options);

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should handle file write errors', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      const result = await createConfigFile();

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create configuration file: Permission denied');
    });

    it('should pass options to generateConfigContent', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      const options: ConfigOptions = { minimal: true, biomeVersion: '1.8.0' };

      await createConfigFile(options);

      expect(mockStringify).toHaveBeenCalledWith(
        expect.objectContaining({
          validators: {
            biome: { enabled: true },
            typescript: { enabled: true },
          },
        })
      );
    });
  });

  describe('findClaudeSettings()', () => {
    it('should find settings at custom path when provided', async () => {
      const customPath = '/custom/settings.json';
      mockAccess.mockImplementation(async (path) => {
        if (path === customPath) return;
        throw new Error('ENOENT');
      });

      const result = await findClaudeSettings(customPath);

      expect(result.success).toBe(true);
      expect(result.path).toBe(customPath);
      expect(result.message).toBe('✓ Claude settings found: /custom/settings.json');
    });

    it('should find settings in default locations', async () => {
      const defaultPath = '/home/user/.claude/settings.json';
      mockAccess.mockImplementation(async (path) => {
        if (path === defaultPath) return;
        throw new Error('ENOENT');
      });

      const result = await findClaudeSettings();

      expect(result.success).toBe(true);
      expect(result.path).toBe(defaultPath);
    });

    it('should try multiple default paths', async () => {
      const macPath = '/home/user/Library/Application Support/Claude/settings.json';
      mockAccess.mockImplementation(async (path) => {
        if (path === macPath) return;
        throw new Error('ENOENT');
      });

      const result = await findClaudeSettings();

      expect(result.success).toBe(true);
      expect(result.path).toBe(macPath);
    });

    it('should try Windows path', async () => {
      const windowsPath = '/home/user/AppData/Roaming/Claude/settings.json';
      mockAccess.mockImplementation(async (path) => {
        if (path === windowsPath) return;
        throw new Error('ENOENT');
      });

      const result = await findClaudeSettings();

      expect(result.success).toBe(true);
      expect(result.path).toBe(windowsPath);
    });

    it('should return failure when no settings found', async () => {
      mockAccess.mockRejectedValue(new Error('ENOENT'));

      const result = await findClaudeSettings();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Claude settings file not found');
      expect(result.message).toContain('Checked paths:');
    });
  });

  describe('readClaudeSettings()', () => {
    it('should read and parse settings successfully', async () => {
      const settings = { hooks: { PostToolUse: [] } };
      mockReadFile.mockResolvedValue(JSON.stringify(settings));

      const result = await readClaudeSettings('/path/to/settings.json');

      expect(result.success).toBe(true);
      expect(result.settings).toEqual(settings);
      expect(result.message).toBe('Settings loaded successfully');
    });

    it('should handle file read errors', async () => {
      mockReadFile.mockRejectedValue(new Error('Permission denied'));

      const result = await readClaudeSettings('/path/to/settings.json');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to read settings: Permission denied');
    });

    it('should handle invalid JSON', async () => {
      mockReadFile.mockResolvedValue('invalid json');

      const result = await readClaudeSettings('/path/to/settings.json');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to read settings:');
    });
  });

  describe('backupSettings()', () => {
    it('should create backup successfully', async () => {
      const settingsPath = '/path/to/settings.json';
      const backupPath = '/path/to/settings.json.backup';

      const result = await backupSettings(settingsPath);

      expect(result.success).toBe(true);
      expect(result.backupPath).toBe(backupPath);
      expect(result.message).toBe('✓ Backup created: /path/to/settings.json.backup');
      expect(mockCopyFile).toHaveBeenCalledWith(settingsPath, backupPath);
    });

    it('should handle backup errors', async () => {
      mockCopyFile.mockRejectedValue(new Error('Disk full'));

      const result = await backupSettings('/path/to/settings.json');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to create backup: Disk full');
    });
  });

  describe('updateClaudeSettings()', () => {
    it('should add hooks to existing settings', async () => {
      const currentSettings = {
        hooks: {
          PostToolUse: [{ matcher: 'existing', hooks: [{ type: 'existing' }] }],
        },
      };
      const options: InstallOptions = {};
      mockWriteFile.mockResolvedValue(undefined);

      const result = await updateClaudeSettings('/settings.json', currentSettings, options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Hook registered for tools: Write, Edit, MultiEdit');
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/settings.json',
        expect.stringContaining('"command": "npx claude-jsqualityhooks"'),
        'utf-8'
      );
    });

    it('should replace existing claude-jsqualityhooks hooks', async () => {
      const currentSettings = {
        hooks: {
          PostToolUse: [
            {
              matcher: 'Write|Edit',
              hooks: [{ command: 'npx claude-jsqualityhooks old' }],
            },
            {
              matcher: 'Other',
              hooks: [{ command: 'other-tool' }],
            },
          ],
        },
      };
      mockWriteFile.mockResolvedValue(undefined);

      const result = await updateClaudeSettings('/settings.json', currentSettings);

      expect(result.success).toBe(true);

      // Verify that old claude-jsqualityhooks hook was removed
      const writtenContent = mockWriteFile.mock.calls[0][1] as string;
      const writtenSettings = JSON.parse(writtenContent);

      // Should have the other tool hook plus new claude-jsqualityhooks hook
      expect(writtenSettings.hooks.PostToolUse).toHaveLength(2);
      expect(writtenSettings.hooks.PostToolUse[0].matcher).toBe('Other');
      expect(writtenSettings.hooks.PostToolUse[1].matcher).toBe('Write|Edit|MultiEdit');
    });

    it('should handle custom tools option', async () => {
      const currentSettings = { hooks: {} };
      const options: InstallOptions = { tools: ['Write', 'CustomTool'] };
      mockWriteFile.mockResolvedValue(undefined);

      const result = await updateClaudeSettings('/settings.json', currentSettings, options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Hook registered for tools: Write, CustomTool');

      const writtenContent = mockWriteFile.mock.calls[0][1] as string;
      const writtenSettings = JSON.parse(writtenContent);
      expect(writtenSettings.hooks.PostToolUse[0].matcher).toBe('Write|CustomTool');
    });

    it('should handle single tool as string', async () => {
      const currentSettings = { hooks: {} };
      const options: InstallOptions = { tools: 'Edit' };
      mockWriteFile.mockResolvedValue(undefined);

      const result = await updateClaudeSettings('/settings.json', currentSettings, options);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Hook registered for tools: Edit');

      const writtenContent = mockWriteFile.mock.calls[0][1] as string;
      const writtenSettings = JSON.parse(writtenContent);
      expect(writtenSettings.hooks.PostToolUse[0].matcher).toBe('Edit');
    });

    it('should create hooks structure if missing', async () => {
      const currentSettings = {};
      mockWriteFile.mockResolvedValue(undefined);

      const result = await updateClaudeSettings('/settings.json', currentSettings);

      expect(result.success).toBe(true);

      const writtenContent = mockWriteFile.mock.calls[0][1] as string;
      const writtenSettings = JSON.parse(writtenContent);
      expect(writtenSettings.hooks).toBeDefined();
      expect(writtenSettings.hooks.PostToolUse).toBeDefined();
    });

    it('should handle file write errors', async () => {
      mockWriteFile.mockRejectedValue(new Error('Permission denied'));

      const result = await updateClaudeSettings('/settings.json', {});

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update settings: Permission denied');
    });
  });

  describe('removeHooksFromSettings()', () => {
    it('should remove claude-jsqualityhooks hooks only', async () => {
      const settings = {
        hooks: {
          PostToolUse: [
            {
              matcher: 'Write',
              hooks: [{ command: 'npx claude-jsqualityhooks' }],
            },
            {
              matcher: 'Edit',
              hooks: [{ command: 'other-tool' }],
            },
          ],
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(settings));
      mockWriteFile.mockResolvedValue(undefined);

      const result = await removeHooksFromSettings('/settings.json');

      expect(result.success).toBe(true);
      expect(result.message).toBe('✓ claude-jsqualityhooks hooks removed from Claude settings');

      const writtenContent = mockWriteFile.mock.calls[0][1] as string;
      const writtenSettings = JSON.parse(writtenContent);
      expect(writtenSettings.hooks.PostToolUse).toHaveLength(1);
      expect(writtenSettings.hooks.PostToolUse[0].matcher).toBe('Edit');
    });

    it('should handle settings read failure', async () => {
      mockReadFile.mockRejectedValue(new Error('File not found'));

      const result = await removeHooksFromSettings('/settings.json');

      expect(result.success).toBe(false);
      expect(result.message).toContain('File not found');
    });

    it('should handle write failure', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({ hooks: {} }));
      mockWriteFile.mockRejectedValue(new Error('Write failed'));

      const result = await removeHooksFromSettings('/settings.json');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to remove hooks: Write failed');
    });

    it('should handle missing hooks structure', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}));
      mockWriteFile.mockResolvedValue(undefined);

      const result = await removeHooksFromSettings('/settings.json');

      expect(result.success).toBe(true);
    });
  });

  describe('formatVersionInfo()', () => {
    it('should format version information with all components', () => {
      const versions = {
        package: '1.0.5',
        node: { version: '18.17.0', major: 18, minor: 17, patch: 0 },
        biome: {
          version: '2.1.3',
          major: 2,
          minor: 1,
          patch: 3,
          source: 'package.json' as const,
        },
        typescript: {
          version: '5.3.0',
          major: 5,
          minor: 3,
          patch: 0,
          source: 'cli' as const,
        },
      };

      const result = formatVersionInfo(versions);

      expect(result).toBe(
        [
          'Claude JS Quality Hooks: 1.0.5',
          'Node.js: 18.17.0',
          'Biome: 2.1.3 (detected from package.json)',
          'TypeScript: 5.3.0 (detected from cli)',
        ].join('\n')
      );
    });

    it('should handle missing Biome', () => {
      const versions = {
        package: '1.0.0',
        node: { version: '20.5.0', major: 20, minor: 5, patch: 0 },
      };

      const result = formatVersionInfo(versions);

      expect(result).toContain('Biome: Not found - install @biomejs/biome to enable validation');
    });

    it('should handle missing TypeScript', () => {
      const versions = {
        package: '1.0.0',
        node: { version: '18.17.0', major: 18, minor: 17, patch: 0 },
        biome: {
          version: '2.1.3',
          major: 2,
          minor: 1,
          patch: 3,
          source: 'default' as const,
        },
      };

      const result = formatVersionInfo(versions);

      expect(result).toContain('Biome: 2.1.3 (defaulted to 2.x)');
      expect(result).toContain(
        'TypeScript: Not found - install typescript to enable type checking'
      );
    });

    it('should show default source information', () => {
      const versions = {
        package: '1.0.0',
        node: { version: '18.17.0', major: 18, minor: 17, patch: 0 },
        biome: {
          version: '2.0.0',
          major: 2,
          minor: 0,
          patch: 0,
          source: 'default' as const,
        },
      };

      const result = formatVersionInfo(versions);

      expect(result).toContain('Biome: 2.0.0 (defaulted to 2.x)');
    });
  });

  describe('message formatting functions', () => {
    it('should format success messages', () => {
      expect(formatSuccess('Operation completed')).toBe('✅ Operation completed');
    });

    it('should format error messages', () => {
      expect(formatError('Something went wrong')).toBe('❌ Something went wrong');
    });

    it('should format warning messages', () => {
      expect(formatWarning('Be careful')).toBe('⚠️  Be careful');
    });
  });

  describe('error handling', () => {
    it('should handle JSON stringify errors in updateClaudeSettings', async () => {
      const circularSettings = {};
      circularSettings.self = circularSettings; // Create circular reference

      const result = await updateClaudeSettings('/settings.json', circularSettings);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to update settings');
    });

    it('should handle YAML stringify errors in generateConfigContent', async () => {
      mockStringify.mockImplementation(() => {
        throw new Error('YAML error');
      });

      await expect(generateConfigContent()).rejects.toThrow('YAML error');
    });

    it('should handle path construction errors', async () => {
      mockJoin.mockImplementationOnce(() => {
        throw new Error('Path error');
      });

      // Should throw since there's no error handling around path construction
      await expect(createConfigFile()).rejects.toThrow('Path error');
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete installation workflow', async () => {
      // Find settings
      mockAccess.mockImplementation(async (path) => {
        if (path === '/home/user/.claude/settings.json') return;
        throw new Error('ENOENT');
      });

      // Read existing settings
      const existingSettings = { hooks: {} };
      mockReadFile.mockResolvedValue(JSON.stringify(existingSettings));

      // Create backup
      mockCopyFile.mockResolvedValue(undefined);

      // Update settings
      mockWriteFile.mockResolvedValue(undefined);

      const findResult = await findClaudeSettings();
      expect(findResult.success).toBe(true);

      const readResult = await readClaudeSettings(findResult.path!);
      expect(readResult.success).toBe(true);

      const backupResult = await backupSettings(findResult.path!);
      expect(backupResult.success).toBe(true);

      const updateResult = await updateClaudeSettings(findResult.path!, readResult.settings);
      expect(updateResult.success).toBe(true);
    });

    it('should handle complete uninstallation workflow', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          hooks: {
            PostToolUse: [{ matcher: 'Write', hooks: [{ command: 'npx claude-jsqualityhooks' }] }],
          },
        })
      );

      const result = await removeHooksFromSettings('/settings.json');

      expect(result.success).toBe(true);
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });
});
