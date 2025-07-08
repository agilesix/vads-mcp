import { z } from "zod";
import type { ToolDefinition } from "../types";

export const listComponentsSchema = z.object({
	status: z
		.enum([
			"RECOMMENDED",
			"STABLE",
			"EXPERIMENTAL",
			"AVAILABLE_WITH_ISSUES",
			"USE_WITH_CAUTION",
			"UNKNOWN",
			"all",
		])
		.default("all")
		.describe("Filter components by maturity status. Use 'all' to show all components."),
	category: z
		.string()
		.optional()
		.describe(
			"Optional category filter (e.g., 'form', 'button', 'alert'). Searches component names for matching terms.",
		),
	includeMetadata: z
		.boolean()
		.default(true)
		.describe(
			"Include detailed metadata like property count, status details, and usage examples.",
		),
	sortBy: z
		.enum(["name", "status", "maturityLevel"])
		.default("name")
		.describe("Sort components by name, status, or maturityLevel"),
});

export const listComponentsTool: ToolDefinition = {
	name: "listComponents",
	schema: listComponentsSchema,
	handler: async (
		{ status, category, includeMetadata, sortBy },
		_env: Env,
		services?: {
			github: any;
			componentParser: any;
		},
	) => {
		if (!services?.github || !services?.componentParser) {
			return {
				content: [
					{
						type: "text" as const,
						text: "Error: Required services (github, componentParser) not available",
					},
				],
			};
		}

		try {
			const url =
				"https://raw.githubusercontent.com/department-of-veterans-affairs/component-library/refs/heads/main/packages/web-components/src/components.d.ts";
			const content = await services.github.fetchRawContent(url);
			const componentBlocks = services.componentParser.extractComponentBlocks(content);

			// Parse components and determine status
			const components = componentBlocks.map((block: any) => {
				const status = services.componentParser.determineComponentStatus(
					block.maturityCategory,
					block.maturityLevel,
				);
				const recommendation = services.componentParser.getRecommendation(
					block.maturityCategory,
					block.maturityLevel,
				);

				return {
					name: block.componentName,
					tagName: block.tagName,
					status,
					maturityCategory: block.maturityCategory,
					maturityLevel: block.maturityLevel,
					recommendation,
				};
			});

			// Filter by status if specified
			let filteredComponents = components;
			if (status !== "all") {
				filteredComponents = components.filter(
					(component: any) => component.status === status,
				);
			}

			// Filter by category if specified
			if (category) {
				filteredComponents = filteredComponents.filter((component: any) =>
					component.name.toLowerCase().includes(category.toLowerCase()),
				);
			}

			// Sort components
			filteredComponents.sort((a: any, b: any) => {
				switch (sortBy) {
					case "status":
						return a.status.localeCompare(b.status);
					case "maturityLevel":
						return a.maturityLevel.localeCompare(b.maturityLevel);
					default:
						return a.name.localeCompare(b.name);
				}
			});

			// Group components by status for better presentation
			const statusGroups = filteredComponents.reduce((acc: any, component: any) => {
				if (!acc[component.status]) {
					acc[component.status] = [];
				}
				acc[component.status].push(component);
				return acc;
			}, {});

			// Format the output
			let output = `# VA Design System Components (${filteredComponents.length} total)\n\n`;

			// Add naming convention guidance if metadata is included
			if (includeMetadata) {
				output += `## 💡 Naming Convention Guide\n\n`;
				output += `VA Design System components can be referenced using either naming convention:\n\n`;
				output += `**✅ Kebab-case (Recommended):**\n`;
				output += `• \`file-input-multiple\`, \`alert-expandable\`, \`button-icon\`\n`;
				output += `• Standard HTML custom element naming\n`;
				output += `• Works with all MCP tools\n\n`;
				output += `**✅ Exact Names (Also Supported):**\n`;
				output += `• \`File input multiple\`, \`Alert - expandable\`, \`Button - Icon\`\n`;
				output += `• Official VA Design System naming\n`;
				output += `• Case-sensitive matching\n\n`;
				output += `**❌ Avoid:**\n`;
				output += `• Including 'va-' prefix: use \`button\` not \`va-button\`\n`;
				output += `• Incorrect casing: \`FILE-INPUT-MULTIPLE\` won't work\n\n`;
			}

			// Add status summary if metadata is included
			if (includeMetadata) {
				const statusCounts = Object.entries(statusGroups).map(
					([status, comps]: [string, any]) => `${status}: ${comps.length}`,
				);
				output += `## 📊 Status Summary\n\n`;
				output += `${statusCounts.join(" • ")}\n\n`;
			}

			// Add detailed component list grouped by status
			for (const [status, statusComponents] of Object.entries(statusGroups)) {
				output += `## ${status} (${(statusComponents as any[]).length} components)\n\n`;

				for (const component of statusComponents as any[]) {
					// Generate kebab-case version for better UX
					const kebabCaseName = component.name
						.toLowerCase()
						.replace(/\s*-\s*/g, "-") // "Alert - expandable" -> "alert-expandable"
						.replace(/\s+/g, "-"); // "File input multiple" -> "file-input-multiple"

					if (includeMetadata) {
						output += `### ${component.name}\n`;
						output += `- **Usage:** \`${kebabCaseName}\` or \`${component.name}\`\n`;
						output += `- **HTML Tag:** \`<${component.tagName}>\`\n`;
						output += `- **Status:** ${component.status}\n`;
						output += `- **Maturity Level:** ${component.maturityLevel}\n`;
						if (component.maturityCategory) {
							output += `- **Maturity Category:** ${component.maturityCategory}\n`;
						}
						output += `- **Recommendation:** ${component.recommendation}\n\n`;
					} else {
						// Concise format without metadata
						output += `• **${component.name}** - \`${kebabCaseName}\` - ${component.status}\n`;
					}
				}

				if (!includeMetadata) {
					output += `\n`;
				}
			}

			// Add usage examples if metadata is included
			if (includeMetadata) {
				output += `## 🚀 Quick Start Examples\n\n`;
				output += `**Get component properties:**\n`;
				output += `\`\`\`\n`;
				output += `getComponentProperties(componentName: "button")\n`;
				output += `getComponentProperties(componentName: "file-input-multiple")\n`;
				output += `getComponentProperties(componentName: "Alert - expandable")\n`;
				output += `\`\`\`\n\n`;
				output += `**Get component examples:**\n`;
				output += `\`\`\`\n`;
				output += `getComponentExamples(componentName: "alert", exampleTypes: ["basic", "state"])\n`;
				output += `getComponentExamples(componentName: "button-icon", framework: "react")\n`;
				output += `\`\`\`\n\n`;
				output += `**Search documentation:**\n`;
				output += `\`\`\`\n`;
				output += `searchDesignSystem(query: "accessibility guidelines")\n`;
				output += `searchDesignSystem(query: "form validation patterns")\n`;
				output += `\`\`\`\n\n`;
			}

			return {
				content: [
					{
						type: "text" as const,
						text: output,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `**Error fetching components:**\n\n${error instanceof Error ? error.message : String(error)}`,
					},
				],
			};
		}
	},
};
