import type {
	ComponentData,
	ComponentProperty,
	ComponentExample,
	ComponentSemanticAnalysis,
} from "../types";

export class ComponentParser {
	private componentsCache: Map<string, ComponentData> = new Map();
	private cacheTimestamp = 0;
	private cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

	parseComponentMetadata(content: string): Map<string, ComponentData> {
		const components = new Map();

		// Extract component blocks with their interfaces using the proper VA parsing logic
		const componentBlocks = this.extractComponentBlocks(content);

		for (const block of componentBlocks) {
			if (!block.componentName || !block.interfaceName) continue;

			// Extract interface properties
			const properties = this.parseInterfaceProperties(block.interfaceBody);

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

	extractComponentBlocks(content: string) {
		const blocks = [];

		// Use the proper VA Design System parsing logic
		const interfaceMatches = [
			...content.matchAll(/interface\s+(Va\w+)\s*\{([\s\S]*?)\n\s*\}/g),
		];

		for (const [fullMatch, interfaceName, interfaceBody] of interfaceMatches) {
			// Find the nearest preceding comment block for this interface
			const beforeInterface = content.substring(0, content.indexOf(fullMatch));
			const commentBlocks = [...beforeInterface.matchAll(/\/\*\*([\s\S]*?)\*\//g)];

			// Take the last comment block before this interface
			const lastComment = commentBlocks[commentBlocks.length - 1];

			if (!lastComment) continue;

			const commentContent = lastComment[1];

			// Extract metadata from comment using the correct JSDoc tags
			const componentNameMatch = commentContent.match(/\*\s+@componentName\s+([^\n\r]+)/);
			const maturityCategoryMatch = commentContent.match(
				/\*\s+@maturityCategory\s+([^\n\r]+)/,
			);
			const maturityLevelMatch = commentContent.match(/\*\s+@maturityLevel\s+([^\n\r]+)/);

			// Only process if we have required metadata
			if (!componentNameMatch || !maturityCategoryMatch || !maturityLevelMatch) {
				continue;
			}

			const guidanceMatch = commentContent.match(/\*\s+@guidanceHref\s+([^\n\r]+)/);
			const translationsMatches = [
				...commentContent.matchAll(/\*\s+@translations\s+([^\n\r]+)/g),
			];

			blocks.push({
				interfaceName,
				interfaceBody,
				componentName: componentNameMatch[1].trim(),
				maturityCategory: maturityCategoryMatch[1].trim(),
				maturityLevel: maturityLevelMatch[1].trim(),
				guidanceHref: guidanceMatch ? guidanceMatch[1].trim() : null,
				translations: translationsMatches.map((m) => m[1].trim()),
				tagName: `va-${componentNameMatch[1].toLowerCase()}`,
			});
		}

		return blocks;
	}

	parseInterfaceProperties(interfaceBody: string): ComponentProperty[] {
		const properties: ComponentProperty[] = [];

		// Split by property definitions (lines that end with ; or lines before comments)
		const propertyLines = interfaceBody.split("\n");
		let currentComment = "";

		for (const line of propertyLines) {
			const trimmedLine = line.trim();

			// Skip empty lines and interface declaration
			if (
				!trimmedLine ||
				trimmedLine.includes("interface") ||
				trimmedLine === "{" ||
				trimmedLine === "}"
			) {
				continue;
			}

			// Handle JSDoc comments (both single-line and multi-line)
			if (trimmedLine.startsWith("/**") || trimmedLine.startsWith("*")) {
				const commentMatch = trimmedLine.match(/\*\s*(.*)/);
				if (commentMatch) {
					currentComment += (currentComment ? " " : "") + commentMatch[1];
				}
				continue;
			}

			// More robust property parsing to handle quoted names
			const propertyMatch = trimmedLine.match(/^"?([^"?:]+)"?\??\s*:\s*([^;]+);?\s*$/);
			if (propertyMatch) {
				const [, propName, propType] = propertyMatch;
				const isOptional = trimmedLine.includes("?:") || trimmedLine.includes('"?');

				const property: ComponentProperty = {
					name: propName.trim(),
					type: propType.trim(),
					optional: isOptional,
					description: currentComment.trim() || undefined,
				};

				properties.push(property);
				currentComment = "";
			}
		}

		return properties;
	}

	determineComponentStatus(maturityCategory: string, maturityLevel: string): string {
		// Category takes precedence over level
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
		// Category-based recommendations
		if (maturityCategory?.toLowerCase() === "caution") {
			return "Use with caution - this component may have known issues or limitations";
		}

		// Level-based recommendations
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
		// Try exact match first
		const exactMatch = components.get(componentName);
		if (exactMatch) return exactMatch;

		// Normalize the input name and try various matching strategies
		const normalizedName = this.normalizeComponentName(componentName);

		// Try to find by various name formats
		for (const [_, component] of components) {
			if (this.isNameMatch(componentName, component)) {
				return component;
			}
		}

		return null;
	}

	/**
	 * Normalize component name to handle different naming conventions
	 * @param name - The component name to normalize
	 * @returns Normalized component name
	 */
	private normalizeComponentName(name: string): string {
		// Convert kebab-case to space-separated
		// "file-input-multiple" -> "file input multiple"
		// "alert-expandable" -> "alert expandable"
		return name
			.replace(/-/g, " ")
			.toLowerCase()
			.replace(/\b\w/g, (l) => l.toUpperCase()); // Title case
	}

	/**
	 * Check if a given name matches a component using multiple strategies
	 * @param inputName - The name provided by the user
	 * @param component - The component to check against
	 * @returns true if there's a match
	 */
	private isNameMatch(inputName: string, component: ComponentData): boolean {
		const input = inputName.toLowerCase();
		const componentName = component.name.toLowerCase();
		const tagName = component.tagName.toLowerCase();

		// Strategy 1: Exact match (case-insensitive)
		if (input === componentName) return true;

		// Strategy 2: Tag name match (with or without va- prefix)
		if (input === tagName || input === tagName.replace("va-", "")) return true;

		// Strategy 3: Kebab-case to space conversion
		// "file-input-multiple" should match "File input multiple"
		const normalizedInput = this.normalizeComponentName(inputName);
		if (normalizedInput.toLowerCase() === componentName) return true;

		// Strategy 4: Space-separated to kebab-case conversion
		// "file input multiple" should match "va-file-input-multiple"
		const kebabFromSpaces = componentName.replace(/\s+/g, "-");
		if (input === kebabFromSpaces) return true;

		// Strategy 5: Handle special cases with hyphens in original names
		// "Alert - expandable" should match "alert-expandable"
		const cleanedComponentName = componentName.replace(/\s*-\s*/g, "-");
		if (input === cleanedComponentName) return true;

		// Strategy 6: Remove all separators and compare
		const inputClean = input.replace(/[-\s]/g, "");
		const componentClean = componentName.replace(/[-\s]/g, "");
		if (inputClean === componentClean) return true;

		return false;
	}

	/**
	 * Get suggestions for similar component names
	 * @param inputName - The name that wasn't found
	 * @param components - Map of all components
	 * @returns Array of suggested component names
	 */
	getSuggestedComponentNames(
		inputName: string,
		components: Map<string, ComponentData>,
	): string[] {
		const input = inputName.toLowerCase();
		const suggestions: Array<{ name: string; score: number }> = [];

		for (const [_, component] of components) {
			const componentName = component.name.toLowerCase();

			// Simple similarity scoring
			let score = 0;

			// Exact substring match
			if (componentName.includes(input) || input.includes(componentName)) {
				score += 10;
			}

			// Word overlap
			const inputWords = input.split(/[-\s]/);
			const componentWords = componentName.split(/[-\s]/);
			const commonWords = inputWords.filter((word) =>
				componentWords.some((cWord) => cWord.includes(word) || word.includes(cWord)),
			);
			score += commonWords.length * 5;

			// Length similarity
			const lengthDiff = Math.abs(input.length - componentName.length);
			score += Math.max(0, 5 - lengthDiff);

			if (score > 0) {
				suggestions.push({ name: component.name, score });
			}
		}

		// Sort by score and return top suggestions
		return suggestions
			.sort((a, b) => b.score - a.score)
			.slice(0, 5)
			.map((s) => s.name);
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
			inferredPurpose: "general",
			contentStrategy: "unknown",
		};

		properties.forEach((prop) => {
			const propName = prop.name.toLowerCase();
			const propType = prop.type.toLowerCase();

			// Required props
			if (!prop.optional) {
				analysis.requiredProps.push(prop);
			}

			// Categorize by semantic purpose using the advanced patterns
			if (this.isVisibleContentProp(propName, propType)) {
				analysis.visibleTextProps.push(prop);
			} else if (this.isAccessibilityProp(propName, propType)) {
				analysis.accessibilityProps.push(prop);
				analysis.hasAccessibilityEnhancements = true;
			} else if (this.isStateProp(propName, propType)) {
				analysis.stateProps.push(prop);
				analysis.hasStates = true;
			} else if (this.isConfigProp(propName, propType)) {
				analysis.configProps.push(prop);
			} else if (this.isEventProp(propName, propType)) {
				analysis.eventProps.push(prop);
				analysis.isInteractive = true;
			} else if (this.isSlotProp(propName, propType)) {
				analysis.slotProps.push(prop);
				analysis.hasSlots = true;
			}

			// Form-related detection
			if (this.isFormRelatedProp(propName)) {
				analysis.isFormRelated = true;
			}

			// Conditional content detection
			if (this.isConditionalProp(propName)) {
				analysis.hasConditionalContent = true;
			}
		});

		// Infer purpose from properties
		analysis.inferredPurpose = this.inferPurposeFromProperties(analysis);

		// Determine content strategy
		analysis.contentStrategy = this.determineContentStrategy(analysis);

		return analysis;
	}

	private isVisibleContentProp(propName: string, propType: string): boolean {
		const visibleContentPatterns = [
			/text/,
			/title/,
			/headline/,
			/message/,
			/content/,
			/label/,
			/value/,
			/placeholder/,
			/description/,
		];

		return (
			visibleContentPatterns.some((pattern) => pattern.test(propName)) &&
			propType.includes("string")
		);
	}

	private isAccessibilityProp(propName: string, propType: string): boolean {
		const accessibilityPatterns = [
			/aria/,
			/role/,
			/screenreader/,
			/arialabel/,
			/ariadescribed/,
			/tabindex/,
			/describedby/,
			/labelledby/,
		];

		return accessibilityPatterns.some((pattern) => pattern.test(propName));
	}

	private isStateProp(propName: string, propType: string): boolean {
		const statePatterns = [
			/disabled/,
			/loading/,
			/active/,
			/selected/,
			/checked/,
			/visible/,
			/open/,
			/closed/,
			/expanded/,
			/collapsed/,
			/show/,
			/hide/,
		];

		return (
			statePatterns.some((pattern) => pattern.test(propName)) && propType.includes("boolean")
		);
	}

	private isConfigProp(propName: string, propType: string): boolean {
		const configPatterns = [
			/variant/,
			/size/,
			/type/,
			/status/,
			/level/,
			/theme/,
			/style/,
			/mode/,
		];

		return (
			configPatterns.some((pattern) => pattern.test(propName)) ||
			propType.includes("|") || // Union types are usually config
			propType.includes("enum")
		);
	}

	private isEventProp(propName: string, propType: string): boolean {
		return (
			propName.startsWith("on") && (propType.includes("=>") || propType.includes("function"))
		);
	}

	private isSlotProp(propName: string, propType: string): boolean {
		const slotPatterns = [/slot/, /content/, /body/, /children/];

		return slotPatterns.some((pattern) => pattern.test(propName));
	}

	private isFormRelatedProp(propName: string): boolean {
		const formPatterns = [
			/name/,
			/value/,
			/required/,
			/error/,
			/validation/,
			/input/,
			/field/,
			/form/,
		];

		return formPatterns.some((pattern) => pattern.test(propName));
	}

	private isConditionalProp(propName: string): boolean {
		const conditionalPatterns = [
			/closeable/,
			/dismissible/,
			/expandable/,
			/collapsible/,
			/toggle/,
		];

		return conditionalPatterns.some((pattern) => pattern.test(propName));
	}

	private inferPurposeFromProperties(analysis: ComponentSemanticAnalysis): string {
		// Interactive elements with click handlers
		if (
			analysis.eventProps.some((p) => p.name.includes("click") || p.name.includes("submit"))
		) {
			return "action";
		}

		// Form elements
		if (
			analysis.isFormRelated ||
			analysis.requiredProps.some(
				(p) =>
					p.name.toLowerCase().includes("name") || p.name.toLowerCase().includes("value"),
			)
		) {
			return "input";
		}

		// Notification elements
		if (
			analysis.visibleTextProps.some(
				(p) =>
					p.name.toLowerCase().includes("message") ||
					p.name.toLowerCase().includes("status"),
			)
		) {
			return "notification";
		}

		// Navigation elements
		if (
			analysis.visibleTextProps.some(
				(p) =>
					p.name.toLowerCase().includes("href") || p.name.toLowerCase().includes("link"),
			)
		) {
			return "navigation";
		}

		// Container elements
		if (analysis.hasSlots || analysis.slotProps.length > 0) {
			return "container";
		}

		return "general";
	}

	private determineContentStrategy(analysis: ComponentSemanticAnalysis): string {
		// Form components prioritize labels
		if (analysis.isFormRelated) {
			return "form-label";
		}

		// Components with many visible text props show content first
		if (analysis.visibleTextProps.length > 2) {
			return "visible-first";
		}

		// Interactive components focus on actions
		if (analysis.isInteractive) {
			return "action-first";
		}

		// Components with slots need content structure
		if (analysis.hasSlots) {
			return "structure-first";
		}

		return "unknown";
	}

	generateExamples(component: ComponentData, options: any = {}): ComponentExample[] {
		const examples: ComponentExample[] = [];
		const tagName = component.tagName;
		const properties = component.properties || [];

		// Analyze the component's semantic structure
		const analysis = this.analyzeComponentSemantics(component, properties);

		// Generate basic example
		examples.push(this.generateSemanticBasicExample(tagName, analysis));

		// Generate variation examples based on available patterns
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

		// Add required props with contextual values
		analysis.requiredProps.forEach((prop) => {
			const value = this.generateContextualValue(prop, analysis);
			if (value) {
				if (prop.type.includes("boolean") && value === "true") {
					attributes.push(prop.name);
				} else {
					attributes.push(`${prop.name}="${value}"`);
				}
			}
		});

		// Add important visible text props based on content strategy
		if (analysis.contentStrategy === "visible-first") {
			analysis.visibleTextProps.slice(0, 2).forEach((prop) => {
				if (!analysis.requiredProps.includes(prop)) {
					const value = this.generateContextualValue(prop, analysis);
					if (value) {
						attributes.push(`${prop.name}="${value}"`);
					}
				}
			});
		} else if (analysis.contentStrategy === "form-label") {
			// Prioritize label for form components
			const labelProp = analysis.visibleTextProps.find((p) =>
				p.name.toLowerCase().includes("label"),
			);
			if (labelProp && !analysis.requiredProps.includes(labelProp)) {
				const value = this.generateContextualValue(labelProp, analysis);
				if (value) {
					attributes.push(`${labelProp.name}="${value}"`);
				}
			}
		}

		const attributeString = attributes.length > 0 ? " " + attributes.join(" ") : "";

		// Check for composite components (radio groups, accordions, etc.)
		const compositeInfo = this.detectCompositeComponent(tagName, analysis);
		const content = compositeInfo
			? this.generateCompositeChildren(compositeInfo)
			: this.generateSlotContent(analysis);

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
				const value = this.generateContextualValue(prop, analysis);
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
				const value = this.generateContextualValue(prop, analysis);
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

	private generateContextualValue(
		prop: ComponentProperty,
		analysis: ComponentSemanticAnalysis,
	): string | null {
		const propName = prop.name.toLowerCase();
		const propType = prop.type.toLowerCase();

		// Handle arrays specially
		if (propType.includes("array") || propType.includes("[]")) {
			if (propName.includes("breadcrumb")) {
				return '[{"href": "/", "label": "Home"}, {"label": "Current Page"}]';
			}
			if (propName.includes("option")) {
				return '[{"label": "Option 1", "value": "1"}, {"label": "Option 2", "value": "2"}]';
			}
			return "[]";
		}

		// Handle union types by extracting first option
		if (propType.includes("|")) {
			const options = propType.split("|").map((s) => s.trim().replace(/['"]/g, ""));
			const meaningfulOptions = options.filter(
				(opt) => opt !== "undefined" && opt.length > 0,
			);
			if (meaningfulOptions.length > 0) {
				return meaningfulOptions[0];
			}
		}

		// Context-aware value generation based on inferred purpose
		switch (analysis.inferredPurpose) {
			case "action":
				if (propName === "text") return "Submit Application";
				if (propName === "label") return "Submit your application";
				if (propName.includes("submit")) return "true";
				if (propName === "type") return "submit";
				break;

			case "notification":
				if (propName.includes("headline")) return "Important Update";
				if (propName === "status") return "info";
				if (propName === "visible") return "true";
				break;

			case "input":
				if (propName === "label") {
					// Form group context for radio/checkbox groups
					if (analysis.isFormRelated && analysis.inferredPurpose === "input") {
						return "Select one historical figure";
					}
					return "Email Address";
				}
				if (propName === "name") return "email";
				if (propName === "required") return "true";
				break;

			case "navigation":
				if (propName === "label") return "Navigation";
				if (propName.includes("href")) return "/example-page";
				break;

			case "container":
				if (propName.includes("headline")) return "Service Information";
				break;
		}

		// Type-based value generation
		if (propType.includes("boolean")) {
			return "true";
		} else if (propType.includes("number")) {
			if (propName.includes("level")) return "2";
			if (propName.includes("timeout")) return "5000";
			return "1";
		} else if (propType.includes("object")) {
			return "{}";
		} else if (propType.includes("string")) {
			if (propName.includes("aria") || propName.includes("label")) {
				return "Descriptive label for screen readers";
			}
			if (propName === "text") return "Click me";
			if (propName === "headline") return "Important Notice";
			if (propName === "status") return "info";
			return "Example value";
		}

		return null;
	}

	private detectCompositeComponent(tagName: string, _analysis: ComponentSemanticAnalysis): any {
		// Radio group detection
		if (tagName.includes("radio") || tagName.includes("checkbox")) {
			return {
				type: "form-choice-group",
				childElement: tagName.includes("radio") ? "va-radio-option" : "va-checkbox-option",
				childCount: 3,
				childProps: [
					{ name: "label", required: true },
					{ name: "name", required: true },
					{ name: "value", required: true },
				],
			};
		}

		// Accordion detection
		if (tagName.includes("accordion")) {
			return {
				type: "collapsible-container",
				childElement: "va-accordion-item",
				childCount: 2,
				childProps: [{ name: "header", required: true }],
			};
		}

		// Button group detection
		if (tagName.includes("button-group")) {
			return {
				type: "action-group",
				childElement: "va-button",
				childCount: 2,
				childProps: [{ name: "text", required: true }],
			};
		}

		return null;
	}

	private generateCompositeChildren(compositeInfo: any): string {
		const children = [];

		for (let i = 1; i <= compositeInfo.childCount; i++) {
			const childProps = this.generateChildProps(compositeInfo, i);
			children.push(
				`\n  <${compositeInfo.childElement}${childProps}></${compositeInfo.childElement}>`,
			);
		}

		return children.join("") + "\n";
	}

	private generateChildProps(compositeInfo: any, index: number): string {
		let props = "";

		if (!compositeInfo.childProps) return props;

		compositeInfo.childProps.forEach((propDef: any) => {
			const value = this.generateChildPropValue(propDef, compositeInfo, index);
			props += ` ${propDef.name}="${value}"`;
		});

		return props;
	}

	private generateChildPropValue(propDef: any, compositeInfo: any, index: number): string {
		const propName = propDef.name.toLowerCase();

		// Generate values based on composite type and prop name
		switch (compositeInfo.type) {
			case "form-choice-group":
				if (propName === "label") {
					const options = [
						"Sojourner Truth",
						"Frederick Douglass",
						"Booker T. Washington",
						"George Washington Carver",
					];
					return options[index - 1] || `Option ${index}`;
				}
				if (propName === "name") return "group";
				if (propName === "value") return index.toString();
				break;

			case "collapsible-container":
				if (propName === "header") return `Section ${index}`;
				break;

			case "action-group":
				if (propName === "text") {
					return index === 1 ? "Continue" : "Back";
				}
				break;
		}

		return `value-${index}`;
	}

	private generateSlotContent(analysis: ComponentSemanticAnalysis): string {
		if (analysis.hasSlots) {
			return "\n  <!-- Slot content goes here -->\n";
		}
		return "";
	}
}
