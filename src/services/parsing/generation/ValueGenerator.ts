import type { ComponentProperty, ComponentSemanticAnalysis, ComponentPurpose } from "../../../types";
import { ComponentPurpose as Purpose } from "../../../types";

/**
 * ValueGenerator - Generates contextual values for component properties
 * 
 * This service creates realistic, contextual values for component properties
 * based on their type, name, and the semantic analysis of the component.
 * It provides intelligent value generation that considers the component's
 * purpose and context to create meaningful examples.
 * 
 * ## Value Generation Strategy
 * 
 * The generator uses multiple strategies to create appropriate values:
 * 
 * 1. **Type-based Generation**: Uses TypeScript type information to generate valid values
 * 2. **Name Pattern Matching**: Analyzes property names for semantic meaning
 * 3. **Purpose-aware Context**: Adapts values based on component purpose (action, input, etc.)
 * 4. **Union Type Handling**: Extracts meaningful options from union types
 * 5. **Array and Object Support**: Handles complex data structures appropriately
 * 
 * ## Supported Types
 * 
 * - **Primitives**: string, number, boolean
 * - **Union Types**: Extracts first meaningful option from type unions
 * - **Arrays**: Generates appropriate array structures with sample data
 * - **Objects**: Creates empty objects or structured data as appropriate
 * - **Complex Types**: Handles generics and nested structures
 * 
 * ## Context-Aware Values
 * 
 * Generates values based on component purpose:
 * - **ACTION**: Submit buttons, action-oriented text
 * - **INPUT**: Form labels, validation messages, input names
 * - **NOTIFICATION**: Status messages, alert content
 * - **NAVIGATION**: Links, navigation labels
 * - **CONTAINER**: Structural content, headings
 * 
 * ## Special Cases
 * 
 * Handles special property patterns:
 * - Accessibility properties (aria-*, role)
 * - Form properties (name, value, required)
 * - State properties (disabled, loading, error)
 * - Content properties (text, label, headline)
 * 
 * @see ExampleGenerator For using generated values in examples
 * @see ComponentPurpose For the purpose-based value generation
 * @see PropertyClassifier For property type classification
 */
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
			case Purpose.ACTION:
				if (propName === "text") return "Submit Application";
				if (propName === "label") return "Submit your application";
				if (propName.includes("submit")) return "true";
				if (propName === "type") return "submit";
				break;

			case Purpose.NOTIFICATION:
				if (propName.includes("headline")) return "Important Update";
				if (propName === "status") return "info";
				if (propName === "visible") return "true";
				break;

			case Purpose.INPUT:
				if (propName === "label") {
					return "Email Address";
				}
				if (propName === "name") return "email";
				if (propName === "required") return "true";
				break;

			case Purpose.NAVIGATION:
				if (propName === "label") return "Navigation";
				if (propName.includes("href")) return "/example-page";
				break;

			case Purpose.CONTAINER:
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
