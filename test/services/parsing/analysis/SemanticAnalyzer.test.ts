import { describe, it, expect } from "vitest";
import { SemanticAnalyzer } from "../../../../src/services/parsing/analysis/SemanticAnalyzer";
import type { ComponentData, ComponentProperty } from "../../../../src/types";

describe("SemanticAnalyzer", () => {
	const analyzer = new SemanticAnalyzer();

	describe("analyzeComponentSemantics", () => {
		it("should analyze button component semantics", () => {
			const component: ComponentData = {
				name: "Button",
				tagName: "va-button",
				status: "RECOMMENDED",
				maturityLevel: "best_practice",
			};

			const properties: ComponentProperty[] = [
				{ name: "text", type: "string", optional: false },
				{ name: "disabled", type: "boolean", optional: true },
				{ name: "onClick", type: "function", optional: true },
			];

			const analysis = analyzer.analyzeComponentSemantics(component, properties);

			expect(analysis.visibleTextProps).toHaveLength(1);
			expect(analysis.stateProps).toHaveLength(1);
			expect(analysis.eventProps).toHaveLength(1);
			expect(analysis.isInteractive).toBe(true);
			expect(analysis.hasStates).toBe(true);
		});

		it("should analyze form input component semantics", () => {
			const component: ComponentData = {
				name: "TextInput",
				tagName: "va-text-input",
				status: "RECOMMENDED",
				maturityLevel: "best_practice",
			};

			const properties: ComponentProperty[] = [
				{ name: "label", type: "string", optional: false },
				{ name: "name", type: "string", optional: false },
				{ name: "value", type: "string", optional: true },
				{ name: "required", type: "boolean", optional: true },
			];

			const analysis = analyzer.analyzeComponentSemantics(component, properties);

			expect(analysis.isFormRelated).toBe(true);
			expect(analysis.requiredProps).toHaveLength(2);
			expect(analysis.visibleTextProps.length).toBeGreaterThan(0);
		});
	});
});
