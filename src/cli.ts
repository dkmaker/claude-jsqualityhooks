/**
 * claude-jsqualityhooks CLI
 *
 * Command-line interface for the Claude JS Quality Hooks extension.
 * This CLI provides commands for initialization, installation, and management.
 *
 * Supports two modes:
 * - CLI Mode: Direct command execution (init, install, version)
 * - Hook Mode: Automatic detection when receiving JSON input from Claude Code
 *
 * @version 1.0.0
 * @author DKMaker
 */

import { Command } from 'commander';
import {
  backupSettings,
  type ConfigOptions,
  createConfigFile,
  findClaudeSettings,
  formatError,
  formatSuccess,
  formatVersionInfo,
  formatWarning,
  type InstallOptions,
  readClaudeSettings,
  removeHooksFromSettings,
  updateClaudeSettings,
} from './cli/helpers.js';
import { runHookMode } from './cli/hookMode.js';
import { version } from './index.js';
import { detectAllVersions, detectBiomeVersion } from './utils/versionDetector.js';

/**
 * Detect if running in hook mode (stdin has data) vs CLI mode
 */
function isHookMode(): boolean {
  // If there are command line arguments, it's definitely CLI mode
  if (process.argv.slice(2).length > 0) {
    return false;
  }

  // If no arguments and stdin is not a TTY, it's likely hook mode
  // In CLI mode, stdin.isTTY should be true
  // In hook mode (piped), stdin.isTTY should be false or undefined
  return process.stdin.isTTY !== true;
}

/**
 * Main CLI application
 */
async function main(): Promise<void> {
  try {
    // Check execution mode first
    if (isHookMode()) {
      // Hook mode - process JSON from stdin
      await runHookMode();
      return;
    }

    // CLI mode - set up commander
    const program = new Command();

    // Configure the main program
    program
      .name('claude-jsqualityhooks')
      .description(
        'Claude Code Hooks extension for TypeScript/JavaScript validation and auto-fixing'
      )
      .version(version);

    // Init command - creates default config file
    program
      .command('init')
      .description('Initialize claude-jsqualityhooks configuration')
      .option('--force', 'Overwrite existing configuration')
      .option('--minimal', 'Create minimal configuration')
      .option('--biome-version <version>', 'Force specific Biome version')
      .action(async (options: ConfigOptions) => {
        console.log('🔧 Initializing claude-jsqualityhooks configuration...');

        try {
          // Create configuration file
          const result = await createConfigFile(options);

          if (!result.success) {
            console.error(formatError(result.message));
            process.exit(1);
            return;
          }

          console.log(formatSuccess(result.message));

          // Detect and report versions
          console.log('\n🔍 Detecting environment...');
          const biomeInfo = await detectBiomeVersion();
          const versions = await detectAllVersions();

          if (biomeInfo.source === 'default') {
            console.log(formatWarning(`Biome not found - defaulted to v${biomeInfo.version}`));
            console.log('   Install Biome: npm install --save-dev @biomejs/biome');
          } else {
            console.log(
              formatSuccess(`Biome detected: v${biomeInfo.version} (from ${biomeInfo.source})`)
            );
          }

          if (versions.typescript) {
            console.log(formatSuccess(`TypeScript detected: v${versions.typescript.version}`));
          } else {
            console.log(
              formatWarning('TypeScript not found - install typescript to enable type checking')
            );
          }

          console.log('\n✅ Configuration complete!');
          console.log('\n📝 Next steps:');
          console.log('1. Run: npx claude-jsqualityhooks install');
          console.log('   This will register the hook with Claude Code');
          console.log('2. The hook will run automatically when Claude modifies files');
        } catch (error) {
          console.error(
            formatError(
              `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
          process.exit(1);
        }
      });

    // Version command - shows all version information
    program
      .command('version')
      .description('Display version information')
      .action(async () => {
        try {
          console.log('🔍 Detecting versions...');
          const versions = await detectAllVersions();
          console.log(`\n${formatVersionInfo(versions)}`);
        } catch (error) {
          console.error(
            formatError(
              `Version detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
          process.exit(1);
        }
      });

    // Install command - sets up hooks integration
    program
      .command('install')
      .description('Register hooks with Claude Code')
      .option('--settings-path <path>', 'Custom Claude settings location')
      .option('--no-backup', 'Skip settings backup')
      .option('--tools <tools>', 'Specify which tools to hook (default: "Write,Edit,MultiEdit")')
      .action(async (options: InstallOptions) => {
        console.log('🔧 Installing claude-jsqualityhooks hooks...');

        try {
          // Find Claude settings file
          const settingsResult = await findClaudeSettings(options.settingsPath);
          if (!settingsResult.success) {
            console.error(formatError(settingsResult.message));
            process.exit(1);
            return;
          }

          console.log(settingsResult.message);
          if (!settingsResult.path) {
            console.error(formatError('Settings path not found'));
            process.exit(1);
            return;
          }
          const settingsPath = settingsResult.path;

          // Read current settings
          const readResult = await readClaudeSettings(settingsPath);
          if (!readResult.success) {
            console.error(formatError(readResult.message));
            process.exit(1);
            return;
          }

          // Create backup unless disabled
          if (options.noBackup !== true) {
            const backupResult = await backupSettings(settingsPath);
            if (!backupResult.success) {
              console.error(formatError(backupResult.message));
              process.exit(1);
              return;
            }
            console.log(backupResult.message);
          }

          // Parse tools option
          if (typeof options.tools === 'string') {
            options.tools = options.tools.split(',').map((s) => s.trim());
          }

          // Update settings with hooks
          if (!readResult.settings) {
            console.error(formatError('Could not read current settings'));
            process.exit(1);
            return;
          }
          const updateResult = await updateClaudeSettings(
            settingsPath,
            readResult.settings,
            options
          );
          if (!updateResult.success) {
            console.error(formatError(updateResult.message));
            process.exit(1);
            return;
          }

          console.log(`\n✅ ${updateResult.message}`);
        } catch (error) {
          console.error(
            formatError(
              `Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
          process.exit(1);
        }
      });

    // Uninstall command - removes hooks
    program
      .command('uninstall')
      .description('Remove hooks from Claude Code')
      .option('--settings-path <path>', 'Custom Claude settings location')
      .action(async (options: { settingsPath?: string }) => {
        console.log('🔧 Uninstalling claude-jsqualityhooks hooks...');

        try {
          // Find Claude settings file
          const settingsResult = await findClaudeSettings(options.settingsPath);
          if (!settingsResult.success) {
            console.error(formatError(settingsResult.message));
            process.exit(1);
            return;
          }

          console.log(settingsResult.message);
          if (!settingsResult.path) {
            console.error(formatError('Settings path not found'));
            process.exit(1);
            return;
          }
          const settingsPath = settingsResult.path;

          // Remove hooks
          const removeResult = await removeHooksFromSettings(settingsPath);
          if (!removeResult.success) {
            console.error(formatError(removeResult.message));
            process.exit(1);
            return;
          }

          console.log(`\n✅ ${removeResult.message}`);
        } catch (error) {
          console.error(
            formatError(
              `Uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            )
          );
          process.exit(1);
        }
      });

    // Parse command line arguments
    program.parse();

    // If no command was provided, show help
    if (!process.argv.slice(2).length) {
      program.outputHelp();
      process.exit(0);
    }
  } catch (error) {
    console.error(
      formatError(`CLI failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    );
    process.exit(1);
  }
}

// Run the main function with proper error handling
main().catch((error) => {
  console.error(
    formatError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  );
  process.exit(1);
});
