import { describe, it, expect } from "vitest";
import { ComponentMatcher } from "../../../../src/services/parsing/core/ComponentMatcher";
import type { ComponentData } from "../../../../src/types";

describe("ComponentMatcher", () => {
	const matcher = new ComponentMatcher();

	describe("findComponentByName", () => {
		it("should find component by exact name", () => {
			const components = new Map([
				["Button", { name: "Button", tagName: "va-button", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = matcher.findComponentByName("Button", components);
			expect(result).toBeTruthy();
			expect(result?.name).toBe("Button");
		});

		it("should find component by kebab-case name", () => {
			const components = new Map([
				["File input multiple", { name: "File input multiple", tagName: "va-file-input-multiple", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = matcher.findComponentByName("file-input-multiple", components);
			expect(result).toBeTruthy();
			expect(result?.name).toBe("File input multiple");
		});

		it("should return null for non-existent component", () => {
			const components = new Map([
				["Button", { name: "Button", tagName: "va-button", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = matcher.findComponentByName("NonExistent", components);
			expect(result).toBeNull();
		});
	});

	describe("getSuggestedComponentNames", () => {
		it("should return suggestions for similar names", () => {
			const components = new Map([
				["Button", { name: "Button", tagName: "va-button", status: "RECOMMENDED", maturityLevel: "best_practice" }],
				["Button Group", { name: "Button Group", tagName: "va-button-group", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const suggestions = matcher.getSuggestedComponentNames("btn", components);
			expect(suggestions.length).toBeGreaterThan(0);
		});
	});
});
