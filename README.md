# VA Design System AutoRAG MCP Server

This MCP (Model Context Protocol) server provides intelligent access to the VA Design System documentation through Cloudflare's AutoRAG service. Search for components, accessibility guidelines, design patterns, and implementation details using natural language queries.

## 🚀 Features

- **Intelligent Design System Search**: Find VA Design System components, patterns, and guidelines using natural language
- **Dual Search Modes**: Choose between raw document results or AI-synthesized responses
- **Flexible AutoRAG Support**: Works with any AutoRAG instance, pre-configured for VA Design System
- **Advanced Filtering**: Control result quality and quantity with configurable parameters
- **Comprehensive Error Handling**: Detailed troubleshooting guidance for common issues

## 📦 Deployment Information

**Server URL**: `https://vads-mcp.a6lab.ai/sse`  
**Account**: AgileSix Cloudflare Account  
**AutoRAG Instance**: `vads-rag-mcp`  
**R2 Data Source**: `vads-docs` bucket

## 🛠️ Adding to Cursor IDE

### Step 1: Create MCP Configuration File

Create or edit the MCP configuration file in your home directory:

**macOS/Linux:**
```bash
~/.cursor/mcp.json
```

**Windows:**
```bash
%USERPROFILE%\.cursor\mcp.json
```

### Step 2: Add Server Configuration

Add the following configuration to your `mcp.json` file:

```json
{
  "mcpServers": {
    "va-design-system": {
      "url": "https://vads-mcp.a6lab.ai/sse"
    }
  }
}
```

### Step 3: Restart Cursor

1. Close Cursor completely
2. Reopen Cursor
3. The VA Design System MCP server will be automatically connected

### Step 4: Verify Connection

1. Open Cursor Settings → Features → MCP
2. You should see "va-design-system" in your MCP servers list
3. Click the refresh button if needed to populate the tool list

## 🔧 Available Tool

### `searchDesignSystem`

Search the VA Design System documentation using natural language queries.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **query** | `string` (required) | - | Your search query about VA Design System components, accessibility guidelines, or design patterns.<br/>**Examples:** "How do I use the button component?", "What are the color accessibility requirements?", "Alert component variants" |
| **autoragId** | `string` | `"vads-rag-mcp"` | AutoRAG instance identifier. Use `"vads-rag-mcp"` for VA Design System docs.<br/>**Other examples:** `"design-patterns-rag"`, `"accessibility-docs-rag"` |
| **useAISearch** | `boolean` | `false` | Search mode selection:<br/>• `false` (default): Raw search results with document chunks and metadata (faster)<br/>• `true`: AI-synthesized response with citations (comprehensive but slower) |
| **maxResults** | `number` | `10` | Maximum document chunks to retrieve (1-50).<br/>**Recommended:** 5-15 for specific questions, 20-50 for research |
| **scoreThreshold** | `number` | `0.3` | Minimum similarity score (0.0-1.0) for results:<br/>• `0.7-1.0`: High precision, very relevant matches<br/>• `0.5-0.7`: Balanced precision and recall (recommended)<br/>• `0.3-0.5`: High recall, broader results<br/>• `0.0-0.3`: Very broad searches |

#### Usage Examples in Cursor

Ask Cursor's AI assistant to use the VA Design System search tool:

```
"Search the VA Design System for button component variants and accessibility requirements"
```

```
"Find information about form validation patterns in the VA Design System"
```

```
"Look up color contrast requirements and accessibility guidelines"
```

## 📋 Example Queries

### Component Information
- "How do I implement the VA button component?"
- "What are the alert component variants available?"
- "Show me the form input field specifications"

### Accessibility Guidelines  
- "What are the color contrast requirements?"
- "How do I make forms accessible for screen readers?"
- "WCAG compliance guidelines for VA components"

### Design Patterns
- "Navigation patterns for VA applications"
- "Layout guidelines for forms"
- "Typography scale and usage rules"

### Implementation Details
- "CSS classes for the card component"
- "JavaScript requirements for interactive components"
- "Integration examples with React"

## 🔍 Search Modes Explained

### Raw Search Mode (`useAISearch: false`)
**Best for:** Quick fact-finding, browsing source content, getting precise documentation snippets

**Returns:**
- Document chunks with similarity scores
- Source metadata (file names, sections)
- Direct access to original content
- Faster response times

### AI Search Mode (`useAISearch: true`)  
**Best for:** Comprehensive explanations, synthesized answers, comparative analysis

**Returns:**
- AI-generated response combining multiple sources
- Structured answers with context
- Source citations and references
- More comprehensive but slower

## 🚨 Troubleshooting

### Connection Issues
- **Server not appearing in Cursor**: Verify the `mcp.json` file syntax and restart Cursor
- **Tools not loading**: Click the refresh button next to the server in Cursor's MCP settings
- **SSE connection failures**: Check your internet connection and verify the server URL

### Search Issues
- **No results found**: Try lowering the `scoreThreshold` (e.g., 0.2-0.3)
- **Too many irrelevant results**: Increase the `scoreThreshold` (e.g., 0.6-0.8)
- **AutoRAG errors**: Verify the `autoragId` is correct (`vads-rag-mcp` for VA Design System)

### Performance Tips
- Use raw search mode (`useAISearch: false`) for faster responses
- Start with `maxResults: 10` and adjust based on your needs
- Use specific queries for better results ("button component accessibility" vs "button")

## 🏗️ Technical Architecture

### Components Used
- **Cloudflare Workers**: Serverless hosting platform
- **AutoRAG**: Managed RAG pipeline for document search
- **R2 Storage**: Document storage (`vads-docs` bucket)
- **Workers AI**: Embedding and generation models
- **MCP Protocol**: Standardized AI tool integration

### Security Features
- **Server-Sent Events (SSE)**: Secure, real-time communication
- **Scoped Permissions**: Access limited to VA Design System documentation
- **Error Handling**: Comprehensive error messages and troubleshooting

## 📚 Related Resources

- [VA Design System Official Documentation](https://design.va.gov/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Cursor IDE MCP Documentation](https://docs.cursor.com/mcp)
- [Cloudflare AutoRAG Documentation](https://developers.cloudflare.com/autorag/)

## 🆘 Support

For issues specific to this MCP server:
1. Check the troubleshooting section above
2. Verify your Cursor and MCP configuration
3. Test with simple queries first ("button component")
4. Review Cursor's MCP documentation for general setup issues

For VA Design System documentation questions, refer to the [official VA Design System resources](https://design.va.gov/about/developers).

---

**Deployed Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintained by**: AgileSix Team
