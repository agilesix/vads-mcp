import type { ComponentData, ComponentExample, ComponentProperty, ComponentStatus, MaturityLevel, MaturityCategory } from "../../types";
import { ComponentStatus as Status, MaturityLevel as Level, MaturityCategory as Category } from "../../types";
import { MetadataExtractor } from "./core/MetadataExtractor";
import { InterfaceParser } from "./core/InterfaceParser";
import { ComponentMatcher } from "./core/ComponentMatcher";
import { SemanticAnalyzer } from "./analysis/SemanticAnalyzer";
import { ExampleGenerator } from "./generation/ExampleGenerator";

/**
 * ComponentParserFactory - Service orchestrator for component parsing operations
 * 
 * This factory class coordinates multiple specialized services to provide a complete
 * component parsing pipeline. It implements dependency injection to manage service
 * relationships and provides a clean interface for the ComponentParser facade.
 * 
 * ## Service Architecture
 * 
 * The factory manages three categories of services:
 * 
 * ### Core Services
 * - **MetadataExtractor**: Parses JSDoc annotations and component metadata
 * - **InterfaceParser**: Extracts TypeScript interface properties and types
 * - **ComponentMatcher**: Handles component name matching and suggestions
 * 
 * ### Analysis Services  
 * - **SemanticAnalyzer**: Analyzes component semantics and classifies properties
 * 
 * ### Generation Services
 * - **ExampleGenerator**: Creates contextual usage examples based on analysis
 * 
 * ## Parsing Pipeline
 * 
 * 1. **Metadata Extraction**: Extract JSDoc metadata and interface definitions
 * 2. **Interface Parsing**: Parse TypeScript properties with types and descriptions
 * 3. **Status Determination**: Convert maturity metadata to component status
 * 4. **Semantic Analysis**: Classify properties and infer component purpose
 * 5. **Example Generation**: Create contextual usage examples
 * 
 * @see ComponentParser For the main facade interface
 * @see MetadataExtractor For JSDoc parsing details
 * @see SemanticAnalyzer For property classification logic
 */
export class ComponentParserFactory {
	private metadataExtractor: MetadataExtractor;
	private interfaceParser: InterfaceParser;
	private componentMatcher: ComponentMatcher;
	private semanticAnalyzer: SemanticAnalyzer;
	private exampleGenerator: ExampleGenerator;

	constructor() {
		this.metadataExtractor = new MetadataExtractor();
		this.interfaceParser = new InterfaceParser();
		this.componentMatcher = new ComponentMatcher();
		this.semanticAnalyzer = new SemanticAnalyzer();
		this.exampleGenerator = new ExampleGenerator();
	}

	parseComponentMetadata(content: string): Map<string, ComponentData> {
		const components = new Map();

		const componentBlocks = this.metadataExtractor.extractComponentBlocks(content);

		for (const block of componentBlocks) {
			if (!block.componentName || !block.interfaceName) continue;

			const properties = this.interfaceParser.parseInterfaceProperties(block.interfaceBody);

			const component: ComponentData = {
				name: block.componentName,
				tagName: block.tagName || `va-${block.componentName.toLowerCase()}`,
				status: this.determineComponentStatus(block.maturityCategory, block.maturityLevel),
				maturityLevel: (block.maturityLevel as MaturityLevel) || Level.UNKNOWN,
				recommendation: this.getRecommendation(block.maturityCategory, block.maturityLevel),
				properties,
			};

			components.set(component.name, component);
		}

		return components;
	}

	findComponentByName(
		componentName: string,
		components: Map<string, ComponentData>,
	): ComponentData | null {
		return this.componentMatcher.findComponentByName(componentName, components);
	}

	generateExamples(component: ComponentData, options: any = {}): ComponentExample[] {
		const properties = component.properties || [];
		const analysis = this.semanticAnalyzer.analyzeComponentSemantics(component, properties);
		
		return this.exampleGenerator.generateExamples(component, {
			...options,
			analysis,
		});
	}

	getSuggestedComponentNames(
		inputName: string,
		components: Map<string, ComponentData>,
	): string[] {
		return this.componentMatcher.getSuggestedComponentNames(inputName, components);
	}

	extractComponentBlocks(content: string) {
		return this.metadataExtractor.extractComponentBlocks(content);
	}

	parseInterfaceProperties(interfaceBody: string): ComponentProperty[] {
		return this.interfaceParser.parseInterfaceProperties(interfaceBody);
	}

	determineComponentStatus(maturityCategory: string, maturityLevel: string): ComponentStatus {
		if (maturityCategory?.toLowerCase() === Category.CAUTION) {
			return Status.USE_WITH_CAUTION;
		}

		switch (maturityLevel?.toLowerCase()) {
			case Level.BEST_PRACTICE:
				return Status.RECOMMENDED;
			case Level.DEPLOYED:
				return Status.STABLE;
			case Level.CANDIDATE:
				return Status.EXPERIMENTAL;
			case Level.AVAILABLE:
				return Status.AVAILABLE_WITH_ISSUES;
			case Level.DEPRECATED:
				return Status.DEPRECATED;
			default:
				return Status.UNKNOWN;
		}
	}

	getRecommendation(maturityCategory: string, maturityLevel: string): string {
		if (maturityCategory?.toLowerCase() === Category.CAUTION) {
			return "Use with caution - this component may have known issues or limitations";
		}

		switch (maturityLevel?.toLowerCase()) {
			case Level.BEST_PRACTICE:
				return "Recommended for production use - follows VA design system best practices";
			case Level.DEPLOYED:
				return "Stable and safe to use in production applications";
			case Level.CANDIDATE:
				return "Experimental - suitable for testing but may change before release";
			case Level.AVAILABLE:
				return "Available but may have issues - review carefully before use";
			case Level.DEPRECATED:
				return "Deprecated - do not use, component will be removed in future versions";
			default:
				return "Status unknown - verify maturity level before use";
		}
	}

	analyzeComponentSemantics(component: ComponentData, properties: ComponentProperty[]) {
		return this.semanticAnalyzer.analyzeComponentSemantics(component, properties);
	}
}
