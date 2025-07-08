import type {
	ComponentData,
	ComponentProperty,
	ComponentExample,
	ComponentSemanticAnalysis,
} from "../types";
import { ComponentParserFactory } from "./parsing/ComponentParserFactory";

export class ComponentParser {
	private factory: ComponentParserFactory;
	private componentsCache: Map<string, ComponentData> = new Map();
	private cacheTimestamp = 0;
	private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

	constructor() {
		this.factory = new ComponentParserFactory();
	}

	parseComponentMetadata(content: string): Map<string, ComponentData> {
		return this.factory.parseComponentMetadata(content);
	}

	extractComponentBlocks(content: string) {
		return this.factory.extractComponentBlocks(content);
	}

	parseInterfaceProperties(interfaceBody: string): ComponentProperty[] {
		return this.factory.parseInterfaceProperties(interfaceBody);
	}

	determineComponentStatus(maturityCategory: string, maturityLevel: string): string {
		return this.factory.determineComponentStatus(maturityCategory, maturityLevel);
	}

	getRecommendation(maturityCategory: string, maturityLevel: string): string {
		return this.factory.getRecommendation(maturityCategory, maturityLevel);
	}

	/**
	 * Enhanced component matching with support for multiple naming conventions
	 * @param componentName - The name to search for (supports kebab-case, space-separated, etc.)
	 * @param components - Map of components to search in
	 * @returns The matched component or null if not found
	 */
	findComponentByName(
		componentName: string,
		components: Map<string, ComponentData>,
	): ComponentData | null {
		return this.factory.findComponentByName(componentName, components);
	}

	getSuggestedComponentNames(
		inputName: string,
		components: Map<string, ComponentData>,
	): string[] {
		return this.factory.getSuggestedComponentNames(inputName, components);
	}

	analyzeComponentSemantics(
		component: ComponentData,
		properties: ComponentProperty[],
	): ComponentSemanticAnalysis {
		return this.factory.analyzeComponentSemantics(component, properties);
	}

	generateExamples(component: ComponentData, options: any = {}): ComponentExample[] {
		return this.factory.generateExamples(component, options);
	}
}
