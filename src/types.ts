import type { z } from "zod";

/**
 * Defines the structure for MCP (Model Context Protocol) tool implementations.
 * Each tool provides a specific capability for interacting with the VA Design System.
 * 
 * @example
 * ```typescript
 * const myTool: ToolDefinition = {
 *   name: "searchComponents",
 *   schema: z.object({
 *     query: z.string().describe("Search query")
 *   }),
 *   handler: async (params, env, services) => {
 *     const results = await services.github.fetchContent();
 *     return {
 *       content: [{
 *         type: "text",
 *         text: `Found ${results.length} components`
 *       }]
 *     };
 *   }
 * };
 * ```
 */
export interface ToolDefinition {
	/** Unique identifier for the tool used in MCP requests */
	name: string;
	
	/** Zod schema defining the tool's input parameters for validation */
	schema: z.ZodObject<any>;
	
	/** 
	 * Handler function that executes the tool's logic.
	 * @param params - Validated input parameters matching the schema
	 * @param env - Cloudflare Worker environment bindings
	 * @param services - Optional injected services (GitHub client, parser, etc.)
	 * @returns Promise resolving to MCP-formatted response content
	 */
	handler: (
		params: any,
		env: Env,
		services?: {
			github: any;
			componentParser: any;
		},
	) => Promise<{
		content: Array<{
			type: "text";
			text: string;
			[key: string]: unknown;
		}>;
	}>;
}

/**
 * Configuration options for GitHub API integration.
 * Used to authenticate and customize GitHub API requests.
 * 
 * @example
 * ```typescript
 * const config: GitHubConfig = {
 *   token: process.env.GITHUB_TOKEN,
 *   baseUrl: "https://api.github.com",
 *   userAgent: "VA-Design-System-MCP/1.0.0"
 * };
 * ```
 */
export interface GitHubConfig {
	/** GitHub personal access token for API authentication (optional for public repos) */
	token?: string;
	
	/** Base URL for GitHub API - defaults to https://api.github.com */
	baseUrl?: string;
	
	/** User agent string sent with API requests - should identify your application */
	userAgent?: string;
}

/**
 * Configuration for caching strategy used by services.
 * Controls how long data is cached and where it's stored.
 */
export interface CacheConfig {
	/** Time-to-live in milliseconds before cache entries expire */
	ttl?: number;
	
	/** Storage backend: "memory" for in-process cache, "kv" for Cloudflare KV storage */
	storage?: "memory" | "kv";
}

/**
 * Represents a single property/attribute of a VA Design System component.
 * Extracted from TypeScript interface definitions.
 * 
 * @example
 * ```typescript
 * const property: ComponentProperty = {
 *   name: "disabled",
 *   type: "boolean",
 *   optional: true,
 *   description: "Whether the button is disabled"
 * };
 * ```
 */
export interface ComponentProperty {
	/** Property name as it appears in the component interface */
	name: string;
	
	/** TypeScript type definition (e.g., "string", "boolean", "MouseEvent => void") */
	type: string;
	
	/** Whether the property is optional (has ? in TypeScript) */
	optional: boolean;
	
	/** JSDoc description extracted from the property comment */
	description?: string;
}

/**
 * Represents a usage example for a VA Design System component.
 * Generated based on component analysis and best practices.
 * 
 * @example
 * ```typescript
 * const example: ComponentExample = {
 *   title: "Basic Button Usage",
 *   description: "Simple button with click handler",
 *   code: '<va-button text="Submit" onClick={handleSubmit} />',
 *   framework: "react",
 *   purpose: ExampleType.BASIC
 * };
 * ```
 */
export interface ComponentExample {
	/** Short title describing the example */
	title: string;
	
	/** Detailed explanation of what the example demonstrates */
	description: string;
	
	/** The actual code snippet */
	code: string;
	
	/** Target framework: "html", "react", "vue", etc. */
	framework?: string;
	
	/** Category of example - helps organize by use case */
	purpose?: ExampleType;
}

/**
 * Component maturity status based on VA Design System governance.
 * Indicates the overall recommendation for using a component.
 * 
 * @see https://design.va.gov/about/maturity-model
 */
export enum ComponentStatus {
	/** Recommended for production use - follows all best practices */
	RECOMMENDED = "RECOMMENDED",
	
	/** Stable and actively used in production */
	STABLE = "STABLE",
	
	/** Experimental - may change significantly, use with caution */
	EXPERIMENTAL = "EXPERIMENTAL",
	
	/** Available but has known issues - test thoroughly before use */
	AVAILABLE_WITH_ISSUES = "AVAILABLE_WITH_ISSUES",
	
	/** Use with caution - may have significant issues or limitations */
	USE_WITH_CAUTION = "USE_WITH_CAUTION",
	
	/** Deprecated - will be removed in future versions */
	DEPRECATED = "DEPRECATED",
	
	/** Unknown status - unable to determine from metadata */
	UNKNOWN = "UNKNOWN"
}

/**
 * Specific maturity level from VA Design System metadata.
 * Maps directly to @maturityLevel JSDoc annotations.
 */
