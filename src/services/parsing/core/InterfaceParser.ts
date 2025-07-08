import type { ComponentProperty } from "../../../types";

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
				let cleanLine = trimmedLine.replace(/^\/\*\*\s*/, '').replace(/\s*\*\/$/, '').replace(/^\*\s*/, '');
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
