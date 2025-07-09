import { z } from "zod";
import type { ToolDefinition } from "../types";

/**
 * URL to the VA Design System component TypeScript definitions
 * This is the authoritative source for component property information
 */
const COMPONENT_DEFINITIONS_URL =
	"https://raw.githubusercontent.com/department-of-veterans-affairs/component-library/refs/heads/main/packages/web-components/src/components.d.ts";

/**
 * Zod schema for getComponentProperties tool parameters
 * 
 * Validates component name and output formatting options to ensure
 * proper usage and helpful responses.
 */
export const getComponentPropertiesSchema = z.object({
	componentName: z
		.string()
		.min(1)
		.describe(
			"The name of the VA Design System component to get properties for. " +
				"Examples: 'button', 'alert', 'accordion', 'text-input', 'checkbox', 'radio', 'select', 'textarea', 'date-picker', 'file-input', 'banner', 'breadcrumb', 'card', 'link', 'loading-indicator', 'modal', 'notification', 'pagination', 'progress-bar', 'table', 'tabs', 'tooltip'. " +
				"This should be the component name without the 'va-' prefix (e.g., use 'button' not 'va-button').",
		),
	includeDescription: z
		.boolean()
		.default(true)
		.describe(
			"Whether to include detailed descriptions for each property. " +
				"Set to false for a more concise output showing only property names, types, and required status.",
		),
	includeExamples: z
		.boolean()
		.default(false)
		.describe(
			"Whether to include usage examples for properties. " +
				"When true, provides example values for common property types to help with implementation.",
		),
});

/**
 * Get Component Properties Tool - Extracts property information from VA Design System components
 * 
 * This tool fetches and parses TypeScript definition files from the VA Design System
 * component library to provide detailed information about component properties,
 * including types, descriptions, required/optional status, and usage examples.
 * 
 * ## Features
 * 
 * - **Smart Component Matching**: Supports multiple naming conventions (kebab-case, exact names)
 * - **Property Categorization**: Groups properties into required vs. optional
 * - **Type Information**: Shows TypeScript types with proper formatting
 * - **Usage Examples**: Generates appropriate example values for different property types
 * - **Error Guidance**: Provides suggestions when components aren't found
 * 
 * ## Supported Naming Conventions
 * 
 * - **Kebab-case**: `file-input-multiple`, `alert-expandable`, `button-icon`
 * - **Exact names**: `File input multiple`, `Alert - expandable`, `Button - Icon`
 * - **Normalized**: Case-insensitive matching with various separators
 * 
 * ## Output Format
 * 
 * The tool returns comprehensive component documentation including:
 * - Component metadata (tag name, status, maturity level)
 * - Categorized property lists (required/optional)
 * - Type information and descriptions
 * - Usage summary with minimum viable example
 * 
 * @example
 * ```typescript
 * // Get basic button properties
 * const buttonProps = await getComponentProperties({
 *   componentName: "button",
 *   includeDescription: true
 * });
 * 
 * // Get detailed text input info with examples
 * const inputProps = await getComponentProperties({
 *   componentName: "text-input",
 *   includeDescription: true,
 *   includeExamples: true
 * });
 * 
 * // Quick property reference
 * const alertProps = await getComponentProperties({
 *   componentName: "alert",
 *   includeDescription: false,
 *   includeExamples: false
 * });
 * ```
 */
