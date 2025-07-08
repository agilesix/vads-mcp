import { describe, it, expect } from "vitest";
import { InterfaceParser } from "../../../../src/services/parsing/core/InterfaceParser";

describe("InterfaceParser", () => {
	const parser = new InterfaceParser();

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
			description: "The button text",
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
});
