import { describe, it, expect } from "vitest";
import { PropertyClassifier } from "../../../../src/services/parsing/analysis/PropertyClassifier";

describe("PropertyClassifier", () => {
	const classifier = new PropertyClassifier();

	describe("isAccessibilityProp", () => {
		it("should classify aria properties as accessibility", () => {
			expect(classifier.isAccessibilityProp("aria-label", "string")).toBe(true);
			expect(classifier.isAccessibilityProp("aria-describedby", "string")).toBe(true);
			expect(classifier.isAccessibilityProp("role", "string")).toBe(true);
		});

		it("should not classify regular properties as accessibility", () => {
			expect(classifier.isAccessibilityProp("text", "string")).toBe(false);
			expect(classifier.isAccessibilityProp("value", "string")).toBe(false);
		});
	});

	describe("isStateProp", () => {
		it("should classify state properties correctly", () => {
			expect(classifier.isStateProp("disabled", "boolean")).toBe(true);
			expect(classifier.isStateProp("loading", "boolean")).toBe(true);
			expect(classifier.isStateProp("error", "boolean")).toBe(true);
		});
	});

	describe("isFormRelatedProp", () => {
		it("should classify form properties correctly", () => {
			expect(classifier.isFormRelatedProp("name")).toBe(true);
			expect(classifier.isFormRelatedProp("value")).toBe(true);
			expect(classifier.isFormRelatedProp("required")).toBe(true);
		});
	});
});
