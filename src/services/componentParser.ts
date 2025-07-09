import type {
	ComponentData,
	ComponentProperty,
	ComponentExample,
	ComponentSemanticAnalysis,
} from "../types";
import { ComponentParserFactory } from "./parsing/ComponentParserFactory";

/**
 * ComponentParser - Main facade for VA Design System component parsing
 * 
 * This class serves as the primary interface for parsing TypeScript definition files
 * from the VA Design System component library. It uses a factory pattern to orchestrate
 * multiple specialized services for metadata extraction, interface parsing, semantic
 * analysis, and example generation.
 * 
 * ## Architecture
 * 
 * The ComponentParser follows the facade pattern, delegating all parsing operations
 * to a ComponentParserFactory which coordinates specialized services:
 * 
 * - **Core Services**: MetadataExtractor, InterfaceParser, ComponentMatcher
 * - **Analysis Services**: SemanticAnalyzer, PropertyClassifier, PurposeInference  
 * - **Generation Services**: ExampleGenerator, ValueGenerator, CompositeDetector
 * 
 * ## Workflow
 * 
 * 1. **Input**: TypeScript .d.ts files containing VA component interfaces with JSDoc metadata
 * 2. **Extraction**: Parse JSDoc annotations (@componentName, @maturityLevel, etc.) and TypeScript interfaces
 * 3. **Analysis**: Classify properties, infer component purpose, determine content strategy
 * 4. **Generation**: Create contextual usage examples based on semantic analysis
 * 
 * ## Usage Examples
 * 
 * ```typescript
 * const parser = new ComponentParser();
 * 
 * // Parse component metadata from .d.ts content
 * const components = parser.parseComponentMetadata(definitionFileContent);
 * 
 * // Find specific component with fuzzy matching
 * const button = parser.findComponentByName("button", components);
 * 
 * // Generate usage examples
 * const examples = parser.generateExamples(button);
 * ```
 * 
 * @see ComponentParserFactory For service orchestration details
 * @see MetadataExtractor For JSDoc parsing implementation
 * @see ExampleGenerator For example generation strategies
 */
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
