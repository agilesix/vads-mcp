import type { ComponentData, ComponentProperty, ComponentSemanticAnalysis } from "../../../types";
import { ComponentPurpose, ContentStrategy } from "../../../types";
import { PropertyClassifier } from "./PropertyClassifier";
import { PurposeInference } from "./PurposeInference";

/**
 * SemanticAnalyzer - Analyzes component semantics and infers usage patterns
 * 
 * This service performs comprehensive semantic analysis of VA Design System components
 * by examining their properties, structure, and metadata to infer their intended
 * purpose and optimal usage patterns. It coordinates property classification and
 * purpose inference to build a complete semantic understanding.
 * 
 * ## Analysis Process
 * 
 * 1. **Property Classification**: Categorizes all component properties by purpose
 * 2. **Purpose Inference**: Determines the primary purpose of the component
 * 3. **Content Strategy**: Decides how to prioritize content in examples
 * 4. **Capability Detection**: Identifies component capabilities and features
 * 5. **Usage Context**: Determines optimal usage contexts and patterns
 * 
 * ## Semantic Categories
 * 
 * The analyzer identifies components across these semantic categories:
 * - **Action Components**: Buttons, links, form submissions
 * - **Input Components**: Form fields, selectors, text inputs
 * - **Notification Components**: Alerts, messages, status indicators
 * - **Navigation Components**: Menus, breadcrumbs, pagination
 * - **Container Components**: Layouts, wrappers, structural elements
 * - **Display Components**: Text, images, data presentation
 * 
 * ## Content Strategies
 * 
 * Determines content prioritization strategies:
 * - **visible-first**: Prioritize user-visible text properties
 * - **form-label**: Focus on form labels and validation
 * - **structure-first**: Emphasize structural and layout properties
 * 
 * ## Output Analysis
 * 
 * Produces ComponentSemanticAnalysis containing:
 * - Categorized property lists by purpose
 * - Inferred component purpose and content strategy
 * - Boolean flags for component capabilities
 * - Guidance for example generation
 * 
 * @see PropertyClassifier For property categorization logic
 * @see PurposeInference For component purpose determination
 * @see ExampleGenerator For applying semantic analysis to examples
 */
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
			inferredPurpose: ComponentPurpose.DISPLAY,
			contentStrategy: ContentStrategy.UNKNOWN,
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