export const getComponentPropertiesTool: ToolDefinition = {
	name: "getComponentProperties",
	schema: getComponentPropertiesSchema,
	handler: async (
		{ componentName, includeDescription, includeExamples },
		_env: Env,
		services,
	) => {
		try {
			const { github, componentParser } = services || {};

			if (!github || !componentParser) {
				throw new Error("Required services not available");
			}

			// Fetch the latest component definitions from the VA repository
			const content = await github.fetchRawContent(COMPONENT_DEFINITIONS_URL);

			// Parse TypeScript interfaces and extract component metadata
			const components = componentParser.parseComponentMetadata(content);

			// Find the requested component using fuzzy matching
			// This supports multiple naming conventions and helps users find components
			const component = componentParser.findComponentByName(componentName, components);

			if (!component) {
				// Generate helpful error message with suggestions
				const suggestions = componentParser.getSuggestedComponentNames(
					componentName,
					components,
				);
				const availableComponents = Array.from(components.keys()).sort();

				let errorMessage = `**Component "${componentName}" not found.**\n\n`;

				if (suggestions.length > 0) {
					errorMessage += `**Did you mean:**\n${suggestions.map((name: string) => `• ${name}`).join("\n")}\n\n`;
				}

				errorMessage += `**💡 Naming Convention Tips:**\n`;
				errorMessage += `• Use kebab-case: \`file-input-multiple\`, \`alert-expandable\`, \`button-icon\`\n`;
				errorMessage += `• Or use exact names: \`File input multiple\`, \`Alert - expandable\`, \`Button - Icon\`\n`;
				errorMessage += `• Don't include 'va-' prefix: use \`button\` not \`va-button\`\n\n`;

				errorMessage += `**All available components:**\n${availableComponents.map((name) => `• ${name}`).join("\n")}`;

				return {
					content: [
						{
							type: "text" as const,
							text: errorMessage,
						},
					],
				};
			}

			// Build comprehensive response with component information
			let response = `# ${component.name} Component Properties\n\n`;
			response += `**Tag Name:** \`${component.tagName}\`\n`;
			response += `**Status:** ${component.status}\n`;
			response += `**Maturity Level:** ${component.maturityLevel}\n`;

			if (component.recommendation) {
				response += `**Recommendation:** ${component.recommendation}\n`;
			}

			const properties = component.properties || [];

			if (properties.length === 0) {
				response += "\n**No properties found for this component.**";
			} else {
				response += `\n## Properties (${properties.length} total)\n\n`;

				// Categorize properties for better organization
				const requiredProps = properties.filter((p: any) => !p.optional);
				const optionalProps = properties.filter((p: any) => p.optional);

				// Show required properties first - these are critical for usage
				if (requiredProps.length > 0) {
					response += `### Required Properties (${requiredProps.length})\n\n`;
					for (const prop of requiredProps) {
						response += formatProperty(prop, includeDescription, includeExamples);
					}
				}

				// Then show optional properties
				if (optionalProps.length > 0) {
					response += `### Optional Properties (${optionalProps.length})\n\n`;
					for (const prop of optionalProps) {
						response += formatProperty(prop, includeDescription, includeExamples);
					}
				}

				// Provide usage summary and minimal example
				response += "\n## Usage Summary\n\n";
				response += `• **Required props:** ${requiredProps.length}\n`;
				response += `• **Optional props:** ${optionalProps.length}\n`;
				response += `• **Total props:** ${properties.length}\n\n`;

				// Generate minimal viable usage example
				if (requiredProps.length > 0) {
					response += "**Minimum viable usage:**\n```html\n";
					const requiredAttrs = requiredProps
						.filter((p: any) => !p.type.includes("boolean"))
						.map((p: any) => `${p.name}="value"`)
						.join(" ");
					const booleanAttrs = requiredProps
						.filter((p: any) => p.type.includes("boolean"))
						.map((p: any) => p.name)
						.join(" ");
					const allAttrs = [requiredAttrs, booleanAttrs].filter(Boolean).join(" ");
					response += `<${component.tagName}${allAttrs ? ` ${allAttrs}` : ""}></${component.tagName}>\n\`\`\`\n`;
				}
			}

			return {
				content: [
					{
						type: "text" as const,
						text: response,
					},
				],
			};
		} catch (error) {
			// Provide detailed error information and troubleshooting guidance
			return {
				content: [
					{
						type: "text" as const,
						text: `**Error fetching component properties:**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Troubleshooting:**\n• Verify the component name is correct\n• Check that the VA Design System GitHub repository is accessible\n• Ensure the component exists in the current version of the design system\n• Try using the exact component name from the design system documentation`,
					},
				],
			};
		}
	},
};

/**
 * Formats a single property for display with optional descriptions and examples
 * 
 * @param prop - Component property to format
 * @param includeDescription - Whether to include property descriptions
 * @param includeExamples - Whether to include usage examples
 * @returns Formatted markdown string for the property
 */
function formatProperty(prop: any, includeDescription: boolean, includeExamples: boolean): string {
	let formatted = `#### \`${prop.name}\`\n`;
	formatted += `- **Type:** \`${prop.type}\`\n`;
	formatted += `- **Required:** ${prop.optional ? "No" : "Yes"}\n`;

	if (includeDescription && prop.description) {
		formatted += `- **Description:** ${prop.description}\n`;
	}

	if (includeExamples) {
		const example = generatePropertyExample(prop);
		if (example) {
			formatted += `- **Example:** ${example}\n`;
		}
	}

	formatted += "\n";
	return formatted;
}

/**
 * Generates contextual usage examples for component properties
 * 
 * Creates appropriate example values based on property name patterns
 * and TypeScript types to help developers understand usage.
 * 
 * @param prop - Component property to generate example for
 * @returns Example usage string or null if no appropriate example can be generated
 */
function generatePropertyExample(prop: any): string | null {
	const name = prop.name.toLowerCase();
	const type = prop.type.toLowerCase();

	// Boolean properties
	if (type.includes("boolean")) {
		return `\`${prop.name}\` or \`${prop.name}="true"\``;
	}

	// String properties with contextual examples
	if (type.includes("string")) {
		if (name.includes("text") || name.includes("title") || name.includes("headline")) {
			return `\`${prop.name}="Example text"\``;
		}
		if (name.includes("url") || name.includes("href")) {
			return `\`${prop.name}="https://example.com"\``;
		}
		if (name.includes("id")) {
			return `\`${prop.name}="unique-id"\``;
		}
		return `\`${prop.name}="value"\``;
	}

	// Numeric properties
	if (type.includes("number")) {
		return `\`${prop.name}="1"\``;
	}

	// Union types - show first valid option
	if (type.includes("|")) {
		const options = type.split("|").map((t: any) => t.trim().replace(/['"]/g, ""));
		const firstOption = options[0];
		return `\`${prop.name}="${firstOption}"\``;
	}

	return null;
}