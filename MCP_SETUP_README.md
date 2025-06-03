# VADS AutoRAG MCP Server Setup

This project provides a Model Context Protocol (MCP) server that connects to your Cloudflare AutoRAG instance for VADS documentation search.

## Configuration

### Project-Specific Setup (Recommended)

The MCP server is configured for this project in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "vads-autorag-mcp": {
      "command": "npx",
      "args": [
        "-y", 
        "@modelcontextprotocol/server-sse", 
        "https://remote-mcp-server-authless.michael-collier.workers.dev/sse"
      ],
      "disabled": false
    }
  }
}
```

## Available Tools

Once connected, you'll have access to these tools:

1. **`searchVADSRAG`** - Search the VADS documentation (basic search, returns documents)
2. **`searchAutoRAG`** - Search any AutoRAG instance by name (defaults to basic search)

## Basic Search vs AI Search

The server is configured for **basic search** by default:
- Returns raw document chunks with metadata
- Shows similarity scores
- Provides source content without AI interpretation
- Faster response times

If you need AI-generated responses, use `searchAutoRAG` with `useAISearch: true`.

## Usage Examples

```javascript
// Search VADS documentation
searchVADSRAG({ query: "VA disability benefits" })

// Search specific AutoRAG instance
searchAutoRAG({ 
  autoragId: "vads-rag-mcp", 
  query: "eligibility requirements" 
})

// Use AI search (with response generation)
searchAutoRAG({ 
  autoragId: "vads-rag-mcp", 
  query: "eligibility requirements",
  useAISearch: true 
})
```

## Troubleshooting

If the tools don't appear:
1. Restart Cursor
2. Check that the `.cursor/mcp.json` file exists in your project root
3. Verify the MCP server is running at the specified URL

The MCP server uses SSE (Server-Sent Events) transport for real-time communication. 