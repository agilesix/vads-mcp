import { searchDesignSystemTool } from "./searchDesignSystem";
import { getComponentPropertiesTool } from "./getComponentProperties";
import { getComponentExamplesTool } from "./getComponentExamples";
import type { ToolDefinition } from "../types";

export const tools: ToolDefinition[] = [
	searchDesignSystemTool,
	getComponentPropertiesTool,
	getComponentExamplesTool,
];
