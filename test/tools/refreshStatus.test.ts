import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { refreshStatusTool } from "../../src/tools/refreshStatus";

describe("refreshStatus tool", () => {
	let mockEnv: Env;
	let mockKV: Map<string, string>;

	beforeEach(() => {
		// Create a mock KV namespace using a Map
		mockKV = new Map();

		mockEnv = {
			REFRESH_TRACKER: {
				get: async (key: string) => mockKV.get(key) || null,
				put: async (key: string, value: string) => {
					mockKV.set(key, value);
				},
			} as KVNamespace,
		} as Env;
	});

	afterEach(() => {
		mockKV.clear();
	});

	describe("basic validation", () => {
		it("should have correct tool name", () => {
			expect(refreshStatusTool.name).toBe("refreshStatus");
		});

		it("should have a valid schema", () => {
			expect(refreshStatusTool.schema).toBeDefined();
		});

		it("should have a handler function", () => {
			expect(typeof refreshStatusTool.handler).toBe("function");
		});
	});

	describe("schema validation", () => {
		it("should accept valid parameters with default autoragId", () => {
			const result = refreshStatusTool.schema.safeParse({});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.autoragId).toBe("vads-rag-mcp");
			}
		});

		it("should accept custom autoragId", () => {
			const result = refreshStatusTool.schema.safeParse({
				autoragId: "custom-rag",
			});
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.autoragId).toBe("custom-rag");
			}
		});

		it("should reject empty autoragId", () => {
			const result = refreshStatusTool.schema.safeParse({
				autoragId: "",
			});
			expect(result.success).toBe(false);
		});
	});

	describe("no previous refresh", () => {
		it("should return never refreshed message when no data in KV", async () => {
			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Last Manual Refresh:** Never");
			expect(result.content[0].text).toContain(
				"No manual refresh has been recorded",
			);
		});

		it("should include information about automatic reindexing", async () => {
			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("Automatic Reindexing");
			expect(result.content[0].text).toContain("Every 6 hours");
		});

		it("should include information about manual refreshes", async () => {
			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("Manual refreshes");
			expect(result.content[0].text).toContain("sync-utility");
		});

		it("should include dashboard link", async () => {
			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain(
				"https://dash.cloudflare.com/?to=/:account/ai/ai-search",
			);
		});
	});

	describe("with previous refresh", () => {
		it("should show last refresh time and duration", async () => {
			// Simulate a refresh 12 hours ago
			const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", twelveHoursAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("Last Manual Refresh:");
			expect(result.content[0].text).toContain("12h");
			expect(result.content[0].text).toContain("ago");
		});

		it("should show ISO timestamp", async () => {
			const timestamp = Date.now() - 5 * 60 * 60 * 1000; // 5 hours ago
			mockKV.set("last-refresh:vads-rag-mcp", timestamp.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			const isoDate = new Date(timestamp).toISOString();
			expect(result.content[0].text).toContain("ISO:");
			expect(result.content[0].text).toContain(isoDate);
		});

		it("should show time since last refresh", async () => {
			const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", twelveHoursAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("12h ago");
			expect(result.content[0].text).toContain("Automatic Reindexing");
		});

		it("should show estimated auto-reindex cycles", async () => {
			// 18 hours ago = ~3 auto-reindex cycles (every 6 hours)
			const eighteenHoursAgo = Date.now() - 18 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", eighteenHoursAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("auto-reindex cycles");
			expect(result.content[0].text).toMatch(/Likely \d+ auto-reindex cycles/);
		});

		it("should include dashboard link", async () => {
			const timestamp = Date.now() - 5 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", timestamp.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("Monitor Indexing");
			expect(result.content[0].text).toContain(
				"https://dash.cloudflare.com/?to=/:account/ai/ai-search",
			);
		});
	});

	describe("time formatting", () => {
		it("should format recent refresh in minutes", async () => {
			// 45 minutes ago
			const fortyFiveMinutesAgo = Date.now() - 45 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", fortyFiveMinutesAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toMatch(/45 minutes? ago/);
		});

		it("should format refresh in hours and minutes", async () => {
			// 3.5 hours ago
			const threeAndHalfHoursAgo = Date.now() - 3.5 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", threeAndHalfHoursAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toMatch(/3h 30m ago/);
		});

		it("should format refresh in days", async () => {
			// 2 days ago
			const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", twoDaysAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toMatch(/2 days ago/);
		});
	});

	describe("multiple autorag instances", () => {
		it("should track status separately per autoragId", async () => {
			// Set different refresh times for two instances
			const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
			const twentySixHoursAgo = Date.now() - 26 * 60 * 60 * 1000;

			mockKV.set("last-refresh:instance-1", twelveHoursAgo.toString());
			mockKV.set("last-refresh:instance-2", twentySixHoursAgo.toString());

			// Check instance-1
			const result1 = await refreshStatusTool.handler(
				{ autoragId: "instance-1" },
				mockEnv,
			);
			expect(result1.content[0].text).toContain("instance-1");
			expect(result1.content[0].text).toContain("12h ago");

			// Check instance-2
			const result2 = await refreshStatusTool.handler(
				{ autoragId: "instance-2" },
				mockEnv,
			);
			expect(result2.content[0].text).toContain("instance-2");
			expect(result2.content[0].text).toContain("1d");
		});

		it("should show never refreshed for instance without data", async () => {
			// Set refresh for instance-1 only
			const timestamp = Date.now() - 12 * 60 * 60 * 1000;
			mockKV.set("last-refresh:instance-1", timestamp.toString());

			// Check instance-2 which has no data
			const result = await refreshStatusTool.handler(
				{ autoragId: "instance-2" },
				mockEnv,
			);

			expect(result.content[0].text).toContain("Last Manual Refresh:** Never");
		});
	});

	describe("error handling", () => {
		it("should handle KV read errors gracefully", async () => {
			const errorEnv = {
				REFRESH_TRACKER: {
					get: async () => {
						throw new Error("KV read failed");
					},
				} as KVNamespace,
			} as Env;

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				errorEnv,
			);

			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toContain("Error checking refresh status");
			expect(result.content[0].text).toContain("KV read failed");
		});

		it("should provide troubleshooting tips in error messages", async () => {
			const errorEnv = {
				REFRESH_TRACKER: {
					get: async () => {
						throw new Error("Network error");
					},
				} as KVNamespace,
			} as Env;

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				errorEnv,
			);

			expect(result.content[0].text).toContain("Troubleshooting");
			expect(result.content[0].text).toContain("Verify the AutoRAG instance");
			expect(result.content[0].text).toContain("REFRESH_TRACKER");
		});

		it("should include dashboard link in error messages", async () => {
			const errorEnv = {
				REFRESH_TRACKER: {
					get: async () => {
						throw new Error("Test error");
					},
				} as KVNamespace,
			} as Env;

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				errorEnv,
			);

			expect(result.content[0].text).toContain(
				"https://dash.cloudflare.com/?to=/:account/ai/ai-search",
			);
		});
	});

	describe("edge cases", () => {
		it("should handle refresh that just happened (seconds ago)", async () => {
			// 30 seconds ago
			const thirtySecondsAgo = Date.now() - 30 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", thirtySecondsAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			expect(result.content[0].text).toMatch(/\d+ seconds? ago/);
		});

		it("should handle refresh exactly 24 hours ago", async () => {
			// Exactly 24 hours ago
			const exactlyOneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
			mockKV.set("last-refresh:vads-rag-mcp", exactlyOneDayAgo.toString());

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			// Should show the time
			expect(result.content[0].text).toContain("1 day ago");
		});

		it("should handle invalid timestamp gracefully", async () => {
			mockKV.set("last-refresh:vads-rag-mcp", "invalid-timestamp");

			const result = await refreshStatusTool.handler(
				{ autoragId: "vads-rag-mcp" },
				mockEnv,
			);

			// Should still return a response (NaN gets handled)
			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
		});
	});
});
