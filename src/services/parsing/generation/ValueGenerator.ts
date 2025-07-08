import type { ComponentProperty, ComponentSemanticAnalysis } from "../../../types";

export class ValueGenerator {
	generateContextualValue(
		prop: ComponentProperty,
		analysis: ComponentSemanticAnalysis,
	): string | null {
		const propName = prop.name.toLowerCase();
		const propType = prop.type.toLowerCase();

		if (propType.includes("array") || propType.includes("[]")) {
			if (propName.includes("breadcrumb")) {
				return '[{"href": "/", "label": "Home"}, {"label": "Current Page"}]';
			}
			if (propName.includes("option")) {
				return '[{"label": "Option 1", "value": "1"}, {"label": "Option 2", "value": "2"}]';
			}
			return "[]";
		}

		if (propType.includes("|")) {
			const options = propType.split("|").map((s) => s.trim().replace(/['"]/g, ""));
			const meaningfulOptions = options.filter(
				(opt) => opt !== "undefined" && opt.length > 0,
			);
			if (meaningfulOptions.length > 0) {
				return meaningfulOptions[0];
			}
		}

		switch (analysis.inferredPurpose) {
			case "action":
				if (propName === "text") return "Submit Application";
				if (propName === "label") return "Submit your application";
				if (propName.includes("submit")) return "true";
				if (propName === "type") return "submit";
				break;

			case "notification":
				if (propName.includes("headline")) return "Important Update";
				if (propName === "status") return "info";
				if (propName === "visible") return "true";
				break;

			case "input":
				if (propName === "label") {
					return "Email Address";
				}
				if (propName === "name") return "email";
				if (propName === "required") return "true";
				break;

			case "navigation":
				if (propName === "label") return "Navigation";
				if (propName.includes("href")) return "/example-page";
				break;

			case "container":
				if (propName.includes("headline")) return "Service Information";
				break;
		}

		if (propType.includes("boolean")) {
			return "true";
		} else if (propType.includes("number")) {
			if (propName.includes("level")) return "2";
			if (propName.includes("timeout")) return "5000";
			return "1";
		} else if (propType.includes("object")) {
			return "{}";
		} else if (propType.includes("string")) {
			if (propName.includes("aria") || propName.includes("label")) {
				return "Descriptive label for screen readers";
			}
			if (propName === "text") return "Click me";
			if (propName === "headline") return "Important Notice";
			if (propName === "status") return "info";
			return "Example value";
		}

		return null;
	}
}
