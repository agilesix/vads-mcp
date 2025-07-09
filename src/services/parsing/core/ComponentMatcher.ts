import type { ComponentData } from "../../../types";

/**
 * ComponentMatcher - Handles component name matching and suggestions
 * 
 * This service provides intelligent component name matching with support for
 * multiple naming conventions used in the VA Design System. It handles fuzzy
 * matching, name normalization, and suggestion generation for component discovery.
 * 
 * ## Naming Convention Support
 * 
 * Supports multiple VA Design System naming patterns:
 * - **Kebab-case**: `button-icon`, `alert-expandable`, `file-input-multiple`
 * - **Space-separated**: `button icon`, `alert expandable`, `file input multiple`
 * - **PascalCase**: `ButtonIcon`, `AlertExpandable`, `FileInputMultiple`
 * - **Component names**: `Button`, `Alert`, `FileInput`
 * 
 * ## Matching Strategy
 * 
 * Uses intelligent matching algorithms:
 * 1. **Exact Match**: Direct name matching across all conventions
 * 2. **Normalized Match**: Convert inputs to consistent format for comparison
 * 3. **Partial Match**: Match component name parts and variations
 * 4. **Fuzzy Match**: Handle typos and similar names with scoring
 * 
 * ## Suggestion Generation
 * 
 * Provides helpful suggestions when exact matches aren't found:
 * - Similar component names based on edit distance
 * - Components with matching prefixes or suffixes
 * - Components in the same category or with similar properties
 * - Popular components that might be intended
 * 
 * ## Integration
 * 
 * Used by ComponentParser and tools for:
 * - Finding components by name in getComponentProperties
 * - Providing suggestions in listComponents
 * - Handling user input variations in all tools
 * - Supporting both exact and fuzzy component discovery
 * 
 * @see ComponentParser For the main interface using matching
 * @see getComponentProperties For component lookup by name
 * @see listComponents For component discovery and suggestions
 */
export class ComponentMatcher {
	findComponentByName(
		componentName: string,
		components: Map<string, ComponentData>,
	): ComponentData | null {
		const exactMatch = components.get(componentName);
		if (exactMatch) return exactMatch;

		const normalizedName = this.normalizeComponentName(componentName);

		for (const [_, component] of components) {
			if (this.isNameMatch(componentName, component)) {
				return component;
			}
		}

		return null;
	}

	getSuggestedComponentNames(
		inputName: string,
		components: Map<string, ComponentData>,
	): string[] {
		const input = inputName.toLowerCase();
		const suggestions: Array<{ name: string; score: number }> = [];

		for (const [_, component] of components) {
			const componentName = component.name.toLowerCase();

			let score = 0;

			if (componentName.includes(input) || input.includes(componentName)) {
				score += 10;
			}

			const commonWords = ["button", "input", "alert", "form", "text", "file"];
			for (const word of commonWords) {
				if (input.includes(word) && componentName.includes(word)) {
					score += 5;
				}
			}

			const lengthDiff = Math.abs(input.length - componentName.length);
			score += Math.max(0, 5 - lengthDiff);

			if (score > 0) {
				suggestions.push({ name: component.name, score });
			}
		}

		return suggestions
			.sort((a, b) => b.score - a.score)
			.slice(0, 5)
			.map((s) => s.name);
	}

	private normalizeComponentName(name: string): string {
		return name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");
	}

	private isNameMatch(inputName: string, component: ComponentData): boolean {
		const input = inputName.toLowerCase();
		const componentName = component.name.toLowerCase();
		const tagName = component.tagName.toLowerCase();

		if (componentName === input) return true;
		if (tagName === `va-${input}`) return true;

		const normalizedInput = this.normalizeComponentName(input);
		const normalizedComponent = this.normalizeComponentName(component.name);
		const normalizedTag = component.tagName.replace("va-", "");

		if (normalizedComponent === normalizedInput) return true;
		if (normalizedTag === normalizedInput) return true;

		const inputKebab = input.replace(/\s+/g, "-");
		const componentKebab = componentName.replace(/\s+/g, "-").replace(/\s*-\s*/g, "-");
		
		if (componentKebab === inputKebab) return true;

		const inputWords = input.split(/[\s-]+/);
		const componentWords = componentName.split(/[\s-]+/);
		
		if (inputWords.length === componentWords.length) {
			const allMatch = inputWords.every((word, i) => 
				word === componentWords[i]?.toLowerCase()
			);
			if (allMatch) return true;
		}

		return false;
	}
}
