# VA Design System MCP Server - Architecture Overview

## Refactored Structure

The codebase has been refactored to support extensibility for future tools, particularly `getComponentProperties` and `getComponentExamples` from the design-system-monitor repository.

### Directory Structure

```
src/
├── index.ts           # Main MCP server class
├── types.ts           # Shared TypeScript interfaces
├── tools/             # Tool implementations
│   ├── index.ts       # Tool registry
│   └── searchDesignSystem.ts
└── services/          # Shared services
    ├── github.ts      # GitHub API client with caching
    └── componentParser.ts # Component parsing utilities
```

### Key Design Decisions

1. **Modular Tool System**: Tools are now defined in separate files with a standard interface, making it easy to add new tools.

2. **Service Layer**: Common functionality like GitHub API access and component parsing is extracted into reusable services.

3. **Caching Strategy**: The GitHub service includes built-in caching to avoid rate limits and improve performance.

4. **Type Safety**: All tools follow a strict TypeScript interface for consistency.

### Available Tools

The server now includes three tools:

### 1. `searchDesignSystem`
- **Purpose**: Search VA Design System documentation using AutoRAG
- **Parameters**: query, autoragId, maxResults, scoreThreshold
- **Use Case**: Find information about design patterns, components, and guidelines

### 2. `getComponentProperties`
- **Purpose**: Get detailed property information for VA Design System components
- **Parameters**: componentName, includeDescription, includeExamples
- **Use Case**: Understand component APIs, required/optional properties, and property types

### 3. `getComponentExamples`
- **Purpose**: Generate usage examples for VA Design System components
- **Parameters**: componentName, exampleTypes, includeDescription, framework
- **Use Case**: See practical implementation examples for components in different contexts

## Workflow Integration

The tools are designed to work together:

1. **Discovery**: Use `searchDesignSystem` to find information about design patterns and components
2. **API Details**: Use `getComponentProperties` to understand component properties and requirements
3. **Implementation**: Use `getComponentExamples` to see practical usage examples

### GitHub Integration

The `GitHubService` class provides:
- Authenticated API requests (when GITHUB_TOKEN is provided)
- Rate limit handling
- Automatic caching with configurable TTL
- Support for both API and raw content fetching

### Component Parsing

The `ComponentParser` class provides stubs for:
- TypeScript interface parsing
- Storybook story extraction
- Component property analysis

These methods will be implemented when integrating the actual parsing logic from design-system-monitor.

### Environment Variables

Add to your `.dev.vars` or Cloudflare Workers environment:
```
GITHUB_TOKEN=your_github_token_here
```

This token is optional but recommended for higher rate limits when fetching from GitHub.