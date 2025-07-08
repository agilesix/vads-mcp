import { describe, it, expect } from "vitest";
import { ValueGenerator } from "../../../../src/services/parsing/generation/ValueGenerator";
import type { ComponentProperty, ComponentSemanticAnalysis } from "../../../../src/types";

describe("ValueGenerator", () => {
	const generator = new ValueGenerator();

	describe("generateContextualValue", () => {
		it("should generate appropriate values for form components", () => {
			const prop: ComponentProperty = { name: "label", type: "string", optional: false };
			const analysis: ComponentSemanticAnalysis = {
				visibleTextProps: [],
				accessibilityProps: [],
				stateProps: [],
				configProps: [],
				eventProps: [],
				requiredProps: [],
				slotProps: [],
				isFormRelated: true,
				isInteractive: false,
				hasStates: false,
				hasConditionalContent: false,
				hasAccessibilityEnhancements: false,
				hasSlots: false,
				inferredPurpose: "input",
				contentStrategy: "",
			};

			const value = generator.generateContextualValue(prop, analysis);
			expect(value).toContain("Email Address");
		});

		it("should handle boolean types", () => {
			const prop: ComponentProperty = { name: "disabled", type: "boolean", optional: true };
			const analysis: ComponentSemanticAnalysis = {
				visibleTextProps: [],
				accessibilityProps: [],
				stateProps: [],
				configProps: [],
				eventProps: [],
				requiredProps: [],
				slotProps: [],
				isFormRelated: false,
				isInteractive: false,
				hasStates: false,
				hasConditionalContent: false,
				hasAccessibilityEnhancements: false,
				hasSlots: false,
				inferredPurpose: "display",
				contentStrategy: "",
			};

			const value = generator.generateContextualValue(prop, analysis);
			expect(value).toBe("true");
		});
	});
});
