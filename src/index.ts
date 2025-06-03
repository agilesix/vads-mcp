import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk";
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
    // Tool to list all AutoRAG instances in your account
    this.server.tool(
      "listAutoRAGs",
      {},
      async () => {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/ai/autorag`,
            {
              headers: {
                'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const data = await response.json();
          
          if (!data.success) {
            return {
              content: [{ 
                type: "text", 
                text: `Error retrieving AutoRAG instances: ${data.errors[0].message}` 
              }],
            };
          }
          
          // Format the response
          const formattedResponse = data.result.map(rag => ({
            id: rag.id,
            name: rag.name,
            status: rag.status,
            createdAt: rag.created_at
          }));
          
          return {
            content: [{ 
              type: "text", 
              text: JSON.stringify(formattedResponse, null, 2) 
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
    
    // Tool to search documents in a specific AutoRAG
    this.server.tool(
      "searchAutoRAG",
      { 
        autoragId: z.string().describe("The ID of the AutoRAG instance"),
        query: z.string().describe("The search query") 
      },
      async ({ autoragId, query }) => {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/ai/autorag/${autoragId}/search`,
            {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query }),
            }
          );
          
          const data = await response.json();
          
          if (!data.success) {
            return {
              content: [{ 
                type: "text", 
                text: `Error searching AutoRAG: ${data.errors[0].message}` 
              }],
            };
          }
          
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
    
    // Convenience tool to search your specific AutoRAG "vads-rag-mcp"
    this.server.tool(
      "searchVadsRAG",
      { 
        query: z.string().describe("The search query") 
      },
      async ({ query }) => {
        try {
          const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${this.env.CLOUDFLARE_ACCOUNT_ID}/ai/autorag/vads-rag-mcp/search`,
            {
              method: "POST",
              headers: {
                'Authorization': `Bearer ${this.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query }),
            }
          );
          
          const data = await response.json();
          
          if (!data.success) {
            return {
              content: [{ 
                type: "text", 
                text: `Error searching AutoRAG: ${data.errors[0].message}` 
              }],
            };
          }
          
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
    const { pathname } = new URL(request.url);
    
    if (pathname.startsWith('/sse')) {
      return MyMCP.serveSSE('/sse').fetch(request, env, ctx);
    }
    
    if (pathname.startsWith('/mcp')) {
      return MyMCP.serve('/mcp').fetch(request, env, ctx);
    }
    
    // Handle case where no path matches
    return new Response('Not found', { status: 404 });
  },
};
