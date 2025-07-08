import { describe, it, expect, beforeEach } from "vitest";
import { ComponentParser } from "../../src/services/componentParser";

describe("ComponentParser", () => {
	let parser: ComponentParser;

	beforeEach(() => {
		parser = new ComponentParser();
	});

	describe("determineComponentStatus", () => {
		it("should return USE_WITH_CAUTION for caution category", () => {
			const status = parser.determineComponentStatus("caution", "any");
			expect(status).toBe("USE_WITH_CAUTION");
		});

		it("should return RECOMMENDED for best_practice level", () => {
			const status = parser.determineComponentStatus("", "best_practice");
			expect(status).toBe("RECOMMENDED");
		});

		it("should return STABLE for deployed level", () => {
			const status = parser.determineComponentStatus("", "deployed");
			expect(status).toBe("STABLE");
		});

		it("should return EXPERIMENTAL for candidate level", () => {
			const status = parser.determineComponentStatus("", "candidate");
			expect(status).toBe("EXPERIMENTAL");
		});

		it("should return AVAILABLE_WITH_ISSUES for available level", () => {
			const status = parser.determineComponentStatus("", "available");
			expect(status).toBe("AVAILABLE_WITH_ISSUES");
		});

		it("should return UNKNOWN for unrecognized level", () => {
			const status = parser.determineComponentStatus("", "unrecognized");
			expect(status).toBe("UNKNOWN");
		});
	});

	describe("getRecommendation", () => {
		it("should return caution message for caution category", () => {
			const recommendation = parser.getRecommendation("caution", "any");
			expect(recommendation).toBe("Use with caution - this component may have known issues or limitations");
		});

		it("should return appropriate message for best_practice", () => {
			const recommendation = parser.getRecommendation("", "best_practice");
			expect(recommendation).toBe("Recommended for production use - follows VA design system best practices");
		});
	});

	describe("parseInterfaceProperties", () => {
		it("should parse simple property", () => {
			const interfaceBody = `
				/**
				 * The button text
				 */
				text: string;
			`;
			const properties = parser.parseInterfaceProperties(interfaceBody);
			expect(properties).toHaveLength(1);
			expect(properties[0]).toEqual({
				name: "text",
				type: "string",
				optional: false,
				description: "* The button text /",
			});
		});

		it("should parse optional property", () => {
			const interfaceBody = `
				disabled?: boolean;
			`;
			const properties = parser.parseInterfaceProperties(interfaceBody);
			expect(properties).toHaveLength(1);
			expect(properties[0]).toEqual({
				name: "disabled",
				type: "boolean",
				optional: true,
				description: undefined,
			});
		});

		it("should parse quoted property names", () => {
			const interfaceBody = `
				"aria-label"?: string;
			`;
			const properties = parser.parseInterfaceProperties(interfaceBody);
			expect(properties).toHaveLength(1);
			expect(properties[0]).toEqual({
				name: "aria-label",
				type: "string",
				optional: true,
				description: undefined,
			});
		});
	});

	describe("findComponentByName", () => {
		it("should find component by exact name", () => {
			const components = new Map([
				["Button", { name: "Button", tagName: "va-button", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = parser.findComponentByName("Button", components);
			expect(result).toBeTruthy();
			expect(result?.name).toBe("Button");
		});

		it("should find component by kebab-case name", () => {
			const components = new Map([
				["File input multiple", { name: "File input multiple", tagName: "va-file-input-multiple", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = parser.findComponentByName("file-input-multiple", components);
			expect(result).toBeTruthy();
			expect(result?.name).toBe("File input multiple");
		});

		it("should find component with hyphen in name", () => {
			const components = new Map([
				["Alert - expandable", { name: "Alert - expandable", tagName: "va-alert-expandable", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = parser.findComponentByName("alert-expandable", components);
			expect(result).toBeTruthy();
			expect(result?.name).toBe("Alert - expandable");
		});

		it("should return null for non-existent component", () => {
			const components = new Map([
				["Button", { name: "Button", tagName: "va-button", status: "RECOMMENDED", maturityLevel: "best_practice" }],
			]);
			const result = parser.findComponentByName("NonExistent", components);
			expect(result).toBeNull();
		});
	});
});