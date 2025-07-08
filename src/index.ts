import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tools } from "./tools";
import { GitHubService } from "./services/github";
import { ComponentParser } from "./services/componentParser";
import type { GitHubConfig } from "./types";

/**
 * VA Design System MCP Server
 *
 * This MCP server provides multiple tools for interacting with the VA Design System:
 * - AutoRAG search for documentation
 * - Component property inspection
 * - Component example generation
 */
export class MyMCP extends McpAgent<Env> {
	server = new McpServer({
		name: "VA Design System MCP Server",
		version: "1.1.0",
	});

	private githubService!: GitHubService;
	private componentParser!: ComponentParser;

	async init() {
		// Initialize services that will be used by future tools
		const githubConfig: GitHubConfig = {
			token: (this.env as any).GITHUB_TOKEN, // Will be added to env vars
			userAgent: "VA-Design-System-MCP/1.1.0",
		};

		this.githubService = new GitHubService(githubConfig);
		this.componentParser = new ComponentParser();

		// Register all tools from the modular tool system
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
		// Future possibilities:
		// - validateComponent: Check component usage against design system rules
		// - getComponentStatus: Get component maturity and recommendation info
	}

	// Helper methods for future tools to use
	protected getGitHubService(): GitHubService {
		return this.githubService;
	}

	protected getComponentParser(): ComponentParser {
		return this.componentParser;
	}
}

// Export the default fetch handler for the worker
export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		// Handle case where no path matches
		return new Response("Not found", { status: 404 });
	},
};