export enum MaturityLevel {
	/** Meets all design system standards and best practices */
	BEST_PRACTICE = "best_practice",
	
	/** Deployed and stable in production applications */
	DEPLOYED = "deployed",
	
	/** Candidate for promotion - undergoing final review */
	CANDIDATE = "candidate",
	
	/** Available for use but may not meet all standards */
	AVAILABLE = "available",
	
	/** Deprecated - scheduled for removal */
	DEPRECATED = "deprecated",
	
	/** Unknown or missing maturity level */
	UNKNOWN = "unknown"
}

/**
 * High-level category for component recommendation.
 * Maps to @maturityCategory JSDoc annotations.
 */
export enum MaturityCategory {
	/** Safe to use - meets quality standards */
	USE = "use",
	
	/** Use with caution - may have issues */
	CAUTION = "caution"
}

/**
 * Categories of component examples based on demonstration purpose.
 * Used to organize and filter generated examples.
 */
export enum ExampleType {
	/** Basic usage with minimal required props */
	BASIC = "basic",
	
	/** Demonstrates different component states (disabled, loading, etc.) */
	STATE = "state",
	
	/** Shows accessibility features and ARIA attributes */
	ACCESSIBILITY = "accessibility",
	
	/** Form integration and validation examples */
	FORM = "form"
}

/**
 * Inferred purpose of a component based on semantic analysis.
 * Helps generate appropriate examples and usage guidance.
 */
export enum ComponentPurpose {
	/** Interactive elements that trigger actions (buttons, links) */
	ACTION = "action",
	
	/** Components that display alerts, warnings, or status messages */
	NOTIFICATION = "notification",
	
	/** Form inputs and data entry components */
	INPUT = "input",
	
	/** Navigation elements (menus, breadcrumbs, tabs) */
	NAVIGATION = "navigation",
	
	/** Layout and content organization components */
	CONTAINER = "container",
	
	/** Components primarily for displaying content */
	DISPLAY = "display"
}

/**
 * Strategy for determining primary content in generated examples.
 * Based on component purpose and property analysis.
 */
export enum ContentStrategy {
	/** Prioritize visible text properties in examples */
	VISIBLE_FIRST = "visible-first",
	
	/** Focus on form labels and field names */
	FORM_LABEL = "form-label",
	
	/** Emphasize structural/layout properties */
	STRUCTURE_FIRST = "structure-first",
	
	/** Unable to determine optimal strategy */
	UNKNOWN = "unknown"
}

/**
 * Core data structure representing a VA Design System component.
 * Contains all metadata needed for documentation and code generation.
 * 
 * @example
 * ```typescript
 * const buttonData: ComponentData = {
 *   name: "Button",
 *   tagName: "va-button",
 *   status: ComponentStatus.RECOMMENDED,
 *   maturityLevel: MaturityLevel.BEST_PRACTICE,
 *   recommendation: "Recommended for all button needs",
 *   properties: [
 *     { name: "text", type: "string", optional: false }
 *   ]
 * };
 * ```
 */
export interface ComponentData {
	/** Official component name from @componentName annotation */
	name: string;
	
	/** HTML custom element tag name (e.g., "va-button") */
	tagName: string;
	
	/** Computed recommendation status based on maturity */
	status: ComponentStatus;
	
	/** Raw maturity level from component metadata */
	maturityLevel: MaturityLevel;
	
	/** Human-readable recommendation text */
	recommendation?: string;
	
	/** List of component properties/attributes */
	properties?: ComponentProperty[];
}

/**
 * Comprehensive semantic analysis results for a component.
 * Used to generate intelligent examples and usage guidance.
 * 
 * This analysis categorizes component properties by their purpose
 * and infers high-level characteristics to enable context-aware
 * code generation and documentation.
 */
export interface ComponentSemanticAnalysis {
	/** Properties that display visible text content */
	visibleTextProps: ComponentProperty[];
	
	/** ARIA and accessibility-related properties */
	accessibilityProps: ComponentProperty[];
	
	/** Properties controlling component state (disabled, loading, etc.) */
	stateProps: ComponentProperty[];
	
	/** Configuration properties (size, variant, theme, etc.) */
	configProps: ComponentProperty[];
	
	/** Event handler properties (onClick, onChange, etc.) */
	eventProps: ComponentProperty[];
	
	/** Properties that are required (non-optional) */
	requiredProps: ComponentProperty[];
	
	/** Properties for content slots or children */
	slotProps: ComponentProperty[];
	
	/** Whether component is form-related (inputs, selects, etc.) */
	isFormRelated: boolean;
	
	/** Whether component has interactive features */
	isInteractive: boolean;
	
	/** Whether component has state variations */
	hasStates: boolean;
	
	/** Whether component can show/hide content conditionally */
	hasConditionalContent: boolean;
	
	/** Whether component includes accessibility enhancements */
	hasAccessibilityEnhancements: boolean;
	
	/** Whether component supports content slots */
	hasSlots: boolean;
	
	/** Primary purpose inferred from properties */
	inferredPurpose: ComponentPurpose;
	
	/** Strategy for generating example content */
	contentStrategy: ContentStrategy;
}