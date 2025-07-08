import type { ComponentData, ComponentProperty, ComponentSemanticAnalysis } from "../../../types";
import { PropertyClassifier } from "./PropertyClassifier";
import { PurposeInference } from "./PurposeInference";

export class SemanticAnalyzer {
	private propertyClassifier: PropertyClassifier;
	private purposeInference: PurposeInference;

	constructor() {
		this.propertyClassifier = new PropertyClassifier();
		this.purposeInference = new PurposeInference();
	}

	analyzeComponentSemantics(
		component: ComponentData,
		properties: ComponentProperty[],
	): ComponentSemanticAnalysis {
		const analysis: ComponentSemanticAnalysis = {
			visibleTextProps: [],
			accessibilityProps: [],
			stateProps: [],
			configProps: [],
			eventProps: [],
			requiredProps: [],
			slotProps: [],
			isFormRelated: false,
			isInteractive: false,
			hasStates: false,
			hasConditionalContent: false,
			hasAccessibilityEnhancements: false,
			hasSlots: false,
			inferredPurpose: "",
			contentStrategy: "",
		};

		properties.forEach((prop) => {
			const propName = prop.name.toLowerCase();
			const propType = prop.type.toLowerCase();

			if (!prop.optional) {
				analysis.requiredProps.push(prop);
			}

			if (this.propertyClassifier.isVisibleContentProp(propName, propType)) {
				analysis.visibleTextProps.push(prop);
			}

			if (this.propertyClassifier.isAccessibilityProp(propName, propType)) {
				analysis.accessibilityProps.push(prop);
				analysis.hasAccessibilityEnhancements = true;
			}

			if (this.propertyClassifier.isStateProp(propName, propType)) {
				analysis.stateProps.push(prop);
				analysis.hasStates = true;
			}

			if (this.propertyClassifier.isConfigProp(propName, propType)) {
				analysis.configProps.push(prop);
			}

			if (this.propertyClassifier.isEventProp(propName)) {
				analysis.eventProps.push(prop);
				analysis.isInteractive = true;
			}

			if (this.propertyClassifier.isSlotProp(propName)) {
				analysis.slotProps.push(prop);
				analysis.hasSlots = true;
			}

			if (this.propertyClassifier.isFormRelatedProp(propName)) {
				analysis.isFormRelated = true;
			}

			if (this.propertyClassifier.isConditionalProp(propName)) {
				analysis.hasConditionalContent = true;
			}
		});

		analysis.inferredPurpose = this.purposeInference.inferPurposeFromProperties(analysis);
		analysis.contentStrategy = this.purposeInference.determineContentStrategy(analysis);

		return analysis;
	}
}
