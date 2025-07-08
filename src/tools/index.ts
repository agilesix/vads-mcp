import { searchDesignSystemTool } from "./searchDesignSystem";
import { getComponentPropertiesTool } from "./getComponentProperties";
import { getComponentExamplesTool } from "./getComponentExamples";
import { listComponentsTool } from "./listComponents";
import type { ToolDefinition } from "../types";

export const tools: ToolDefinition[] = [
	searchDesignSystemTool,
	getComponentPropertiesTool,
	getComponentExamplesTool,
	listComponentsTool,
];
