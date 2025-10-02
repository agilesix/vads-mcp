import type { ComponentProperty } from "../../../types";

/**
 * InterfaceParser - Parses TypeScript interface properties from component definitions
 * 
 * This service extracts property information from TypeScript interface bodies,
 * including property names, types, optional status, and JSDoc descriptions.
 * It handles the parsing of complex TypeScript syntax including union types,
 * optional properties, and quoted property names.
 * 
 * ## Parsing Capabilities
 * 
 * - **Property Types**: Handles primitive types, union types, arrays, and objects
 * - **Optional Properties**: Detects optional properties using `?` syntax
 * - **Quoted Names**: Supports quoted property names like `"aria-label"`
 * - **JSDoc Comments**: Extracts and cleans property descriptions from comments
 * - **Complex Types**: Parses union types, generics, and nested structures
 * 
 * ## Input Format
 * 
 * Processes TypeScript interface bodies like:
 * 
 * ```typescript
 * {
 *   /**
 *    * The button text to display
 *    *\/
 *   text: string;
 *   
 *   disabled?: boolean;
 *   
 *   "aria-label"?: string;
 *   
 *   variant: "primary" | "secondary" | "ghost";
 * }
 * ```
 * 
 * ## Output
 * 
 * Returns ComponentProperty objects with:
 * - `name`: Property name (unquoted)
 * - `type`: TypeScript type string
 * - `optional`: Boolean indicating if property is optional
 * - `description`: Cleaned JSDoc description (if present)
 * 
 * @see ComponentProperty For the structure of parsed property data
 * @see MetadataExtractor For extracting the interface body
 */
export class InterfaceParser {
	parseInterfaceProperties(interfaceBody: string): ComponentProperty[] {
		const properties: ComponentProperty[] = [];

		const propertyLines = interfaceBody.split("\n");
		let currentComment = "";

		for (const line of propertyLines) {
			const trimmedLine = line.trim();

			if (
				!trimmedLine ||
				trimmedLine.includes("interface") ||
				trimmedLine === "{" ||
				trimmedLine === "}"
			) {
				continue;
			}

			if (trimmedLine.startsWith("/**") || trimmedLine.startsWith("*")) {
				const cleanLine = trimmedLine.replace(/^\/\*\*\s*/, '').replace(/\s*\*\/$/, '').replace(/^\*\s*/, '');
				if (cleanLine) {
					currentComment += cleanLine + " ";
				}
				continue;
			}

			if (trimmedLine.includes(":") && trimmedLine.endsWith(";")) {
				const property = this.parsePropertyDefinition(trimmedLine);
				if (property) {
					property.description = currentComment.trim() || undefined;
					properties.push(property);
				}
				currentComment = "";
			}
		}

		return properties;
	}

	parsePropertyDefinition(line: string): ComponentProperty | null {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) return null;

		const propPart = line.substring(0, colonIndex).trim();
		const typePart = line.substring(colonIndex + 1).replace(";", "").trim();

		const isOptional = propPart.endsWith("?");
		let propName = isOptional ? propPart.slice(0, -1) : propPart;

		if (propName.startsWith('"') && propName.endsWith('"')) {
			propName = propName.slice(1, -1);
		}

		return {
			name: propName.trim(),
			type: typePart.trim(),
			optional: isOptional,
		};
	}
}
