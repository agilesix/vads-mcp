# VA Design System Comprehensive MCP Server

This MCP (Model Context Protocol) server provides comprehensive access to the VA Design System through multiple intelligent tools. Search documentation, inspect component properties, generate usage examples, and explore the complete component library with advanced parsing and semantic analysis capabilities.

## 🚀 Features

- **Intelligent Documentation Search**: Find VA Design System components, patterns, and guidelines using natural language via AutoRAG
- **Live Component Inspection**: Fetch and parse component TypeScript definitions directly from the VA Design System GitHub repository
- **Smart Example Generation**: Generate comprehensive usage examples with multiple types (basic, state, accessibility, form) and framework support
- **Complete Component Library**: Browse all VA components with filtering, sorting, and detailed metadata
- **Advanced Name Matching**: Support for multiple naming conventions (kebab-case, space-separated, exact names)
- **Semantic Analysis**: Intelligent property categorization and purpose inference
- **Framework Support**: HTML, React, Vue, and Angular usage examples with framework-specific notes
- **GitHub Integration**: Real-time access to the latest component definitions with intelligent caching
- **Comprehensive Error Handling**: Detailed troubleshooting guidance and helpful suggestions

## 📦 Deployment Information

**Server URL**: `https://vads-mcp.a6lab.ai/sse`  
**Account**: AgileSix Cloudflare Account  
**AutoRAG Instance**: `vads-rag-mcp`  
**R2 Data Source**: `vads-docs` bucket  
**GitHub Source**: `department-of-veterans-affairs/component-library`

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

## 🔧 Available Tools

### 1. `searchDesignSystem`

Search the VA Design System documentation using natural language queries via AutoRAG.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **query** | `string` (required) | - | Your search query about VA Design System components, accessibility guidelines, or design patterns.<br/>**Examples:** "How do I use the button component?", "What are the color accessibility requirements?", "Alert component variants" |
| **autoragId** | `string` | `"vads-rag-mcp"` | AutoRAG instance identifier. Use `"vads-rag-mcp"` for VA Design System docs.<br/>**Other examples:** `"design-patterns-rag"`, `"accessibility-docs-rag"` |
| **maxResults** | `number` | `10` | Maximum document chunks to retrieve (1-50).<br/>**Recommended:** 5-15 for specific questions, 20-50 for research |
| **scoreThreshold** | `number` | `0.3` | Minimum similarity score (0.0-1.0) for results:<br/>• `0.7-1.0`: High precision, very relevant matches<br/>• `0.5-0.7`: Balanced precision and recall (recommended)<br/>• `0.3-0.5`: High recall, broader results<br/>• `0.0-0.3`: Very broad searches |

### 2. `getComponentProperties`

Fetch and parse component TypeScript definitions directly from the VA Design System GitHub repository.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **componentName** | `string` (required) | - | The name of the VA Design System component. Supports multiple naming conventions:<br/>• Kebab-case: `"button-icon"`, `"file-input-multiple"`<br/>• Space-separated: `"Button - Icon"`, `"File input multiple"`<br/>• Simple: `"button"`, `"alert"`<br/>**Don't include** the `va-` prefix |
| **includeDescription** | `boolean` | `true` | Whether to include detailed descriptions for each property |
| **includeExamples** | `boolean` | `false` | Whether to include usage examples for properties |

### 3. `getComponentExamples`

Generate comprehensive usage examples for VA Design System components with multiple types and framework support.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **componentName** | `string` (required) | - | The name of the VA Design System component (same naming conventions as `getComponentProperties`) |
| **exampleTypes** | `array` | `["basic"]` | Types of examples to generate:<br/>• `"basic"`: Simple usage examples<br/>• `"state"`: Different component states<br/>• `"accessibility"`: Enhanced accessibility features<br/>• `"form"`: Form context usage<br/>• `"all"`: All available types |
| **includeDescription** | `boolean` | `true` | Whether to include detailed descriptions for each example |
| **framework** | `string` | `"html"` | Framework syntax: `"html"`, `"react"`, `"vue"`, `"angular"` |

### 4. `listComponents`

Browse all VA Design System components with filtering, sorting, and detailed metadata.

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| **status** | `string` | `"all"` | Filter by component status:<br/>• `"RECOMMENDED"`: Best practice components<br/>• `"STABLE"`: Production-ready components<br/>• `"EXPERIMENTAL"`: Testing phase components<br/>• `"AVAILABLE_WITH_ISSUES"`: Use with caution<br/>• `"USE_WITH_CAUTION"`: Known limitations<br/>• `"all"`: Show all components |
| **category** | `string` | - | Optional category filter (e.g., `"form"`, `"button"`, `"alert"`) |
| **includeMetadata** | `boolean` | `true` | Include detailed metadata and usage examples |
| **sortBy** | `string` | `"name"` | Sort by: `"name"`, `"status"`, `"maturityLevel"` |

## 📋 Example Usage in Cursor

### Documentation Search
```
"Search the VA Design System for button component accessibility requirements"
"Find form validation patterns and error handling guidelines"
"Look up color contrast requirements for text and backgrounds"
```

