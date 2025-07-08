import type { ComponentSemanticAnalysis } from "../../../types";

export interface CompositeInfo {
	type: string;
	childElement: string;
	childCount: number;
	childProps: Array<{ name: string; required: boolean }>;
}

export class CompositeDetector {
	detectCompositeComponent(tagName: string, _analysis: ComponentSemanticAnalysis): CompositeInfo | null {
		if (tagName.includes("radio") || tagName.includes("checkbox")) {
			return {
				type: "form-choice-group",
				childElement: tagName.includes("radio") ? "va-radio-option" : "va-checkbox-option",
				childCount: 3,
				childProps: [
					{ name: "label", required: true },
					{ name: "name", required: true },
					{ name: "value", required: true },
				],
			};
		}

		if (tagName.includes("accordion")) {
			return {
				type: "collapsible-container",
				childElement: "va-accordion-item",
				childCount: 2,
				childProps: [{ name: "header", required: true }],
			};
		}

		if (tagName.includes("button-group")) {
			return {
				type: "action-group",
				childElement: "va-button",
				childCount: 2,
				childProps: [{ name: "text", required: true }],
			};
		}

		return null;
	}

	generateCompositeChildren(compositeInfo: CompositeInfo): string {
		const children = [];

		for (let i = 1; i <= compositeInfo.childCount; i++) {
			const childProps = this.generateChildProps(compositeInfo, i);
			children.push(
				`\n  <${compositeInfo.childElement}${childProps}></${compositeInfo.childElement}>`,
			);
		}

		return children.join("") + "\n";
	}

	generateSlotContent(analysis: ComponentSemanticAnalysis): string {
		if (analysis.hasSlots) {
			return "\n  <!-- Slot content goes here -->\n";
		}
		return "";
	}

	private generateChildProps(compositeInfo: CompositeInfo, index: number): string {
		let props = "";

		if (!compositeInfo.childProps) return props;

		compositeInfo.childProps.forEach((propDef) => {
			const value = this.generateChildPropValue(propDef, compositeInfo, index);
			props += ` ${propDef.name}="${value}"`;
		});

		return props;
	}

	private generateChildPropValue(propDef: any, compositeInfo: CompositeInfo, index: number): string {
		const propName = propDef.name.toLowerCase();

		switch (compositeInfo.type) {
			case "form-choice-group":
				if (propName === "label") {
					const options = [
						"Sojourner Truth",
						"Frederick Douglass",
						"Booker T. Washington",
						"George Washington Carver",
					];
					return options[index - 1] || `Option ${index}`;
				}
				if (propName === "name") return "group";
				if (propName === "value") return index.toString();
				break;

			case "collapsible-container":
				if (propName === "header") return `Section ${index}`;
				break;

			case "action-group":
				if (propName === "text") {
					return index === 1 ? "Continue" : "Back";
				}
				break;
		}

		return `value-${index}`;
	}
}
