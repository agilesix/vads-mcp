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

export interface ComponentData {
	name: string;
	tagName: string;
	status: string;
	maturityLevel: string;
	recommendation?: string;
	properties?: ComponentProperty[];
}

export interface ComponentExample {
	title: string;
	description: string;
	code: string;
	framework?: string;
	purpose?: string;
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
	inferredPurpose: string;
	contentStrategy: string;
}
