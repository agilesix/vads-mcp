import { searchDesignSystemTool } from "./searchDesignSystem";
import { getComponentPropertiesTool } from "./getComponentProperties";
import { getComponentExamplesTool } from "./getComponentExamples";
import { listComponentsTool } from "./listComponents";
import type { ToolDefinition } from "../types";

/**
 * VA Design System MCP Tools Registry
 * 
 * This module exports all available tools for the VA Design System MCP server.
 * Tools are automatically registered with the MCP server during initialization,
 * making them available to AI assistants for component development and documentation.
 * 
 * ## Available Tools
 * 
 * ### 🔍 searchDesignSystem
 * Semantic search through VA Design System documentation using AutoRAG.
 * Best for: finding documentation, guidelines, and best practices.
 * 
 * ### 📋 getComponentProperties  
 * Extracts detailed property information from component TypeScript definitions.
 * Best for: understanding component APIs and implementation requirements.
 * 
 * ### 💡 getComponentExamples
 * Generates contextual usage examples based on component analysis.
 * Best for: learning component usage patterns and implementation examples.
 * 
 * ### 📂 listComponents
 * Lists all available components with status and maturity information.
 * Best for: discovering components and understanding their recommendation status.
 * 
 * ## Adding New Tools
 * 
 * To add a new tool:
 * 1. Create a new file in this directory following the pattern of existing tools
 * 2. Export a ToolDefinition object with name, schema, and handler
 * 3. Import and add to the tools array below
 * 4. The tool will be automatically registered during server initialization
 * 
 * @example
 * ```typescript
 * // Example new tool
 * export const myNewTool: ToolDefinition = {
 *   name: "myNewTool",
 *   schema: z.object({
 *     input: z.string().describe("Input parameter")
 *   }),
 *   handler: async (params, env, services) => {
 *     // Tool implementation
 *     return { content: [{ type: "text", text: "Result" }] };
 *   }
 * };
 * ```
 */
export const tools: ToolDefinition[] = [
	searchDesignSystemTool,
	getComponentPropertiesTool,
	getComponentExamplesTool,
	listComponentsTool,
];