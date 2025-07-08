import { z } from "zod";
import type { ToolDefinition } from "../types";

const COMPONENT_DEFINITIONS_URL =
	"https://raw.githubusercontent.com/department-of-veterans-affairs/component-library/refs/heads/main/packages/web-components/src/components.d.ts";

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

			// Fetch component definitions from GitHub
			const content = await github.fetchRawContent(COMPONENT_DEFINITIONS_URL);

			// Parse the TypeScript definitions
			const components = componentParser.parseComponentMetadata(content);

			// Find the requested component
			const component =
				components.get(componentName) ||
				Array.from(components.values()).find(
					(c: any) =>
						c.name.toLowerCase() === componentName.toLowerCase() ||
						c.tagName === `va-${componentName.toLowerCase()}`,
				);

			if (!component) {
				const availableComponents = Array.from(components.keys()).sort();
				return {
					content: [
						{
							type: "text" as const,
							text: `**Component "${componentName}" not found.**\n\n**Available components:**\n${availableComponents.map((name) => `• ${name}`).join("\n")}\n\n**Note:** Component names should not include the 'va-' prefix. Use 'button' instead of 'va-button'.`,
						},
					],
				};
			}

			// Format the response
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

				// Group properties by requirement
				const requiredProps = properties.filter((p: any) => !p.optional);
				const optionalProps = properties.filter((p: any) => p.optional);

							if (requiredProps.length > 0) {
				response += `### Required Properties (${requiredProps.length})\n\n`;
				for (const prop of requiredProps) {
					response += formatProperty(prop, includeDescription, includeExamples);
				}
			}

							if (optionalProps.length > 0) {
				response += `### Optional Properties (${optionalProps.length})\n\n`;
				for (const prop of optionalProps) {
					response += formatProperty(prop, includeDescription, includeExamples);
				}
			}

							// Add usage summary
			response += "\n## Usage Summary\n\n";
				response += `• **Required props:** ${requiredProps.length}\n`;
				response += `• **Optional props:** ${optionalProps.length}\n`;
				response += `• **Total props:** ${properties.length}\n\n`;

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

function generatePropertyExample(prop: any): string | null {
	const name = prop.name.toLowerCase();
	const type = prop.type.toLowerCase();

	if (type.includes("boolean")) {
		return `\`${prop.name}\` or \`${prop.name}="true"\``;
	}

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

	if (type.includes("number")) {
		return `\`${prop.name}="1"\``;
	}

	if (type.includes("|")) {
		// Union type - extract first option
		const options = type.split("|").map((t: any) => t.trim().replace(/['"]/g, ""));
		const firstOption = options[0];
		return `\`${prop.name}="${firstOption}"\``;
	}

	return null;
}
