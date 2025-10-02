/**
 * KV Tracker for Recording R2 Sync Timestamps
 *
 * Records when the R2 bucket was last updated with fresh documentation
 * from GitHub. This timestamp is used by the refreshStatus MCP tool.
 */

import { spawn } from 'node:child_process';

/**
 * Record sync completion timestamp in KV namespace
 *
 * @param autoragId - Identifier for the AutoRAG instance (default: "vads-rag-mcp")
 * @returns Success status and any error message
 */
export async function recordSyncTimestamp(
	autoragId: string = 'vads-rag-mcp',
): Promise<{ success: boolean; error?: string }> {
	try {
		const timestamp = Date.now().toString();
		const key = `last-refresh:${autoragId}`;

		// Use wrangler CLI to write to KV
		await wranglerKVPut(key, timestamp);

		return { success: true };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

/**
 * Write a value to KV using wrangler CLI
 */
async function wranglerKVPut(key: string, value: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const args = [
			'kv',
			'key',
			'put',
			'--namespace-id=680e786a6dda42b3a41ed48ae74edb0d',
			'--remote',
			key,
			value,
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
				reject(new Error(`Wrangler KV put failed (code ${code}): ${stderr}`));
			}
		});

		wrangler.on('error', (error) => {
			reject(error);
		});
	});
}
