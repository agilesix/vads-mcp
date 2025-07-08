import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.jsonc" },
				main: "./src/index.ts",
				miniflare: {
					compatibilityFlags: ["nodejs_compat"],
					// Add any test-specific bindings here
					bindings: {
						// Example: TEST_VAR: "test value"
					},
					r2Buckets: {
						VADS_DOCS: "vads-docs",
					},
					// AI binding is not supported in local tests
					// Mock AI calls in tests instead
					durableObjects: {
						MCP_OBJECT: "MyMCP",
					},
				},
			},
		},
		globals: true,
		setupFiles: ["./test/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"node_modules/",
				"test/",
				"**/*.d.ts",
				"**/*.config.*",
				"**/.eslintrc.*",
				"build/",
				"dist/",
			],
		},
	},
	resolve: {
		alias: {
			"@": "./src",
		},
	},
});