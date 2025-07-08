import type { GitHubConfig } from "../types";

export class GitHubService {
	private config: GitHubConfig;
	private cache: Map<string, { data: any; timestamp: number }> = new Map();
	private cacheTimeout = 5 * 60 * 1000; // 5 minutes

	constructor(config: GitHubConfig = {}) {
		this.config = {
			baseUrl: "https://api.github.com",
			userAgent: "VA-Design-System-MCP/1.0.0",
			...config,
		};
	}

	async fetchFromGitHub(url: string): Promise<Response> {
		const cacheKey = url;
		const cached = this.cache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return new Response(JSON.stringify(cached.data), {
				headers: { "Content-Type": "application/json" },
			});
		}

		const headers: HeadersInit = {
			"User-Agent": this.config.userAgent!,
			Accept: "application/vnd.github.v3+json",
		};

		if (this.config.token) {
			headers.Authorization = `token ${this.config.token}`;
		}

		const response = await fetch(url, { headers });

		if (response.ok) {
			const data = await response.json();
			this.cache.set(cacheKey, { data, timestamp: Date.now() });
		}

		return response;
	}

	async fetchRawContent(url: string): Promise<string> {
		const cacheKey = `raw:${url}`;
		const cached = this.cache.get(cacheKey);

		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return cached.data;
		}

		const headers: HeadersInit = {
			"User-Agent": this.config.userAgent!,
		};

		if (this.config.token) {
			headers.Authorization = `token ${this.config.token}`;
		}

		const response = await fetch(url, { headers });

		if (!response.ok) {
			throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
		}

		const content = await response.text();
		this.cache.set(cacheKey, { data: content, timestamp: Date.now() });

		return content;
	}

	clearCache() {
		this.cache.clear();
	}
}
