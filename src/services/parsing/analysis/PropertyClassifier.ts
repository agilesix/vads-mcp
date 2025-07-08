import type { ComponentProperty } from "../../../types";

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
