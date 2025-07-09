import type { GitHubConfig } from "../types";

/**
 * GitHubService - Manages GitHub API interactions with intelligent caching
 * 
 * This service provides a centralized interface for fetching content from GitHub
 * repositories, specifically optimized for the VA Design System component library.
 * It implements caching to reduce API calls and improve performance.
 * 
 * ## Features
 * - Automatic caching with configurable TTL (default: 5 minutes)
 * - Support for both authenticated and public API requests
 * - Separate caching for JSON API responses and raw file content
 * - Proper error handling and status code management
 * - Rate limit awareness through Authorization headers
 * 
 * ## Usage
 * ```typescript
 * // Initialize with optional authentication
 * const github = new GitHubService({
 *   token: process.env.GITHUB_TOKEN,
 *   userAgent: 'MyApp/1.0.0'
 * });
 * 
 * // Fetch raw TypeScript definitions
 * const content = await github.fetchRawContent(
 *   'https://raw.githubusercontent.com/department-of-veterans-affairs/component-library/main/packages/web-components/src/components.d.ts'
 * );
 * 
 * // Clear cache when needed
 * github.clearCache();
 * ```
 * 
 * @see https://docs.github.com/en/rest
 */
export class GitHubService {
	private config: GitHubConfig;
	private cache: Map<string, { data: any; timestamp: number }> = new Map();
	private cacheTimeout = 5 * 60 * 1000; // 5 minutes

	/**
	 * Creates a new GitHub service instance
	 * 
	 * @param config - Configuration options for GitHub API access
	 * @param config.token - Optional GitHub personal access token for higher rate limits
	 * @param config.baseUrl - API base URL (defaults to https://api.github.com)
	 * @param config.userAgent - User agent string for API requests
	 */
	constructor(config: GitHubConfig = {}) {
		this.config = {
			baseUrl: "https://api.github.com",
			userAgent: "VA-Design-System-MCP/1.0.0",
			...config,
		};
	}

	/**
	 * Fetches data from GitHub API with caching support
	 * 
	 * This method is used for standard GitHub API endpoints that return JSON.
	 * It automatically caches successful responses to reduce API calls.
	 * 
	 * @param url - Full GitHub API URL to fetch
	 * @returns Promise resolving to the fetch Response object
	 * 
	 * @example
	 * ```typescript
	 * const response = await github.fetchFromGitHub(
	 *   'https://api.github.com/repos/department-of-veterans-affairs/component-library/contents/packages'
	 * );
	 * const data = await response.json();
	 * ```
	 */
	async fetchFromGitHub(url: string): Promise<Response> {
		const cacheKey = url;
		const cached = this.cache.get(cacheKey);

		// Return cached response if still valid
		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return new Response(JSON.stringify(cached.data), {
				headers: { "Content-Type": "application/json" },
			});
		}

		// Build request headers
		const headers: HeadersInit = {
			"User-Agent": this.config.userAgent!,
			Accept: "application/vnd.github.v3+json",
		};

		// Add authentication if token provided
		if (this.config.token) {
			headers.Authorization = `token ${this.config.token}`;
		}

		const response = await fetch(url, { headers });

		// Cache successful responses
		if (response.ok) {
			const data = await response.json();
			this.cache.set(cacheKey, { data, timestamp: Date.now() });
		}

		return response;
	}

	/**
	 * Fetches raw file content from GitHub
	 * 
	 * Optimized for fetching raw file content (like TypeScript definitions)
	 * directly from GitHub. Uses a separate cache key prefix to avoid
	 * conflicts with API responses.
	 * 
	 * @param url - Direct URL to raw GitHub content
	 * @returns Promise resolving to the file content as a string
	 * @throws Error if the fetch fails (non-2xx status)
	 * 
	 * @example
	 * ```typescript
	 * try {
	 *   const tsDefinitions = await github.fetchRawContent(
	 *     'https://raw.githubusercontent.com/user/repo/main/file.ts'
	 *   );
	 *   console.log(tsDefinitions);
	 * } catch (error) {
	 *   console.error('Failed to fetch file:', error);
	 * }
	 * ```
	 */
	async fetchRawContent(url: string): Promise<string> {
		const cacheKey = `raw:${url}`;
		const cached = this.cache.get(cacheKey);

		// Return cached content if still valid
		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return cached.data;
		}

		// Build minimal headers for raw content
		const headers: HeadersInit = {
			"User-Agent": this.config.userAgent!,
		};

		// Add authentication if token provided
		if (this.config.token) {
			headers.Authorization = `token ${this.config.token}`;
		}

		const response = await fetch(url, { headers });

		// Throw descriptive error for failed requests
		if (!response.ok) {
			throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
		}

		// Cache and return content
		const content = await response.text();
		this.cache.set(cacheKey, { data: content, timestamp: Date.now() });

		return content;
	}

	/**
	 * Clears all cached responses
	 * 
	 * Useful for forcing fresh data or freeing memory.
	 * Should be called when you know the remote data has changed.
	 * 
	 * @example
	 * ```typescript
	 * // Clear cache after deployment or known updates
	 * github.clearCache();
	 * ```
	 */
	clearCache() {
		this.cache.clear();
	}
}