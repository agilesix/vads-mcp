import { describe, it, expect } from "vitest";
import { CompositeDetector } from "../../../../src/services/parsing/generation/CompositeDetector";
import type { ComponentSemanticAnalysis } from "../../../../src/types";

describe("CompositeDetector", () => {
	const detector = new CompositeDetector();

	describe("detectCompositeComponent", () => {
		it("should detect radio group components", () => {
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

			const result = detector.detectCompositeComponent("va-radio-group", analysis);
			expect(result).toBeTruthy();
			expect(result!.type).toBe("form-choice-group");
			expect(result!.childElement).toBe("va-radio-option");
		});

		it("should return null for non-composite components", () => {
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

			const result = detector.detectCompositeComponent("va-button", analysis);
			expect(result).toBeNull();
		});
	});
});
