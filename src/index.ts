import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools";
import { GitHubService } from "./services/github";
import { ComponentParser } from "./services/componentParser";
import type { GitHubConfig } from "./types";

/**
 * VA Design System MCP Server
 *
 * A Model Context Protocol (MCP) server that provides AI assistants with tools
 * to interact with the VA Design System component library. This server enables
 * intelligent assistance for developers using VA components by providing:
 * 
 * - **Documentation Search**: Search the VA Design System documentation using AutoRAG
 * - **Component Discovery**: List and filter components by maturity status
 * - **Property Inspection**: Extract component properties from TypeScript definitions
 * - **Example Generation**: Generate contextual usage examples based on component analysis
 * 
 * ## Architecture
 * 
 * The server is built on Cloudflare Workers and follows a modular architecture:
 * - **Core Services**: GitHubService for API access, ComponentParser for analysis
 * - **Tool System**: Extensible tools defined in src/tools/
 * - **Smart Caching**: Reduces API calls and improves response times
 * 
 * ## Environment Requirements
 * 
 * - `GITHUB_TOKEN` (optional): For higher GitHub API rate limits
 * - `AI` binding: Cloudflare Workers AI for AutoRAG search
 * - `VADS_DOCS` R2 bucket: For documentation storage
 * 
 * @see https://modelcontextprotocol.io/ for MCP specification
 * @see https://design.va.gov/ for VA Design System documentation
 */
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "VA Design System MCP Server",
		version: "1.1.0",
	});

	private githubService!: GitHubService;
	private componentParser!: ComponentParser;

	/**
	 * Initializes the MCP server and all available tools
	 * 
	 * This method sets up the core services and registers all tools with the MCP server.
	 * It automatically configures GitHub authentication if a token is available and
	 * creates service instances that will be injected into tool handlers.
	 * 
	 * The tool registration is dynamic - tools are defined in src/tools/index.ts
	 * and automatically loaded without requiring manual registration here.
	 * 
	 * @throws Error if required services fail to initialize
	 */
	async init() {
		// Initialize GitHub service with optional authentication
		// Token improves rate limits but isn't required for public repos
		const githubConfig: GitHubConfig = {
			token: (this.env as any).GITHUB_TOKEN, // Optional environment variable
			userAgent: "VA-Design-System-MCP/1.1.0",
		};

		this.githubService = new GitHubService(githubConfig);
		this.componentParser = new ComponentParser();

		// Register all tools from the modular tool system
		// Each tool gets access to the initialized services
		for (const tool of tools) {
			this.server.tool(tool.name, tool.schema.shape, async (params: any) =>
				tool.handler(params, this.env, {
					github: this.githubService,
					componentParser: this.componentParser,
				}),
			);
		}

		// Additional tools can be added by extending the tools array in src/tools/index.ts
		// Current tools:
		// - searchDesignSystem: Search VA Design System documentation via AutoRAG
		// - getComponentProperties: Fetch and parse component TypeScript definitions
		// - getComponentExamples: Generate component usage examples
		// - listComponents: List all VA components with their status and recommendations
		// Future possibilities:
		// - validateComponent: Check component usage against design system rules
	}

	/**
	 * Provides access to the GitHub service for internal use
	 * 
	 * @returns Configured GitHubService instance
	 * @internal Used by tools that need direct GitHub access
	 */
	protected getGitHubService(): GitHubService {
		return this.githubService;
	}

	/**
	 * Provides access to the component parser for internal use
	 * 
	 * @returns Configured ComponentParser instance  
	 * @internal Used by tools that need component analysis
	 */
	protected getComponentParser(): ComponentParser {
		return this.componentParser;
	}
}

/**
 * Cloudflare Worker fetch handler
 * 
 * Routes incoming requests to the appropriate MCP endpoints:
 * - `/sse` or `/sse/message`: Server-Sent Events for streaming responses
 * - `/mcp`: Standard MCP JSON-RPC endpoint
 * - All other paths: 404 Not Found
 * 
 * This handler is automatically called by the Cloudflare Workers runtime
 * for each incoming HTTP request.
 * 
 * @param request - Incoming HTTP request
 * @param env - Cloudflare Worker environment bindings
 * @param ctx - Execution context for the worker
 * @returns Promise resolving to HTTP response
 * 
 * @example
 * ```
 * // MCP client connection
 * POST /mcp
 * Content-Type: application/json
 * 
 * {
 *   "jsonrpc": "2.0",
 *   "method": "call_tool",
 *   "params": {
 *     "name": "searchDesignSystem",
 *     "arguments": { "query": "button component" }
 *   },
 *   "id": 1
 * }
 * ```
 */
export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		// Route Server-Sent Events for streaming responses
		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		// Route standard MCP JSON-RPC requests
		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Return 404 for all other paths
		return new Response("Not found", { status: 404 });
	},
};