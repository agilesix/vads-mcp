/**
 * Upload files to Cloudflare R2 bucket
 */

import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import type { MarkdownFile, UploadResult, SyncOptions } from '../types.js';

/**
 * Upload files to R2 bucket using Wrangler CLI
 *
 * @param files - Array of markdown files to upload
 * @param bucketName - R2 bucket name
 * @param options - Sync options
 * @returns Array of upload results
 */
export async function uploadToR2(
	files: MarkdownFile[],
	bucketName: string,
	options: SyncOptions,
): Promise<UploadResult[]> {
	const results: UploadResult[] = [];

	// Process files with concurrency limit
	for (let i = 0; i < files.length; i += options.concurrency) {
		const batch = files.slice(i, i + options.concurrency);
		const batchResults = await Promise.all(
			batch.map(file => uploadSingleFile(file, bucketName, options)),
		);
		results.push(...batchResults);
	}

	return results;
}

/**
 * Upload a single file to R2
 */
async function uploadSingleFile(
	file: MarkdownFile,
	bucketName: string,
	options: SyncOptions,
): Promise<UploadResult> {
	const startTime = Date.now();

	try {
		if (options.dryRun) {
			// Dry run - just simulate upload
			return {
				file,
				success: true,
				duration: Date.now() - startTime,
			};
		}

		// Upload using wrangler r2 object put
		await wranglerR2Put(bucketName, file.r2Key, file.absolutePath);

		return {
			file,
			success: true,
			duration: Date.now() - startTime,
		};
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);

		return {
			file,
			success: false,
			error: errorMessage,
			duration: Date.now() - startTime,
		};
	}
}

/**
 * Upload a file to R2 using wrangler CLI
 */
async function wranglerR2Put(
	bucketName: string,
	key: string,
	filePath: string,
): Promise<void> {
	return new Promise((resolve, reject) => {
		// Use wrangler r2 object put command
		// Use parent directory's wrangler config (one level up from sync-utility)
		const args = [
			'r2',
			'object',
			'put',
			`${bucketName}/${key}`,
			'--file',
			filePath,
			'--remote',
			'--config',
			'../wrangler.jsonc',
		];

		const wrangler = spawn('npx', ['wrangler', ...args], {
			stdio: 'pipe',
			cwd: process.cwd(),
		});

		let stderr = '';

		wrangler.stderr?.on('data', (data) => {
			stderr += data.toString();
		});

		wrangler.on('close', (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`Wrangler exited with code ${code}: ${stderr}`));
			}
		});

		wrangler.on('error', (error) => {
			reject(error);
		});
	});
}

/**
 * Verify that wrangler is installed and authenticated
 */
export async function verifyWranglerSetup(): Promise<{
	installed: boolean;
	authenticated: boolean;
	error?: string;
}> {
	try {
		// Check if wrangler is installed
		const versionCheck = await runCommand('npx', ['wrangler', '--version']);
		if (!versionCheck.success) {
			return {
				installed: false,
				authenticated: false,
				error: 'Wrangler is not installed',
			};
		}

		// Check if authenticated by running whoami
		const authCheck = await runCommand('npx', ['wrangler', 'whoami']);
		if (!authCheck.success) {
			return {
				installed: true,
				authenticated: false,
				error: 'Not authenticated with Cloudflare. Run: npx wrangler login',
			};
		}

		return {
			installed: true,
			authenticated: true,
		};
	} catch (error) {
		return {
			installed: false,
			authenticated: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Run a command and capture output
 */
async function runCommand(
	command: string,
	args: string[],
): Promise<{ success: boolean; output: string }> {
	return new Promise((resolve) => {
		const proc = spawn(command, args, {
			stdio: 'pipe',
		});

		let output = '';
		let errorOutput = '';

		proc.stdout?.on('data', (data) => {
			output += data.toString();
		});

		proc.stderr?.on('data', (data) => {
			errorOutput += data.toString();
		});

		proc.on('close', (code) => {
			resolve({
				success: code === 0,
				output: output || errorOutput,
			});
		});

		proc.on('error', () => {
			resolve({
				success: false,
				output: errorOutput,
			});
		});
	});
}

/**
 * Delete all files from R2 bucket (use with caution!)
 */
export async function clearR2Bucket(bucketName: string): Promise<void> {
	// This is intentionally not implemented for safety
	// If needed, user should manually clear bucket via dashboard or CLI
	throw new Error('Clearing bucket is not implemented for safety reasons. Please use Cloudflare dashboard or wrangler CLI directly.');
}
