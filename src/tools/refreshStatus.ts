import { z } from "zod";
import type { ToolDefinition } from "../types";

/**
 * Zod schema for refreshStatus tool parameters
 */
export const refreshStatusSchema = z.object({
	autoragId: z
		.string()
		.min(1)
		.default("vads-rag-mcp")
		.describe(
			"AutoRAG instance identifier to check status for. Default: 'vads-rag-mcp'.",
		),
});

/**
 * Format milliseconds as human-readable time duration
 */
function formatDuration(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) {
		const remainingHours = hours % 24;
		return remainingHours > 0
			? `${days}d ${remainingHours}h`
			: `${days} day${days > 1 ? "s" : ""}`;
	}
	if (hours > 0) {
		const remainingMinutes = minutes % 60;
		return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
	}
	if (minutes > 0) {
		return `${minutes} minute${minutes > 1 ? "s" : ""}`;
	}
	return `${seconds} second${seconds !== 1 ? "s" : ""}`;
}

/**
 * Format timestamp as ISO string
 */
function formatTimestamp(timestamp: number): string {
	return new Date(timestamp).toISOString();
}

/**
 * Format timestamp as human-readable date and time
 */
function formatReadableDate(timestamp: number): string {
	const date = new Date(timestamp);
	return date.toLocaleString("en-US", {
		weekday: "short",
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		timeZoneName: "short",
	});
}

/**
 * Calculate time until next available refresh
 */
function calculateNextRefresh(lastRefresh: number): {
	timestamp: number;
	timeRemaining: number;
	available: boolean;
} {
	const RATE_LIMIT_MS = 24 * 60 * 60 * 1000; // 24 hours
	const nextRefresh = lastRefresh + RATE_LIMIT_MS;
	const now = Date.now();
	const timeRemaining = nextRefresh - now;

	return {
		timestamp: nextRefresh,
		timeRemaining: timeRemaining > 0 ? timeRemaining : 0,
		available: timeRemaining <= 0,
	};
}

/**
 * Refresh Status Tool
 *
 * Shows when the R2 bucket was last updated with fresh documentation from GitHub.
 * This indicates when new documentation content was synced, NOT when AutoRAG reindexed.
 *
 * ## What This Tool Shows
 *
 * - **Last R2 Bucket Update**: When documentation files were last synced from GitHub to R2
 * - **Time Since Update**: How long ago the R2 bucket received new content
 * - **Files Synced**: When documentation was last uploaded using sync-utility
 *
 * ## What This Tool Does NOT Show
 *
 * - AutoRAG reindexing status (AutoRAG automatically reindexes every 6 hours)
 * - Individual file modification times
 * - Git commit history
 *
 * ## Use Cases
 *
 * - Check if R2 has the latest documentation from GitHub
 * - Verify that sync-utility successfully updated R2
 * - Monitor when documentation content was last refreshed
 * - Track R2 bucket update history
 *
 * ## Non-Invasive Operation
 *
 * This tool only reads data from KV storage and does not:
 * - Trigger any syncs or updates
 * - Modify any data
 * - Incur any costs beyond a single KV read operation
 *
 * @example
 * ```typescript
 * // Check R2 bucket update status
 * await refreshStatus({
 *   autoragId: "vads-rag-mcp"
 * });
 * // Returns: When R2 bucket was last updated with documentation
 * ```
 */
export const refreshStatusTool: ToolDefinition = {
	name: "refreshStatus",
	schema: refreshStatusSchema,
	handler: async ({ autoragId }, env: Env) => {
		try {
			// Check KV for last refresh timestamp
			const key = `last-refresh:${autoragId}`;
			const lastRefreshStr = await env.REFRESH_TRACKER.get(key);

			// If no refresh has been recorded
			if (!lastRefreshStr) {
				return {
					content: [
						{
							type: "text" as const,
							text: `**📊 R2 Bucket Status: ${autoragId}**\n\n**Last R2 Update:** Never\n\nNo R2 bucket update has been recorded.\n\n## What This Means\n\n- The R2 bucket may contain initial/seed data\n- Documentation has not been synced from GitHub using sync-utility\n- To update R2 with latest docs, run: \`cd sync-utility && npm run sync\`\n\n## Important\n\n- **R2 Updates**: Manual sync using sync-utility uploads fresh docs from GitHub\n- **AutoRAG Indexing**: Happens automatically every 6 hours (separate from R2 updates)\n- This tool tracks R2 bucket updates, NOT AutoRAG reindexing\n\n**To update R2 bucket:** Run sync-utility to fetch latest docs from GitHub\n**Dashboard:** https://dash.cloudflare.com/?to=/:account/r2`,
						},
					],
				};
			}

			// Parse stored timestamp
			const lastRefresh = Number.parseInt(lastRefreshStr, 10);
			const now = Date.now();
			const timeSinceRefresh = now - lastRefresh;
			const nextRefresh = calculateNextRefresh(lastRefresh);

			// Format timestamps
			const lastRefreshISO = formatTimestamp(lastRefresh);
			const lastRefreshReadable = formatReadableDate(lastRefresh);
			const timeSinceFormatted = formatDuration(timeSinceRefresh);

			// Build status message
			let statusMessage = `**📊 R2 Bucket Status: ${autoragId}**\n\n`;
			statusMessage += `**Last R2 Update (Documentation Sync):**\n`;
			statusMessage += `- **Time:** ${lastRefreshReadable}\n`;
			statusMessage += `- **ISO:** ${lastRefreshISO}\n`;
			statusMessage += `- **Ago:** ${timeSinceFormatted} ago\n\n`;

			statusMessage += `This timestamp shows when the R2 bucket was last updated with fresh documentation from the GitHub repository using sync-utility.\n\n`;

			// AutoRAG indexing info
			statusMessage += `## AutoRAG Indexing (Separate Process)\n\n`;
			statusMessage += `After R2 updates, AutoRAG automatically reindexes:\n`;
			statusMessage += `- **AutoRAG Frequency**: Every 6 hours (automatic)\n`;
			statusMessage += `- **R2 last updated**: ${timeSinceFormatted} ago\n`;
			statusMessage += `- **Estimated reindex cycles**: ~${Math.floor(timeSinceRefresh / (6 * 60 * 60 * 1000))} times since last R2 update\n\n`;
			statusMessage += `**Note:** AutoRAG indexing happens automatically. This tool tracks when R2 bucket receives new documentation content.\n\n`;

			// Dashboard links
			statusMessage += `## Dashboards\n\n`;
			statusMessage += `- **R2 Bucket:** https://dash.cloudflare.com/?to=/:account/r2\n`;
			statusMessage += `- **AutoRAG Indexing:** https://dash.cloudflare.com/?to=/:account/ai/ai-search\n\n`;
			statusMessage += `**To update R2:** Run \`cd sync-utility && npm run sync\` to fetch latest docs from GitHub.`;

			return {
				content: [
					{
						type: "text" as const,
						text: statusMessage,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `**Error checking R2 bucket status:**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Troubleshooting:**\n- Verify the identifier "${autoragId}" is correct\n- Check KV namespace "REFRESH_TRACKER" is properly configured in wrangler.jsonc\n- Ensure you have proper permissions to read from KV\n- Check Cloudflare dashboard for any service issues\n\n**Dashboards:**\n- R2: https://dash.cloudflare.com/?to=/:account/r2\n- KV: https://dash.cloudflare.com/?to=/:account/workers/kv/namespaces`,
					},
				],
			};
		}
	},
};
