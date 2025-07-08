import type { ComponentData, ComponentExample, ComponentSemanticAnalysis } from "../../../types";
import { ValueGenerator } from "./ValueGenerator";
import { CompositeDetector } from "./CompositeDetector";

export class ExampleGenerator {
	private valueGenerator: ValueGenerator;
	private compositeDetector: CompositeDetector;

	constructor() {
		this.valueGenerator = new ValueGenerator();
		this.compositeDetector = new CompositeDetector();
	}

	generateExamples(component: ComponentData, options: any = {}): ComponentExample[] {
		const examples: ComponentExample[] = [];
		const tagName = component.tagName;
		const properties = component.properties || [];

		const analysis = this.getAnalysisFromOptions(options, component, properties);

		examples.push(this.generateSemanticBasicExample(tagName, analysis));

		if (analysis.hasStates) {
			examples.push(this.generateStateVariationExample(tagName, analysis));
		}

		if (analysis.hasAccessibilityEnhancements) {
			examples.push(this.generateAccessibilityExample(tagName, analysis));
		}

		if (analysis.isFormRelated) {
			examples.push(this.generateFormContextExample(tagName, analysis));
		}

		return examples.filter(Boolean);
	}

	private generateSemanticBasicExample(
		tagName: string,
		analysis: ComponentSemanticAnalysis,
	): ComponentExample {
		const attributes: string[] = [];

		analysis.requiredProps.forEach((prop) => {
			const value = this.valueGenerator.generateContextualValue(prop, analysis);
			if (value) {
				if (prop.type.includes("boolean") && value === "true") {
					attributes.push(prop.name);
				} else {
					attributes.push(`${prop.name}="${value}"`);
				}
			}
		});

		if (analysis.contentStrategy === "visible-first") {
			analysis.visibleTextProps.slice(0, 2).forEach((prop) => {
				if (!analysis.requiredProps.includes(prop)) {
					const value = this.valueGenerator.generateContextualValue(prop, analysis);
					if (value) {
						attributes.push(`${prop.name}="${value}"`);
					}
				}
			});
		} else if (analysis.contentStrategy === "form-label") {
			const labelProp = analysis.visibleTextProps.find((p) =>
				p.name.toLowerCase().includes("label"),
			);
			if (labelProp && !analysis.requiredProps.includes(labelProp)) {
				const value = this.valueGenerator.generateContextualValue(labelProp, analysis);
				if (value) {
					attributes.push(`${labelProp.name}="${value}"`);
				}
			}
		}

		const attributeString = attributes.length > 0 ? " " + attributes.join(" ") : "";

		const compositeInfo = this.compositeDetector.detectCompositeComponent(tagName, analysis);
		const content = compositeInfo
			? this.compositeDetector.generateCompositeChildren(compositeInfo)
			: this.compositeDetector.generateSlotContent(analysis);

		return {
			title: "Basic Usage",
			description: `Basic implementation of the ${tagName} component with essential properties.`,
			code: `<${tagName}${attributeString}>${content}</${tagName}>`,
			framework: "html",
			purpose: "basic",
		};
	}

	private generateStateVariationExample(
		tagName: string,
		analysis: ComponentSemanticAnalysis,
	): ComponentExample {
		const stateProps = analysis.stateProps.slice(0, 2);
		const examples: string[] = [];

		examples.push(`<!-- Default state -->`);
		examples.push(`<${tagName}></${tagName}>`);
		examples.push("");

		stateProps.forEach((prop) => {
			examples.push(`<!-- ${prop.name} state -->`);
			examples.push(`<${tagName} ${prop.name}></${tagName}>`);
		});

		return {
			title: "State Variations",
			description: `Examples showing different states of the ${tagName} component.`,
			code: examples.join("\n"),
			framework: "html",
			purpose: "state",
		};
	}

	private generateAccessibilityExample(
		tagName: string,
		analysis: ComponentSemanticAnalysis,
	): ComponentExample {
		const a11yProps = analysis.accessibilityProps.slice(0, 2);
		const a11yAttributes = a11yProps
			.map((prop) => {
				const value = this.valueGenerator.generateContextualValue(prop, analysis);
				return `${prop.name}="${value || "Accessible description"}"`;
			})
			.join(" ");

		return {
			title: "Accessibility Enhanced",
			description: `${tagName} component with enhanced accessibility features.`,
			code: `<${tagName} ${a11yAttributes}></${tagName}>`,
			framework: "html",
			purpose: "accessibility",
		};
	}

