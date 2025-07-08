import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
	test: {
		globals: true,
		pool: "@cloudflare/vitest-pool-workers",
		poolOptions: {
			workers: {
				wrangler: {
					configPath: "./wrangler.jsonc",
				},
			},
		},
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
			"@": resolve(__dirname, "./src"),
		},
	},
});