import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * AutoRAG MCP Server
 * 
 * This MCP server exposes your Cloudflare AutoRAG instance as a tool that can be
 * used by MCP clients like Claude, Cursor, or AI Playground.
 */
export class MyMCP extends McpAgent {
  server = new McpServer({
    name: "AutoRAG MCP Server", 
    version: "1.0.0"
  });

  async init() {
    // Tool to search documents in a specific AutoRAG using AI Search
    this.server.tool(
      "searchAutoRAG",
      { 
        autoragId: z.string().describe("The name of the AutoRAG instance (e.g., 'vads-rag-mcp')"),
        query: z.string().describe("The search query"),
        useAISearch: z.boolean().optional().describe("Use AI Search (with response generation) or basic search. Default: false")
      },
      async ({ autoragId, query, useAISearch = false }) => {
        try {
          const endpoint = useAISearch ? 'ai-search' : 'search';
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/autorag/rags/${autoragId}/${endpoint}`,
            {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                query,
                rewrite_query: true,
                max_num_results: 10,
                ranking_options: {
                  score_threshold: 0.3
                }
              }),
            }
          );
          
          const data = await response.json();
          
          if (!data.success) {
            return {
              content: [{ 
                type: "text", 
                text: `Error searching AutoRAG "${autoragId}": ${data.errors?.[0]?.message || 'Unknown error'}` 
              }],
            };
          }
          
          // Format the response nicely
          if (useAISearch && data.result.response) {
            // AI Search includes generated response
            return {
              content: [{ 
                type: "text", 
                text: `**AI Response:**\n${data.result.response}\n\n**Source Documents:**\n${JSON.stringify(data.result.data, null, 2)}` 
              }],
            };
          } else {
            // Basic search returns just the matching documents
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify(data.result, null, 2) 
              }],
            };
          }
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error: ${error.message}` 
            }],
          };
        }
      }
    );
    
    // Convenience tool to search your specific AutoRAG "vads-rag-mcp" with basic search
    this.server.tool(
      "searchVADSRAG",
      { 
        query: z.string().describe("The search query for VA-related documents") 
      },
      async ({ query }) => {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/autorag/rags/vads-rag-mcp/search`,
            {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                query,
                rewrite_query: true,
                max_num_results: 10,
                ranking_options: {
                  score_threshold: 0.3
                }
              }),
            }
          );
          
          const data = await response.json();
          
          if (!data.success) {
            return {
              content: [{ 
                type: "text", 
                text: `Error searching VADS AutoRAG: ${data.errors?.[0]?.message || 'Unknown error'}` 
              }],
            };
          }
          
          // Return just the document results
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(data.result, null, 2) 
            }],
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error: ${error.message}` 
            }],
          };
        }
      }
    );
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
    return new Response('Not found', { status: 404 });
  },
};
