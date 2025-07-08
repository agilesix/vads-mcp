import type { ComponentData, ComponentExample, ComponentSemanticAnalysis, ExampleType } from "../../../types";
import { ExampleType as Type, ContentStrategy, ComponentPurpose as Purpose } from "../../../types";
import { ValueGenerator } from "./ValueGenerator";
import { CompositeDetector } from "./CompositeDetector";
import { PropertyClassifier } from "../analysis/PropertyClassifier";

/**
 * ExampleGenerator - Generates contextual usage examples for VA Design System components
 * 
 * This service creates comprehensive usage examples for components based on their
 * semantic analysis. It generates multiple example types tailored to different
 * use cases and contexts, ensuring developers can see practical implementations.
 * 
 * ## Example Types Generated
 * 
 * - **BASIC**: Essential usage with required properties and key visible content
 * - **STATE**: Variations showing different component states (disabled, loading, etc.)
 * - **ACCESSIBILITY**: Enhanced examples with accessibility features
 * - **FORM**: Examples showing component usage within form contexts
 * 
 * ## Generation Strategy
 * 
 * The generator uses semantic analysis to create contextually appropriate examples:
 * 
 * 1. **Property Prioritization**: Uses semantic analysis to prioritize which properties to include
 * 2. **Value Generation**: Generates realistic, contextual values using ValueGenerator
 * 3. **Content Strategy**: Applies content strategy (visible-first, form-label, etc.) to focus examples
 * 4. **Composite Detection**: Handles complex components with child elements
 * 5. **Context Awareness**: Adapts examples based on component purpose (action, input, etc.)
 * 
 * ## Content Strategies
 * 
 * - **visible-first**: Prioritizes user-visible text properties in examples
 * - **form-label**: Focuses on form labels and validation for form components
 * - **structure-first**: Emphasizes structural and layout properties
 * 
 * ## Integration
 * 
 * Works with other services:
 * - **ValueGenerator**: Creates contextual property values
 * - **CompositeDetector**: Handles components with child elements
 * - **PropertyClassifier**: Uses property classifications for example focus
 * - **SemanticAnalyzer**: Applies semantic analysis to guide generation
 * 
 * @see ValueGenerator For contextual value generation
 * @see CompositeDetector For handling composite components
 * @see SemanticAnalyzer For the semantic analysis that drives generation
 * @see ExampleType For the types of examples generated
 */
export class ExampleGenerator {
	private valueGenerator: ValueGenerator;
	private compositeDetector: CompositeDetector;
	private propertyClassifier: PropertyClassifier;

	constructor() {
		this.valueGenerator = new ValueGenerator();
		this.compositeDetector = new CompositeDetector();
		this.propertyClassifier = new PropertyClassifier();
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

		if (analysis.contentStrategy === ContentStrategy.VISIBLE_FIRST) {
			analysis.visibleTextProps.slice(0, 2).forEach((prop) => {
				if (!analysis.requiredProps.includes(prop)) {
					const value = this.valueGenerator.generateContextualValue(prop, analysis);
					if (value) {
						attributes.push(`${prop.name}="${value}"`);
					}
				}
			});
		} else if (analysis.contentStrategy === ContentStrategy.FORM_LABEL) {
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
			purpose: Type.BASIC,
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
			purpose: Type.STATE,
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
			purpose: Type.ACCESSIBILITY,
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
			purpose: Type.FORM,
		};
	}

	private isFormRelatedProp(propName: string): boolean {
		return this.propertyClassifier.isFormRelatedProp(propName);
	}

	private getAnalysisFromOptions(options: any, component: ComponentData, properties: any[]): ComponentSemanticAnalysis {
		if (options.analysis) {
			return options.analysis;
		}

		return {
			visibleTextProps: properties.filter(p => this.propertyClassifier.isVisibleContentProp(p.name, p.type)),
			accessibilityProps: properties.filter(p => this.propertyClassifier.isAccessibilityProp(p.name, p.type)),
			stateProps: properties.filter(p => this.propertyClassifier.isStateProp(p.name, p.type)),
			configProps: properties.filter(p => this.propertyClassifier.isConfigProp(p.name, p.type)),
			eventProps: properties.filter(p => this.propertyClassifier.isEventProp(p.name)),
			requiredProps: properties.filter(p => !p.optional),
			slotProps: properties.filter(p => this.propertyClassifier.isSlotProp(p.name)),
			isFormRelated: properties.some(p => this.propertyClassifier.isFormRelatedProp(p.name)),
			isInteractive: properties.some(p => this.propertyClassifier.isEventProp(p.name)),
			hasStates: properties.some(p => this.propertyClassifier.isStateProp(p.name, p.type)),
			hasConditionalContent: properties.some(p => this.propertyClassifier.isConditionalProp(p.name)),
			hasAccessibilityEnhancements: properties.some(p => this.propertyClassifier.isAccessibilityProp(p.name, p.type)),
			hasSlots: properties.some(p => this.propertyClassifier.isSlotProp(p.name)),
			inferredPurpose: Purpose.DISPLAY,
			contentStrategy: ContentStrategy.UNKNOWN,
		};
	}

}
