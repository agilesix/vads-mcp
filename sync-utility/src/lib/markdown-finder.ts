/**
 * Find markdown files using smart discovery
 */

import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { MarkdownFile, SyncConfig } from '../types.js';

/**
 * Find all markdown files using smart discovery with exclusion patterns
 *
 * @param config - Sync configuration
 * @returns Array of markdown file information
 */
export async function findMarkdownFiles(config: SyncConfig): Promise<MarkdownFile[]> {
	const { baseDirectory, excludePatterns, includePatterns } = config.smartDiscovery;
	const searchBase = path.join(config.localRepoPath, baseDirectory);

	console.log(`  🔍 Smart discovery enabled`);
	console.log(`  📂 Base directory: ${baseDirectory}`);
	console.log(`  🚫 Exclude patterns: ${excludePatterns.length} configured`);

	// Build glob pattern
	const pattern = path.join(searchBase, '**', '*.md');

	// Find all markdown files
	const files = await glob(pattern, {
		nodir: true,
		absolute: true,
		ignore: excludePatterns.map(p => path.join(searchBase, p)),
	});

	console.log(`  ✅ Found ${files.length} markdown files (after exclusions)`);

	// Apply include patterns if specified
	let filteredFiles = files;
	if (includePatterns && includePatterns.length > 0) {
		filteredFiles = files.filter(file => {
			const relativePath = path.relative(searchBase, file);
			return includePatterns.some(pattern => {
				return relativePath.includes(pattern) || file.includes(pattern);
			});
		});
		console.log(`  ✅ After include filter: ${filteredFiles.length} files`);
	}

	// Get file info for each markdown file
	const markdownFiles: MarkdownFile[] = [];
	for (const filePath of filteredFiles) {
		const fileInfo = await getMarkdownFileInfo(filePath, config);
		if (fileInfo) {
			markdownFiles.push(fileInfo);
		}
	}

	return markdownFiles;
}

/**
 * Get information about a markdown file
 */
async function getMarkdownFileInfo(
	absolutePath: string,
	config: SyncConfig,
): Promise<MarkdownFile | null> {
	try {
		const stats = await fs.stat(absolutePath);

		// Calculate relative path from repo root
		const relativePath = path.relative(config.localRepoPath, absolutePath);

		// Calculate R2 key (path in bucket)
		// If r2BasePath is set, prepend it
		const r2Key = config.r2BasePath
			? path.join(config.r2BasePath, relativePath)
			: relativePath;

		return {
			absolutePath,
			relativePath,
			r2Key: r2Key.replace(/\\/g, '/'), // Ensure forward slashes for R2
			size: stats.size,
			lastModified: stats.mtime,
		};
	} catch (error) {
		console.error(`  ⚠️  Could not get info for ${absolutePath}:`, error);
		return null;
	}
}


/**
 * Group files by directory for display
 */
export function groupFilesByDirectory(files: MarkdownFile[]): Map<string, MarkdownFile[]> {
	const grouped = new Map<string, MarkdownFile[]>();

	for (const file of files) {
		const dir = path.dirname(file.relativePath);
		const existing = grouped.get(dir) || [];
		existing.push(file);
		grouped.set(dir, existing);
	}

	return grouped;
}

/**
 * Calculate total size of all files
 */
export function calculateTotalSize(files: MarkdownFile[]): number {
	return files.reduce((total, file) => total + file.size, 0);
}
