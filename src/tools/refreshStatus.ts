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
 * Provides information about the last documentation refresh and when the next
 * manual refresh will be available. This tool helps users understand the current
 * state of the documentation index without triggering any changes.
 *
 * ## What This Tool Shows
 *
 * - **Last Refresh Time**: When the last manual refresh was triggered
 * - **Time Since Refresh**: How long ago the last refresh occurred
 * - **Next Available Refresh**: When the next manual refresh can be triggered
 * - **Automatic Reindexing**: Reminder about AI Search's 6-hour auto-reindex
 * - **Dashboard Link**: Direct link to monitor indexing status
 *
 * ## Use Cases
 *
 * - Check if documentation is up-to-date
 * - Determine when you can trigger another refresh
 * - Verify that a previous refresh was recorded
 * - Monitor refresh history for troubleshooting
 *
 * ## Non-Invasive Operation
 *
 * This tool only reads data from KV storage and does not:
 * - Trigger any refreshes or reindexing
 * - Modify any data
 * - Incur any costs beyond a single KV read operation
 *
 * @example
 * ```typescript
 * // Check status for default instance
 * await refreshStatus({
 *   autoragId: "vads-rag-mcp"
 * });
 * // Returns: Status information with timestamps and availability
 *
 * // Check status for custom instance
 * await refreshStatus({
 *   autoragId: "custom-rag-instance"
 * });
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
							text: `**📊 Refresh Status: ${autoragId}**\n\n**Last Manual Refresh:** Never\n\nNo manual refresh has been recorded for this AutoRAG instance.\n\n## What This Means\n\n- The documentation is using initial data or auto-synced content\n- AI Search automatically reindexes data every **6 hours**\n- Manual refreshes must be performed by administrators using the sync-utility\n\n## Automatic Reindexing\n\nAI Search (AutoRAG) automatically detects changes in your R2 bucket and reindexes:\n- **Frequency**: Every 6 hours\n- **Detection**: Automatic when files change in R2\n- **No action needed**: System handles updates automatically\n\n**Dashboard:** https://dash.cloudflare.com/?to=/:account/ai/ai-search`,
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
			let statusMessage = `**📊 Refresh Status: ${autoragId}**\n\n`;
			statusMessage += `**Last Manual Refresh:**\n`;
			statusMessage += `- **Time:** ${lastRefreshReadable}\n`;
			statusMessage += `- **ISO:** ${lastRefreshISO}\n`;
			statusMessage += `- **Ago:** ${timeSinceFormatted} ago\n\n`;

			// Automatic reindexing reminder
			statusMessage += `## Automatic Reindexing\n\n`;
			statusMessage += `AI Search (AutoRAG) automatically reindexes your data:\n`;
			statusMessage += `- **Frequency**: Every 6 hours\n`;
			statusMessage += `- **Last manual refresh**: ${timeSinceFormatted} ago\n`;
			statusMessage += `- **Auto-reindex intervals**: Likely ${Math.floor(timeSinceRefresh / (6 * 60 * 60 * 1000))} auto-reindex cycles since last manual refresh\n\n`;
			statusMessage += `Most documentation updates are handled automatically without manual intervention.\n\n`;

			// Dashboard link
			statusMessage += `## Monitor Indexing\n\n`;
			statusMessage += `Track current indexing status and history:\n`;
			statusMessage += `**Dashboard:** https://dash.cloudflare.com/?to=/:account/ai/ai-search\n\n`;
			statusMessage += `Navigate to your AI Search instance and check the "Jobs" tab for real-time indexing status.`;

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
						text: `**Error checking refresh status:**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Troubleshooting:**\n- Verify the AutoRAG instance "${autoragId}" exists and is accessible\n- Check KV namespace "REFRESH_TRACKER" is properly configured\n- Ensure you have proper permissions to read from KV\n- Check Cloudflare dashboard for any service issues\n\n**Dashboard:** https://dash.cloudflare.com/?to=/:account/ai/ai-search`,
					},
				],
			};
		}
	},
};
