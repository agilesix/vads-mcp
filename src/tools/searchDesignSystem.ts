import { z } from "zod";
import type { ToolDefinition } from "../types";

export const searchDesignSystemSchema = z.object({
	query: z
		.string()
		.min(1)
		.describe(
			"Your search query. Can be questions about VA Design System components, accessibility guidelines, design patterns, or any content in the knowledge base. " +
				"Examples: 'How do I use the button component?', 'What are the color accessibility requirements?', 'Alert component variants'",
		),

	autoragId: z
		.string()
		.min(1)
		.default("vads-rag-mcp")
		.describe(
			"AutoRAG instance identifier to search. Use 'vads-rag-mcp' for VA Design System documentation. " +
				"Other examples: 'design-patterns-rag', 'accessibility-docs-rag'. " +
				"This determines which knowledge base gets searched.",
		),

	maxResults: z
		.number()
		.min(1)
		.max(50)
		.default(10)
		.describe(
			"Maximum number of document chunks to retrieve from the knowledge base. " +
				"More results = broader coverage but potentially less focused. " +
				"Recommended: 5-15 for specific questions, 20-50 for comprehensive research.",
		),

	scoreThreshold: z
		.number()
		.min(0)
		.max(1)
		.default(0.3)
		.describe(
			"Minimum similarity score (0.0 to 1.0) for including results. Controls result quality vs quantity:\n" +
				"• 0.7-1.0: High precision, only very relevant matches (may miss some relevant content)\n" +
				"• 0.5-0.7: Balanced precision and recall (recommended for most searches)\n" +
				"• 0.3-0.5: High recall, includes loosely related content (good for exploratory searches)\n" +
				"• 0.0-0.3: Returns almost everything (use for very broad searches)",
		),
});

export const searchDesignSystemTool: ToolDefinition = {
	name: "searchDesignSystem",
	schema: searchDesignSystemSchema,
	handler: async (
		{ query, autoragId, maxResults, scoreThreshold },
		env: Env,
		_services?: any,
	) => {
		try {
			const results = await env.AI.autorag(autoragId).search({
				query,
				rewrite_query: true,
				max_num_results: maxResults,
				ranking_options: {
					score_threshold: scoreThreshold,
				},
			});

			const resultCount = Array.isArray(results) ? results.length : "Unknown number of";
			return {
				content: [
					{
						type: "text" as const,
						text: `**Search Results (${resultCount} documents found):**\n\n${JSON.stringify(results, null, 2)}`,
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: "text" as const,
						text: `**Error searching "${autoragId}":**\n\n${error instanceof Error ? error.message : String(error)}\n\n**Troubleshooting:**\n- Verify the AutoRAG instance "${autoragId}" exists and is accessible\n- Check if the knowledge base has finished indexing\n- Try a simpler query or adjust the score threshold\n- Ensure you have proper permissions to access this AutoRAG instance`,
					},
				],
			};
		}
	},
};
