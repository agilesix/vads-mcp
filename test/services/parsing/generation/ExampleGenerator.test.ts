import { describe, it, expect } from "vitest";
import { ExampleGenerator } from "../../../../src/services/parsing/generation/ExampleGenerator";
import type { ComponentData } from "../../../../src/types";
import { ComponentStatus, MaturityLevel, ExampleType } from "../../../../src/types";

describe("ExampleGenerator", () => {
	const generator = new ExampleGenerator();

	describe("generateExamples", () => {
		it("should generate basic example for button component", () => {
			const component: ComponentData = {
				name: "Button",
				tagName: "va-button",
				status: ComponentStatus.RECOMMENDED,
				maturityLevel: MaturityLevel.BEST_PRACTICE,
				properties: [
					{ name: "text", type: "string", optional: false },
					{ name: "disabled", type: "boolean", optional: true },
				],
			};

			const examples = generator.generateExamples(component);

			expect(examples.length).toBeGreaterThan(0);
			expect(examples[0].title).toBe("Basic Usage");
			expect(examples[0].code).toContain("va-button");
		});

		it("should generate multiple examples for complex components", () => {
			const component: ComponentData = {
				name: "TextInput",
				tagName: "va-text-input",
				status: ComponentStatus.RECOMMENDED,
				maturityLevel: MaturityLevel.BEST_PRACTICE,
				properties: [
					{ name: "label", type: "string", optional: false },
					{ name: "name", type: "string", optional: false },
					{ name: "disabled", type: "boolean", optional: true },
					{ name: "aria-label", type: "string", optional: true },
				],
			};

			const examples = generator.generateExamples(component);

			expect(examples.length).toBeGreaterThan(1);
			expect(examples.some(ex => ex.purpose === ExampleType.BASIC)).toBe(true);
		});
	});
});
