/**
 * Configuration for the VA Docs Sync Utility
 *
 * This file contains all configurable settings for syncing VA Design System
 * documentation from GitHub to Cloudflare R2.
 */

import type { SyncConfig, SyncOptions } from './types.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get current directory (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Default configuration for the sync process
 */
export const DEFAULT_CONFIG: SyncConfig = {
	// GitHub repository containing VA Design System documentation
	repoUrl: 'https://github.com/department-of-veterans-affairs/vets-design-system-documentation.git',

	// Local path to clone repository (relative to sync-utility root)
	localRepoPath: path.join(__dirname, '..', 'tmp', 'vets-design-system-documentation'),

	// R2 bucket name (must match wrangler.jsonc binding)
	r2BucketName: 'vads-docs',

	// Optional: Base path in R2 bucket (prefix for all uploaded files)
	// Leave undefined to upload to root of bucket
	r2BasePath: undefined,

	// Smart discovery: Automatically find ALL markdown files in src/
	smartDiscovery: {
		baseDirectory: 'src',

		// Exclude patterns: Files we DON'T want to sync
		excludePatterns: [
			// Build and dependency directories
			'node_modules/**',
			'_site/**',
			'dist/**',

			// Development and testing
			'**/*.test.md',
			'**/*.spec.md',
			'__tests__/**',
			'__mocks__/**',

			// Meta files and READMEs at repo root
			'README.md',
			'CONTRIBUTING.md',
			'CHANGELOG.md',
			'LICENSE.md',

			// Jekyll internals
			'_plugins/**',
			'_layouts/**',

			// Assets (we only want markdown docs)
			'assets/**',
			'downloads/**',
			'img/**',

			// Any other non-documentation files
			'scripts/**',
			'config/**',
		],
	},
};

/**
 * Default options for sync operations
 */
export const DEFAULT_OPTIONS: SyncOptions = {
	// Dry run mode: preview changes without uploading
	dryRun: false,

	// Verbose logging
	verbose: false,

	// Maximum concurrent uploads to R2
	concurrency: 5,
};

/**
 * Parse command line arguments to override default options
 */
export function parseCliOptions(args: string[]): Partial<SyncOptions> {
	const options: Partial<SyncOptions> = {};

	if (args.includes('--dry-run') || args.includes('-d')) {
		options.dryRun = true;
	}

	if (args.includes('--verbose') || args.includes('-v')) {
		options.verbose = true;
	}

	const concurrencyIndex = args.findIndex(arg => arg === '--concurrency' || arg === '-c');
	if (concurrencyIndex !== -1 && args[concurrencyIndex + 1]) {
		const value = Number.parseInt(args[concurrencyIndex + 1], 10);
		if (!Number.isNaN(value) && value > 0) {
			options.concurrency = value;
		}
	}

	return options;
}

/**
 * Get final configuration by merging defaults with environment variables
 */
export function getConfig(): SyncConfig {
	return {
		...DEFAULT_CONFIG,
		// Allow environment variable overrides
		repoUrl: process.env.REPO_URL || DEFAULT_CONFIG.repoUrl,
		r2BucketName: process.env.R2_BUCKET_NAME || DEFAULT_CONFIG.r2BucketName,
		r2BasePath: process.env.R2_BASE_PATH || DEFAULT_CONFIG.r2BasePath,
	};
}

/**
 * Get final options by merging defaults with CLI arguments
 */
export function getOptions(): SyncOptions {
	const cliOptions = parseCliOptions(process.argv.slice(2));
	return {
		...DEFAULT_OPTIONS,
		...cliOptions,
	};
}
