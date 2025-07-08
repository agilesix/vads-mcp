import type { ComponentProperty } from "../../../types";

/**
 * PropertyClassifier - Classifies component properties by purpose and functionality
 * 
 * This service analyzes component properties to categorize them by their intended
 * purpose and functionality. It uses pattern matching on property names and types
 * to classify properties into semantic categories that drive example generation
 * and component analysis.
 * 
 * ## Classification Categories
 * 
 * - **Visible Content**: Properties that affect user-visible text and content
 * - **Accessibility**: Properties related to screen readers and accessibility
 * - **State**: Properties that control component state and behavior
 * - **Configuration**: Properties that configure appearance and behavior
 * - **Events**: Event handler properties (onClick, onSubmit, etc.)
 * - **Slots**: Properties related to content slots and children
 * - **Form**: Properties specific to form components and validation
 * - **Conditional**: Properties that control conditional rendering
 * 
 * ## Pattern Matching
 * 
 * Uses intelligent pattern matching to classify properties:
 * - Name-based patterns (e.g., "text", "label", "aria-*")
 * - Type-based patterns (e.g., boolean for state, function for events)
 * - Context-aware classification (e.g., distinguishing config vs state booleans)
 * 
 * ## Usage in Pipeline
 * 
 * Property classification drives:
 * - Semantic analysis of component purpose
 * - Example generation strategies
 * - Content strategy determination
 * - Required vs optional property prioritization
 * 
 * @see SemanticAnalyzer For using classification results
 * @see ExampleGenerator For applying classifications to examples
 */
export class PropertyClassifier {
	isVisibleContentProp(propName: string, propType: string): boolean {
		const visibleContentPatterns = [
			"text", "label", "headline", "title", "message", "content",
			"description", "placeholder", "value", "children", "header",
			"footer", "caption", "summary", "detail"
		];
		
		const name = propName.toLowerCase();
		return visibleContentPatterns.some(pattern => name.includes(pattern)) &&
			   !this.isAccessibilityProp(propName, propType);
	}

	isAccessibilityProp(propName: string, propType: string): boolean {
		const accessibilityPatterns = [
			"aria-", "role", "tabindex", "alt", "title",
			"describedby", "labelledby", "live", "atomic",
			"relevant", "busy", "disabled", "readonly"
		];
		
		const name = propName.toLowerCase();
		return accessibilityPatterns.some(pattern => name.includes(pattern));
	}

	isStateProp(propName: string, propType: string): boolean {
		const statePatterns = [
			"disabled", "loading", "error", "success", "warning",
			"active", "selected", "checked", "expanded", "collapsed",
			"visible", "hidden", "open", "closed", "focused"
		];
		
		const name = propName.toLowerCase();
		const type = propType.toLowerCase();
		
		return statePatterns.some(pattern => name.includes(pattern)) ||
			   (type.includes("boolean") && !this.isConfigProp(propName, propType));
	}

	isConfigProp(propName: string, propType: string): boolean {
		const configPatterns = [
			"size", "variant", "theme", "color", "type", "format",
			"layout", "position", "align", "direction", "orientation"
		];
		
		const name = propName.toLowerCase();
		return configPatterns.some(pattern => name.includes(pattern));
	}

	isEventProp(propName: string): boolean {
		return propName.toLowerCase().startsWith("on");
	}

	isSlotProp(propName: string): boolean {
		return propName.toLowerCase().includes("slot");
	}

	isFormRelatedProp(propName: string): boolean {
		const formPatterns = [
			"name", "value", "required", "validation", "error",
			"invalid", "valid", "pattern", "min", "max", "step",
			"multiple", "accept", "autocomplete"
		];
		
		const name = propName.toLowerCase();
		return formPatterns.some(pattern => name.includes(pattern));
	}

	isConditionalProp(propName: string): boolean {
		const conditionalPatterns = [
			"show", "hide", "if", "when", "unless", "conditional"
		];
		
		const name = propName.toLowerCase();
		return conditionalPatterns.some(pattern => name.includes(pattern));
	}
}