### Component Properties
```
"Get the properties for the alert component with descriptions"
"Show me all properties for file-input-multiple including examples"
"What are the required properties for the Button - Icon component?"
```

### Component Examples
```
"Generate basic and state examples for the button component"
"Show me React examples for the alert-expandable component"
"Create accessibility-focused examples for form inputs"
```

### Component Library
```
"List all recommended components with metadata"
"Show me all form-related components"
"Find experimental components sorted by status"
```

## 🎯 Advanced Features

### Smart Component Matching
The server supports multiple naming conventions:
- **Kebab-case**: `file-input-multiple`, `alert-expandable`, `button-icon`
- **Space-separated**: `File input multiple`, `Alert - expandable`, `Button - Icon`
- **Simple names**: `button`, `alert`, `accordion`

### Semantic Analysis
Components are automatically analyzed for:
- **Property categorization**: Visible content, accessibility, state, configuration
- **Purpose inference**: Form-related, interactive, accessibility-enhanced
- **Content strategy**: How to populate component with meaningful content

### Framework Support
Examples can be generated for multiple frameworks with framework-specific notes:
- **HTML**: Standard web components syntax
- **React**: JSX with React-specific patterns
- **Vue**: Vue template syntax with directives
- **Angular**: Angular component syntax

## 🔍 Search and Discovery

### Documentation Search Results
Returns raw document results optimized for AI processing:
- Document chunks with similarity scores
- Source metadata (file names, sections)
- Direct access to VA Design System content
- Configurable result quality and quantity

### Component Property Results
Provides comprehensive property information:
- Required vs optional properties
- TypeScript type definitions
- Detailed descriptions and examples
- Usage summaries and minimum viable examples

### Generated Examples
Includes multiple example types:
- **Basic**: Essential usage patterns
- **State**: Different component states (disabled, loading, etc.)
- **Accessibility**: Enhanced accessibility features
- **Form**: Integration with form contexts

## 🚨 Troubleshooting

### Connection Issues
- **Server not appearing in Cursor**: Verify the `mcp.json` file syntax and restart Cursor
- **Tools not loading**: Click the refresh button next to the server in Cursor's MCP settings
- **SSE connection failures**: Check your internet connection and verify the server URL

### Search Issues
- **No results found**: Try lowering the `scoreThreshold` (e.g., 0.2-0.3)
- **Too many irrelevant results**: Increase the `scoreThreshold` (e.g., 0.6-0.8)
- **AutoRAG errors**: Verify the `autoragId` is correct (`vads-rag-mcp` for VA Design System)

### Component Issues
- **Component not found**: Use the suggestions provided or try different naming conventions
- **GitHub fetch errors**: Check internet connectivity and GitHub API availability
- **Property parsing errors**: Verify the component exists in the current VA Design System version

### Performance Tips
- **Search**: Start with `maxResults: 10` and adjust based on needs
- **Components**: Use exact names when possible for faster matching
- **Examples**: Generate specific example types rather than "all" for better performance
- **Caching**: Results are cached for 5 minutes to improve response times

## 🏗️ Technical Architecture

### Core Components
- **Cloudflare Workers**: Serverless hosting platform with global edge deployment
- **Durable Objects**: Persistent state management for MCP server instances
- **AutoRAG**: Managed RAG pipeline for intelligent document search
- **R2 Storage**: Document storage (`vads-docs` bucket) for search index
- **Workers AI**: Embedding and generation models for semantic search

### Data Sources
- **GitHub Integration**: Live component definitions from `department-of-veterans-affairs/component-library`
- **AutoRAG Knowledge Base**: Processed VA Design System documentation
- **TypeScript Parsing**: Real-time analysis of component interfaces and properties

### Advanced Features
- **Intelligent Caching**: 5-minute cache for GitHub API calls and component parsing
- **Semantic Analysis**: Property categorization and purpose inference
- **Enhanced Matching**: Multiple naming convention support with fuzzy matching
- **Example Generation**: Context-aware code examples with framework adaptation

### Security Features
- **Server-Sent Events (SSE)**: Secure, real-time communication protocol
- **Scoped Permissions**: Access limited to VA Design System repositories and documentation
- **Rate Limiting**: GitHub API rate limiting and caching to prevent abuse
- **Error Handling**: Comprehensive error messages and graceful degradation

## 📚 Related Resources

- [VA Design System Official Documentation](https://design.va.gov/)
- [VA Design System Component Library](https://github.com/department-of-veterans-affairs/component-library)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Cursor IDE MCP Documentation](https://docs.cursor.com/mcp)
- [Cloudflare AutoRAG Documentation](https://developers.cloudflare.com/autorag/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)

## 🆘 Support

For issues specific to this MCP server:
1. Check the troubleshooting section above
2. Verify your Cursor and MCP configuration
3. Test with simple queries first ("button component")
4. Use the `listComponents` tool to verify available components
5. Review Cursor's MCP documentation for general setup issues

For VA Design System documentation questions, refer to the [official VA Design System resources](https://design.va.gov/about/developers).
