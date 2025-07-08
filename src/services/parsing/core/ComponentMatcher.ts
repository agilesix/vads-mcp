import type { ComponentData } from "../../../types";

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
