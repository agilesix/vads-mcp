/**
 * Git operations for cloning and updating repositories
 */

import { simpleGit, type SimpleGit } from 'simple-git';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { GitOperationResult } from '../types.js';

/**
 * Clone a repository or pull latest changes if it already exists
 *
 * @param repoUrl - GitHub repository URL
 * @param localPath - Local path to clone/pull to
 * @returns Result of the git operation
 */
export async function cloneOrPullRepo(
	repoUrl: string,
	localPath: string,
): Promise<GitOperationResult> {
	try {
		const git: SimpleGit = simpleGit();

		// Check if directory exists
		const dirExists = await checkDirectoryExists(localPath);

		if (dirExists) {
			// Directory exists, try to pull
			console.log(`  📂 Repository already exists at ${localPath}`);
			console.log('  🔄 Pulling latest changes...');

			const repoGit = simpleGit(localPath);

			// Ensure we're on the main branch
			await repoGit.checkout('main');

			// Pull latest changes
			await repoGit.pull('origin', 'main');

			// Get current commit hash
			const log = await repoGit.log({ maxCount: 1 });
			const commitHash = log.latest?.hash;

			console.log(`  ✅ Successfully pulled latest changes`);
			console.log(`  📝 Current commit: ${commitHash?.substring(0, 7)}`);

			return {
				success: true,
				action: 'pulled',
				commitHash,
			};
		} else {
			// Directory doesn't exist, clone it
			console.log(`  📥 Cloning repository to ${localPath}...`);

			// Ensure parent directory exists
			const parentDir = path.dirname(localPath);
			await fs.mkdir(parentDir, { recursive: true });

			// Clone repository
			await git.clone(repoUrl, localPath);

			const repoGit = simpleGit(localPath);

			// Get current commit hash
			const log = await repoGit.log({ maxCount: 1 });
			const commitHash = log.latest?.hash;

			console.log(`  ✅ Successfully cloned repository`);
			console.log(`  📝 Current commit: ${commitHash?.substring(0, 7)}`);

			return {
				success: true,
				action: 'cloned',
				commitHash,
			};
		}
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		console.error(`  ❌ Git operation failed: ${errorMessage}`);

		return {
			success: false,
			action: 'cloned',
			error: errorMessage,
		};
	}
}

/**
 * Check if a directory exists
 */
async function checkDirectoryExists(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Get information about the repository
 */
export async function getRepoInfo(localPath: string): Promise<{
	branch: string;
	commitHash: string;
	commitMessage: string;
} | null> {
	try {
		const git = simpleGit(localPath);

		// Get current branch
		const status = await git.status();
		const branch = status.current || 'unknown';

		// Get latest commit
		const log = await git.log({ maxCount: 1 });
		const latest = log.latest;

		if (!latest) {
			return null;
		}

		return {
			branch,
			commitHash: latest.hash,
			commitMessage: latest.message,
		};
	} catch (error) {
		console.error(`Failed to get repo info: ${error}`);
		return null;
	}
}
