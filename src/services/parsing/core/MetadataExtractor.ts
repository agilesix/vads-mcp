import type { ComponentProperty } from "../../../types";

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
