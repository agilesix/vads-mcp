import type { ComponentProperty } from "../../../types";

/**
 * ComponentBlock - Represents a parsed component definition block
 * 
 * Contains the extracted metadata and interface information for a single
 * VA Design System component from TypeScript definition files.
 */
export interface ComponentBlock {
	interfaceName: string;
	interfaceBody: string;
	componentName: string;
	maturityCategory: string;
	maturityLevel: string;
	guidanceHref?: string;
	translations: string[];
	tagName: string;
}

/**
 * MetadataExtractor - Extracts component metadata from TypeScript definition files
 * 
 * This service parses TypeScript .d.ts files to extract component metadata from
 * JSDoc comments and interface definitions. It uses regex-based parsing to identify
 * component blocks and extract structured metadata.
 * 
 * ## Supported JSDoc Annotations
 * 
 * - `@componentName` - The display name of the component
 * - `@maturityCategory` - Component maturity category (use, caution)
 * - `@maturityLevel` - Component maturity level (best_practice, deployed, etc.)
 * - `@guidanceHref` - Optional link to component guidance documentation
 * - `@translations` - Supported translation keys
 * 
 * ## Input Format
 * 
 * Expected input format from VA Design System .d.ts files:
 * 
 * ```typescript
 * /**
 *  * @componentName Button
 *  * @maturityCategory use
 *  * @maturityLevel best_practice
 *  * @guidanceHref /components/button
 *  * @translations button.submit
 *  *\/
 * interface VaButton {
 *   text: string;
 *   disabled?: boolean;
 * }
 * ```
 * 
 * ## Output
 * 
 * Returns ComponentBlock objects containing:
 * - Parsed metadata from JSDoc annotations
 * - Interface name and body for property extraction
 * - Generated tag name (va-{componentName})
 * 
 * @see ComponentBlock For the structure of extracted component data
 * @see InterfaceParser For processing the interface body
 */
export class MetadataExtractor {
	extractComponentBlocks(content: string): ComponentBlock[] {
		const blocks: ComponentBlock[] = [];

		const interfaceMatches = [
			...content.matchAll(/interface\s+(Va\w+)\s*\{([\s\S]*?)\n\s*\}/g),
		];

		for (const [fullMatch, interfaceName, interfaceBody] of interfaceMatches) {
			const beforeInterface = content.substring(0, content.indexOf(fullMatch));
			const commentBlocks = [...beforeInterface.matchAll(/\/\*\*([\s\S]*?)\*\//g)];

			const lastComment = commentBlocks[commentBlocks.length - 1];
			if (!lastComment) continue;

			const commentText = lastComment[1];

			const componentNameMatch = commentText.match(/@componentName\s+(.+)/);
			if (!componentNameMatch) continue;

			const maturityCategoryMatch = commentText.match(/@maturityCategory\s+(.+)/);
			const maturityLevelMatch = commentText.match(/@maturityLevel\s+(.+)/);
			const guidanceMatch = commentText.match(/@guidanceHref\s+(.+)/);

			if (!maturityCategoryMatch || !maturityLevelMatch) continue;

			const translationsMatches = [
				...commentText.matchAll(/@translations\s+(.+)/g),
			];

			blocks.push({
				interfaceName,
				interfaceBody,
				componentName: componentNameMatch[1].trim(),
				maturityCategory: maturityCategoryMatch[1].trim(),
				maturityLevel: maturityLevelMatch[1].trim(),
				guidanceHref: guidanceMatch ? guidanceMatch[1].trim() : undefined,
				translations: translationsMatches.map((m) => m[1].trim()),
				tagName: `va-${componentNameMatch[1].toLowerCase()}`,
			});
		}

		return blocks;
	}

	extractJSDocMetadata(comment: string): any {
		const metadata: any = {};
		
		const componentNameMatch = comment.match(/@componentName\s+(.+)/);
		if (componentNameMatch) {
			metadata.componentName = componentNameMatch[1].trim();
		}

		const maturityCategoryMatch = comment.match(/@maturityCategory\s+(.+)/);
		if (maturityCategoryMatch) {
			metadata.maturityCategory = maturityCategoryMatch[1].trim();
		}

		const maturityLevelMatch = comment.match(/@maturityLevel\s+(.+)/);
		if (maturityLevelMatch) {
			metadata.maturityLevel = maturityLevelMatch[1].trim();
		}

		const guidanceMatch = comment.match(/@guidanceHref\s+(.+)/);
		if (guidanceMatch) {
			metadata.guidanceHref = guidanceMatch[1].trim();
		}

		const translationsMatches = [...comment.matchAll(/@translations\s+(.+)/g)];
		metadata.translations = translationsMatches.map((m) => m[1].trim());

		return metadata;
	}
}
