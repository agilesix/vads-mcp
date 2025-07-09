import type { ComponentProperty, ComponentSemanticAnalysis, ComponentPurpose, ContentStrategy } from "../../../types";
import { ComponentPurpose as Purpose, ContentStrategy as Strategy } from "../../../types";

/**
 * PurposeInference - Infers component purpose and content strategy from properties
 * 
 * This service analyzes component properties to determine the primary purpose
 * of a component and the optimal content strategy for generating examples.
 * It uses heuristic analysis of property patterns to classify components
 * into semantic categories.
 * 
 * ## Purpose Categories
 * 
 * Infers component purpose across these categories:
 * - **ACTION**: Interactive elements like buttons and links
 * - **INPUT**: Form inputs, selectors, and data entry components
 * - **NOTIFICATION**: Alerts, messages, and status indicators
 * - **NAVIGATION**: Menus, breadcrumbs, and navigation elements
 * - **CONTAINER**: Layout and structural components
 * - **DISPLAY**: Content presentation and data display components
 * 
 * ## Content Strategies
 * 
 * Determines optimal content prioritization:
 * - **visible-first**: Prioritize user-visible text and content
 * - **form-label**: Focus on form labels and validation messaging
 * - **structure-first**: Emphasize structural and layout properties
 * - **unknown**: Default strategy when purpose is unclear
 * 
 * ## Inference Logic
 * 
 * Uses property analysis to infer purpose:
 * - Form-related properties → INPUT purpose
 * - Action properties (onClick, submit) → ACTION purpose
 * - Status/alert properties → NOTIFICATION purpose
 * - Navigation properties (href, links) → NAVIGATION purpose
 * - Layout properties → CONTAINER purpose
 * - Content properties → DISPLAY purpose
 * 
 * ## Integration
 * 
 * Works with SemanticAnalyzer to provide:
 * - Component purpose classification
 * - Content strategy recommendations
 * - Example generation guidance
 * - Property prioritization hints
 * 
 * @see SemanticAnalyzer For the broader semantic analysis context
 * @see ExampleGenerator For applying purpose inference to examples
 * @see ComponentPurpose For the enumerated purpose types
 * @see ContentStrategy For the enumerated strategy types
 */
export class PurposeInference {
	inferPurposeFromProperties(analysis: ComponentSemanticAnalysis): ComponentPurpose {
		if (analysis.isFormRelated) {
			if (analysis.visibleTextProps.some(p => p.name.toLowerCase().includes("button"))) {
				return Purpose.ACTION;
			}
			return Purpose.INPUT;
		}

		if (analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("alert") || 
			p.name.toLowerCase().includes("message") ||
			p.name.toLowerCase().includes("notification")
		)) {
			return Purpose.NOTIFICATION;
		}

		if (analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("link") || 
			p.name.toLowerCase().includes("href") ||
			p.name.toLowerCase().includes("nav")
		)) {
			return Purpose.NAVIGATION;
		}

		if (analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("button") || 
			p.name.toLowerCase().includes("click")
		)) {
			return Purpose.ACTION;
		}

		if (analysis.hasSlots || analysis.visibleTextProps.length > 2) {
			return Purpose.CONTAINER;
		}

		return Purpose.DISPLAY;
	}

	determineContentStrategy(analysis: ComponentSemanticAnalysis): ContentStrategy {
		if (analysis.isFormRelated && analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("label")
		)) {
			return Strategy.FORM_LABEL;
		}

		if (analysis.visibleTextProps.length > 0) {
			return Strategy.VISIBLE_FIRST;
		}

		if (analysis.hasSlots) {
			return Strategy.STRUCTURE_FIRST;
		}

		return Strategy.UNKNOWN;
	}
}
