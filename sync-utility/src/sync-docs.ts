#!/usr/bin/env node
/**
 * VA Design System Documentation Sync Utility
 *
 * This script syncs markdown documentation from the VA Design System GitHub
 * repository to a Cloudflare R2 bucket for use with AutoRAG search.
 *
 * Usage:
 *   npm run sync              # Full sync
 *   npm run sync:dry-run      # Preview without uploading
 *   tsx src/sync-docs.ts -v   # Verbose output
 */

import { getConfig, getOptions } from './config.js';
import type { SyncStats } from './types.js';
import { cloneOrPullRepo } from './lib/git-clone.js';
import { findMarkdownFiles, calculateTotalSize } from './lib/markdown-finder.js';
import { uploadToR2, verifyWranglerSetup } from './lib/r2-uploader.js';
import { createLogger } from './lib/logger.js';
import { recordSyncTimestamp } from './lib/kv-tracker.js';

/**
 * Main entry point for the sync utility
 */
async function main(): Promise<void> {
	const config = getConfig();
	const options = getOptions();
	const logger = createLogger(options.verbose);

	logger.section('🚀 VA Design System Documentation Sync Utility');

	if (options.dryRun) {
		logger.warn('DRY RUN MODE - No files will be uploaded');
		console.log('');
	}

	// Display configuration
	console.log('Configuration:');
	console.log(`  Repository: ${config.repoUrl}`);
	console.log(`  Local Path: ${config.localRepoPath}`);
	console.log(`  R2 Bucket: ${config.r2BucketName}`);
	console.log(`  Base Directory: ${config.smartDiscovery.baseDirectory}`);
	console.log(`  Concurrency: ${options.concurrency}`);
	console.log('');

	const startTime = Date.now();
	const stats: SyncStats = {
		totalFiles: 0,
		uploaded: 0,
		failed: 0,
		skipped: 0,
		totalBytes: 0,
		duration: 0,
		errors: [],
	};

	try {
		// Step 0: Verify Wrangler setup (only if not dry run)
		if (!options.dryRun) {
			logger.step(0, 'Verifying Wrangler setup...');
			const setup = await verifyWranglerSetup();

			if (!setup.installed) {
				logger.error('Wrangler is not installed');
				logger.info('Install: npm install -g wrangler');
				process.exit(1);
			}

			if (!setup.authenticated) {
				logger.error('Not authenticated with Cloudflare');
				logger.info('Run: npx wrangler login');
				process.exit(1);
			}

			logger.success('Wrangler is ready');
			console.log('');
		}

		// Step 1: Clone or pull repository
		logger.step(1, 'Cloning/pulling repository...');
		const gitResult = await cloneOrPullRepo(config.repoUrl, config.localRepoPath);

		if (!gitResult.success) {
			logger.error(`Git operation failed: ${gitResult.error}`);
			process.exit(1);
		}

		console.log('');

		// Step 2: Find markdown files
		logger.step(2, 'Finding markdown files...');
		const files = await findMarkdownFiles(config);

		stats.totalFiles = files.length;
		stats.totalBytes = calculateTotalSize(files);

		logger.success(`Found ${files.length} markdown files`);
		logger.info(`Total size: ${logger.formatBytes(stats.totalBytes)}`);
		console.log('');

		if (files.length === 0) {
			logger.warn('No markdown files found. Exiting.');
			process.exit(0);
		}

		// Step 3: Upload to R2
		logger.step(3, `Uploading to R2${options.dryRun ? ' (dry run)' : ''}...`);

		const uploadResults = await uploadToR2(files, config.r2BucketName, options);

		// Process results
		for (const result of uploadResults) {
			if (result.success) {
				stats.uploaded++;
				logger.debug(`✓ ${result.file.r2Key}`);
			} else {
				stats.failed++;
				stats.errors.push({
					file: result.file.r2Key,
					error: result.error || 'Unknown error',
				});
				logger.error(`✗ ${result.file.r2Key}: ${result.error}`);
			}

			// Show progress
			logger.progress(stats.uploaded + stats.failed, stats.totalFiles, result.file.r2Key);
		}

		console.log('');

		// Calculate duration
		stats.duration = Date.now() - startTime;

		// Step 4: Record sync timestamp (only on successful sync, not dry run)
		if (!options.dryRun && stats.failed === 0) {
			logger.step(4, 'Recording sync timestamp...');
			const kvResult = await recordSyncTimestamp();

			if (kvResult.success) {
				logger.success('Timestamp recorded in KV');
			} else {
				logger.warn(`Failed to record timestamp: ${kvResult.error}`);
				logger.info('Sync completed successfully, but refreshStatus tool may show outdated time');
			}
			console.log('');
		}

		// Display results
		displayResults(stats, options.dryRun, logger);

		if (stats.failed > 0) {
			process.exit(1);
		}

		process.exit(0);
	} catch (error) {
		logger.error('Sync failed');
		console.error(error instanceof Error ? error.message : String(error));
		process.exit(1);
	}
}

/**
 * Display sync results and statistics
 */
function displayResults(stats: SyncStats, isDryRun: boolean, logger: ReturnType<typeof createLogger>): void {
	logger.divider('═');
	console.log(`\n${isDryRun ? '🔍 DRY RUN' : '✅ SYNC'} COMPLETE\n`);

	logger.stats({
		'Total Files': stats.totalFiles,
		'Uploaded': stats.uploaded,
		'Failed': stats.failed,
		'Skipped': stats.skipped,
		'Total Size': logger.formatBytes(stats.totalBytes),
		'Duration': logger.formatDuration(stats.duration),
	});

	if (stats.errors.length > 0) {
		console.log(`\n⚠️  Errors (${stats.errors.length}):`);
		for (const error of stats.errors) {
			console.log(`  - ${error.file}: ${error.error}`);
		}
	}

	console.log('');
	logger.divider('═');
}

// Run the main function
main();
