import type { ComponentSemanticAnalysis } from "../../../types";

export class PurposeInference {
	inferPurposeFromProperties(analysis: ComponentSemanticAnalysis): string {
		if (analysis.isFormRelated) {
			if (analysis.visibleTextProps.some(p => p.name.toLowerCase().includes("button"))) {
				return "action";
			}
			return "input";
		}

		if (analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("alert") || 
			p.name.toLowerCase().includes("message") ||
			p.name.toLowerCase().includes("notification")
		)) {
			return "notification";
		}

		if (analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("link") || 
			p.name.toLowerCase().includes("href") ||
			p.name.toLowerCase().includes("nav")
		)) {
			return "navigation";
		}

		if (analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("button") || 
			p.name.toLowerCase().includes("click")
		)) {
			return "action";
		}

		if (analysis.hasSlots || analysis.visibleTextProps.length > 2) {
			return "container";
		}

		return "display";
	}

	determineContentStrategy(analysis: ComponentSemanticAnalysis): string {
		if (analysis.isFormRelated && analysis.visibleTextProps.some(p => 
			p.name.toLowerCase().includes("label")
		)) {
			return "form-label";
		}

		if (analysis.visibleTextProps.length > 0) {
			return "visible-first";
		}

		if (analysis.hasSlots) {
			return "structure-first";
		}

		return "unknown";
	}
}
