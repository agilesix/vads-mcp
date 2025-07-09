import { z } from "zod";
import type { ToolDefinition } from "../types";
import { ExampleType } from "../types";

const COMPONENT_DEFINITIONS_URL =
	"https://raw.githubusercontent.com/department-of-veterans-affairs/component-library/refs/heads/main/packages/web-components/src/components.d.ts";

export const getComponentExamplesSchema = z.object({
	componentName: z
		.string()
		.min(1)
		.describe(
			"The name of the VA Design System component to generate examples for. " +
				"Examples: 'button', 'alert', 'accordion', 'text-input', 'checkbox', 'radio', 'select', 'textarea', 'date-picker', 'file-input', 'banner', 'breadcrumb', 'card', 'link', 'loading-indicator', 'modal', 'notification', 'pagination', 'progress-bar', 'table', 'tabs', 'tooltip'. " +
				"This should be the component name without the 'va-' prefix (e.g., use 'button' not 'va-button').",
		),
	exampleTypes: z
		.array(z.enum([ExampleType.BASIC, ExampleType.STATE, ExampleType.ACCESSIBILITY, ExampleType.FORM, "all"]))
		.default([ExampleType.BASIC])
		.describe(
			"Types of examples to generate. Options: " +
				"'basic' - Simple usage examples with essential properties, " +
				"'state' - Examples showing different component states (disabled, loading, etc.), " +
				"'accessibility' - Examples with enhanced accessibility features, " +
				"'form' - Examples showing component usage within forms, " +
				"'all' - Generate all available example types for comprehensive coverage.",
		),
	includeDescription: z
		.boolean()
		.default(true)
		.describe(
			"Whether to include detailed descriptions for each example. " +
				"Set to false for a more concise output showing only the code examples.",
		),
	framework: z
		.enum(["html", "react", "vue", "angular"])
		.default("html")
		.describe(
			"The framework/syntax to use for the examples. " +
				"Note: Currently only HTML examples are fully supported. Other frameworks will show HTML syntax with framework-specific notes.",
		),
});

export const getComponentExamplesTool: ToolDefinition = {
	name: "getComponentExamples",
	schema: getComponentExamplesSchema,
	handler: async (
		{ componentName, exampleTypes, includeDescription, framework },
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

			// Find the requested component using enhanced matching
			const component = componentParser.findComponentByName(componentName, components);

			if (!component) {
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

			// Determine which example types to generate
			const typesToGenerate = exampleTypes.includes("all")
				? [ExampleType.BASIC, ExampleType.STATE, ExampleType.ACCESSIBILITY, ExampleType.FORM]
				: exampleTypes;

			// Generate examples using the component parser
			const generatedExamples = componentParser.generateExamples(component, {
				framework,
				includeDescription,
			});

			// Filter examples based on requested types
			const filteredExamples = generatedExamples.filter((example: any) =>
				typesToGenerate.includes(example.purpose || ExampleType.BASIC),
			);

			// If no examples match the filter, include basic example
			const examples =
				filteredExamples.length > 0
					? filteredExamples
					: generatedExamples.filter((ex: any) => ex.purpose === ExampleType.BASIC);

			// Format the response
			let response = `# ${component.name} Component Examples\n\n`;
			response += `**Tag Name:** \`${component.tagName}\`\n`;
			response += `**Status:** ${component.status}\n`;
			response += `**Maturity Level:** ${component.maturityLevel}\n`;

			if (component.recommendation) {
				response += `**Recommendation:** ${component.recommendation}\n`;
			}

			if (framework !== "html") {
				response += `\n**Note:** Examples are shown in HTML syntax. For ${framework.toUpperCase()} usage, adapt the HTML attributes to the appropriate framework syntax.\n`;
			}

			response += `\n## Examples (${examples.length} total)\n\n`;

			if (examples.length === 0) {
				response += `**No examples available for the requested types: ${typesToGenerate.join(", ")}**\n\n`;
				response += `Try using 'basic' example type or 'all' to see available examples.`;
			} else {
				examples.forEach((example: any, index: number) => {
					response += `### ${index + 1}. ${example.title}\n\n`;

					if (includeDescription && example.description) {
						response += `${example.description}\n\n`;
					}

					response += `\`\`\`${example.framework || "html"}\n${example.code}\n\`\`\`\n\n`;

					if (framework !== "html" && example.framework === "html") {
						response += `${getFrameworkNotes(framework, component.tagName)}\n\n`;
					}
				});

				// Add usage guidance
				response += "## Usage Guidance\n\n";
				response += `• **Component Status:** ${component.status} - ${component.recommendation}\n`;

				if (component.properties && component.properties.length > 0) {
					const requiredProps = component.properties.filter((p: any) => !p.optional);
					if (requiredProps.length > 0) {
						response += `• **Required Properties:** ${requiredProps.map((p: any) => `\`${p.name}\``).join(", ")}\n`;
					}
				}

				response +=
					"• **Documentation:** Refer to the VA Design System documentation for complete usage guidelines\n";
				response +=
					"• **Accessibility:** Always test with screen readers and keyboard navigation\n";
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
						text: `**Error generating component examples:**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Troubleshooting:**\n• Verify the component name is correct\n• Check that the VA Design System GitHub repository is accessible\n• Ensure the component exists in the current version of the design system\n• Try using different example types: 'basic', 'state', 'accessibility', 'form', or 'all'\n• Verify the requested framework is supported`,
					},
				],
			};
		}
	},
};

function getFrameworkNotes(framework: string, tagName: string): string {
	switch (framework) {
		case "react":
			return `**React Usage Notes:**\n• Use \`className\` instead of \`class\`\n• Boolean props can be written as \`{true}\` or just the prop name\n• Event handlers use camelCase (e.g., \`onClick\`)\n• Import the component: \`import '${tagName}'\``;

		case "vue":
			return `**Vue Usage Notes:**\n• Use \`v-bind:\` or \`:\` for dynamic props\n• Boolean props can be written as \`:prop="true"\` or just the prop name\n• Event handlers use \`@\` syntax (e.g., \`@click\`)\n• Import the component in your Vue component`;

		case "angular":
			return `**Angular Usage Notes:**\n• Use \`[prop]="value"\` for property binding\n• Boolean props can be written as \`[prop]="true"\` or just the prop name\n• Event handlers use \`(event)="handler()"\` syntax\n• Import the component in your Angular module`;

		default:
			return "";
	}
}
