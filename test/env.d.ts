/// <reference types="@cloudflare/workers-types" />

declare module "cloudflare:test" {
	interface ProvidedEnv extends Env {
		// Override AI to be optional for testing
		AI?: any;
	}
	export const env: ProvidedEnv;
	export const SELF: Fetcher;
}