import { describe, it, expect } from "vitest";
import { PurposeInference } from "../../../../src/services/parsing/analysis/PurposeInference";
import type { ComponentSemanticAnalysis } from "../../../../src/types";

describe("PurposeInference", () => {
	const inference = new PurposeInference();

	describe("inferPurposeFromProperties", () => {
		it("should infer action purpose for form buttons", () => {
			const analysis: ComponentSemanticAnalysis = {
				visibleTextProps: [{ name: "button-text", type: "string", optional: false }],
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
				inferredPurpose: "",
				contentStrategy: "",
			};

			const purpose = inference.inferPurposeFromProperties(analysis);
			expect(purpose).toBe("action");
		});

		it("should infer input purpose for form components", () => {
			const analysis: ComponentSemanticAnalysis = {
				visibleTextProps: [{ name: "label", type: "string", optional: false }],
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
				inferredPurpose: "",
				contentStrategy: "",
			};

			const purpose = inference.inferPurposeFromProperties(analysis);
			expect(purpose).toBe("input");
		});
	});

	describe("determineContentStrategy", () => {
		it("should determine form-label strategy for form components with labels", () => {
			const analysis: ComponentSemanticAnalysis = {
				visibleTextProps: [{ name: "label", type: "string", optional: false }],
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
				inferredPurpose: "",
				contentStrategy: "",
			};

			const strategy = inference.determineContentStrategy(analysis);
			expect(strategy).toBe("form-label");
		});
	});
});
