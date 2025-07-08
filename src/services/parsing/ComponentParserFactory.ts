import type { ComponentData, ComponentExample, ComponentProperty } from "../../types";
import { MetadataExtractor } from "./core/MetadataExtractor";
import { InterfaceParser } from "./core/InterfaceParser";
import { ComponentMatcher } from "./core/ComponentMatcher";
import { SemanticAnalyzer } from "./analysis/SemanticAnalyzer";
import { ExampleGenerator } from "./generation/ExampleGenerator";

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
				maturityLevel: block.maturityLevel || "unknown",
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

	determineComponentStatus(maturityCategory: string, maturityLevel: string): string {
		if (maturityCategory?.toLowerCase() === "caution") {
			return "USE_WITH_CAUTION";
		}

		switch (maturityLevel?.toLowerCase()) {
			case "best_practice":
				return "RECOMMENDED";
			case "deployed":
				return "STABLE";
			case "candidate":
				return "EXPERIMENTAL";
			case "available":
				return "AVAILABLE_WITH_ISSUES";
			case "deprecated":
				return "DEPRECATED";
			default:
				return "UNKNOWN";
		}
	}

	getRecommendation(maturityCategory: string, maturityLevel: string): string {
		if (maturityCategory?.toLowerCase() === "caution") {
			return "Use with caution - this component may have known issues or limitations";
		}

		switch (maturityLevel?.toLowerCase()) {
			case "best_practice":
				return "Recommended for production use - follows VA design system best practices";
			case "deployed":
				return "Stable and safe to use in production applications";
			case "candidate":
				return "Experimental - suitable for testing but may change before release";
			case "available":
				return "Available but may have issues - review carefully before use";
			case "deprecated":
				return "Deprecated - do not use, component will be removed in future versions";
			default:
				return "Status unknown - verify maturity level before use";
		}
	}

	analyzeComponentSemantics(component: ComponentData, properties: ComponentProperty[]) {
		return this.semanticAnalyzer.analyzeComponentSemantics(component, properties);
	}
}