	private generateFormContextExample(
		tagName: string,
		analysis: ComponentSemanticAnalysis,
	): ComponentExample {
		const formProps = analysis.requiredProps.filter((p) => this.isFormRelatedProp(p.name));
		const formAttributes = formProps
			.map((prop) => {
				const value = this.valueGenerator.generateContextualValue(prop, analysis);
				return `${prop.name}="${value || "form-value"}"`;
			})
			.join(" ");

		return {
			title: "Form Context",
			description: `${tagName} component used within a form context.`,
			code: `<form>\n  <${tagName} ${formAttributes} required></${tagName}>\n</form>`,
			framework: "html",
			purpose: "form",
		};
	}

	private isFormRelatedProp(propName: string): boolean {
		const formPatterns = [
			"name", "value", "required", "validation", "error",
			"invalid", "valid", "pattern", "min", "max", "step",
			"multiple", "accept", "autocomplete"
		];
		
		const name = propName.toLowerCase();
		return formPatterns.some(pattern => name.includes(pattern));
	}

	private getAnalysisFromOptions(options: any, component: ComponentData, properties: any[]): ComponentSemanticAnalysis {
		if (options.analysis) {
			return options.analysis;
		}

		return {
			visibleTextProps: properties.filter(p => this.isVisibleContentProp(p.name, p.type)),
			accessibilityProps: properties.filter(p => this.isAccessibilityProp(p.name, p.type)),
			stateProps: properties.filter(p => this.isStateProp(p.name, p.type)),
			configProps: properties.filter(p => this.isConfigProp(p.name, p.type)),
			eventProps: properties.filter(p => this.isEventProp(p.name)),
			requiredProps: properties.filter(p => !p.optional),
			slotProps: properties.filter(p => this.isSlotProp(p.name)),
			isFormRelated: properties.some(p => this.isFormRelatedProp(p.name)),
			isInteractive: properties.some(p => this.isEventProp(p.name)),
			hasStates: properties.some(p => this.isStateProp(p.name, p.type)),
			hasConditionalContent: properties.some(p => this.isConditionalProp(p.name)),
			hasAccessibilityEnhancements: properties.some(p => this.isAccessibilityProp(p.name, p.type)),
			hasSlots: properties.some(p => this.isSlotProp(p.name)),
			inferredPurpose: "display",
			contentStrategy: "unknown",
		};
	}

	private isVisibleContentProp(propName: string, propType: string): boolean {
		const visibleContentPatterns = [
			"text", "label", "headline", "title", "message", "content",
			"description", "placeholder", "value", "children", "header",
			"footer", "caption", "summary", "detail"
		];
		
		const name = propName.toLowerCase();
		return visibleContentPatterns.some(pattern => name.includes(pattern)) &&
			   !this.isAccessibilityProp(propName, propType);
	}

	private isAccessibilityProp(propName: string, propType: string): boolean {
		const accessibilityPatterns = [
			"aria-", "role", "tabindex", "alt", "title",
			"describedby", "labelledby", "live", "atomic",
			"relevant", "busy", "disabled", "readonly"
		];
		
		const name = propName.toLowerCase();
		return accessibilityPatterns.some(pattern => name.includes(pattern));
	}

	private isStateProp(propName: string, propType: string): boolean {
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

	private isConfigProp(propName: string, propType: string): boolean {
		const configPatterns = [
			"size", "variant", "theme", "color", "type", "format",
			"layout", "position", "align", "direction", "orientation"
		];
		
		const name = propName.toLowerCase();
		return configPatterns.some(pattern => name.includes(pattern));
	}

	private isEventProp(propName: string): boolean {
		return propName.toLowerCase().startsWith("on");
	}

	private isSlotProp(propName: string): boolean {
		return propName.toLowerCase().includes("slot");
	}

	private isConditionalProp(propName: string): boolean {
		const conditionalPatterns = [
			"show", "hide", "if", "when", "unless", "conditional"
		];
		
		const name = propName.toLowerCase();
		return conditionalPatterns.some(pattern => name.includes(pattern));
	}
}
