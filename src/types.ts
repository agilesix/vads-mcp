import type { z } from "zod";

export interface ToolDefinition {
	name: string;
	schema: z.ZodObject<any>;
	handler: (
		params: any,
		env: Env,
		services?: {
			github: any;
			componentParser: any;
		},
	) => Promise<{
		content: Array<{
			type: "text";
			text: string;
			[key: string]: unknown;
		}>;
	}>;
}

export interface GitHubConfig {
	token?: string;
	baseUrl?: string;
	userAgent?: string;
}

export interface CacheConfig {
	ttl?: number;
	storage?: "memory" | "kv";
}

export interface ComponentProperty {
	name: string;
	type: string;
	optional: boolean;
	description?: string;
}


export interface ComponentExample {
	title: string;
	description: string;
	code: string;
	framework?: string;
	purpose?: ExampleType;
}

export enum ComponentStatus {
	RECOMMENDED = "RECOMMENDED",
	STABLE = "STABLE",
	EXPERIMENTAL = "EXPERIMENTAL",
	AVAILABLE_WITH_ISSUES = "AVAILABLE_WITH_ISSUES",
	USE_WITH_CAUTION = "USE_WITH_CAUTION",
	DEPRECATED = "DEPRECATED",
	UNKNOWN = "UNKNOWN"
}

export enum MaturityLevel {
	BEST_PRACTICE = "best_practice",
	DEPLOYED = "deployed",
	CANDIDATE = "candidate",
	AVAILABLE = "available",
	DEPRECATED = "deprecated",
	UNKNOWN = "unknown"
}

export enum MaturityCategory {
	USE = "use",
	CAUTION = "caution"
}

export enum ExampleType {
	BASIC = "basic",
	STATE = "state",
	ACCESSIBILITY = "accessibility",
	FORM = "form"
}

export enum ComponentPurpose {
	ACTION = "action",
	NOTIFICATION = "notification",
	INPUT = "input",
	NAVIGATION = "navigation",
	CONTAINER = "container",
	DISPLAY = "display"
}

export enum ContentStrategy {
	VISIBLE_FIRST = "visible-first",
	FORM_LABEL = "form-label",
	STRUCTURE_FIRST = "structure-first",
	UNKNOWN = "unknown"
}

export interface ComponentData {
	name: string;
	tagName: string;
	status: ComponentStatus;
	maturityLevel: MaturityLevel;
	recommendation?: string;
	properties?: ComponentProperty[];
}

export interface ComponentSemanticAnalysis {
	visibleTextProps: ComponentProperty[];
	accessibilityProps: ComponentProperty[];
	stateProps: ComponentProperty[];
	configProps: ComponentProperty[];
	eventProps: ComponentProperty[];
	requiredProps: ComponentProperty[];
	slotProps: ComponentProperty[];
	isFormRelated: boolean;
	isInteractive: boolean;
	hasStates: boolean;
	hasConditionalContent: boolean;
	hasAccessibilityEnhancements: boolean;
	hasSlots: boolean;
	inferredPurpose: ComponentPurpose;
	contentStrategy: ContentStrategy;
}
