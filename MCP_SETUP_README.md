# MCP Server Setup for Cursor IDE

This document explains how to configure your AutoRAG MCP server with Cursor IDE.

## Configuration Options

### Option 1: Project-Specific (Recommended for testing)

The `.cursor/mcp.json` file in this directory configures the MCP server for **this project only**.

**File location**: `.cursor/mcp.json` (already created)

**To use**:
1. The file is already configured in this project
2. Open Cursor in this project directory
3. Go to **File** → **Preferences** → **Cursor Settings** → **Features** → **Model Context Protocol**
4. You should see "remote-autorag" listed
5. Toggle it **ON**
6. Restart Cursor

### Option 2: Global Configuration 

To use this MCP server across **all your Cursor projects**:

**For macOS/Linux**:
```bash
cp cursor-global-mcp.json ~/.cursor/mcp.json
```

**For Windows**:
```cmd
copy cursor-global-mcp.json %USERPROFILE%\.cursor\mcp.json
```

**To use**:
1. Copy the file to your home directory as shown above
2. Restart Cursor
3. The MCP server will be available in all projects

## How to Test

1. **Open Cursor** in this project directory
2. **Open Composer** (Ctrl+I or Cmd+I)
3. **Select "Agent"** mode
4. **Test with these commands**:
   - `"List my AutoRAG instances"`
   - `"Search my vads-rag-mcp for 'VA address component'"`

## Available Tools

Your MCP server provides these tools:

1. **`listAutoRAGs`** - Lists all AutoRAG instances in your account
2. **`searchAutoRAG`** - Search documents in a specific AutoRAG instance (requires AutoRAG ID)
3. **`searchVadsRAG`** - Search your specific "vads-rag-mcp" instance

## Troubleshooting

### MCP Server Not Showing Up
1. Check that your `.cursor/mcp.json` file exists and has correct syntax
2. Restart Cursor completely
3. Check **Cursor Settings** → **Features** → **Model Context Protocol**

### Tools Not Working
1. Verify your Cloudflare environment variables are set correctly:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_API_TOKEN`
2. Check the MCP server logs in Cursor's output panel

### Connection Issues
1. Test your server URL directly: https://remote-mcp-server-authless.michael-collier.workers.dev/sse
2. Check your internet connection
3. Verify the server is deployed and running

## Configuration Details

The MCP configuration uses:
- **Transport**: SSE (Server-Sent Events)
- **Command**: Uses `npx` to run the MCP SSE client
- **URL**: Your deployed Cloudflare Worker endpoint

This allows Cursor to connect to your remote AutoRAG server seamlessly!

## Next Steps

Once connected, you can:
1. Ask Cursor to search your AutoRAG knowledge base
2. Retrieve specific documents
3. Use AutoRAG results in your development workflow

Happy coding! 🚀 