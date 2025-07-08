import { describe, it, expect } from "vitest";
import { MetadataExtractor } from "../../../../src/services/parsing/core/MetadataExtractor";
import { MaturityLevel } from "../../../../src/types";

describe("MetadataExtractor", () => {
	const extractor = new MetadataExtractor();

	describe("extractComponentBlocks", () => {
		it("should extract interface with JSDoc metadata", () => {
			const content = `
				/**
				 * @componentName Button
				 * @maturityCategory use
				 * @maturityLevel best_practice
				 */
				interface VaButton {
					text: string;
				}
			`;
			
			const blocks = extractor.extractComponentBlocks(content);
			expect(blocks).toHaveLength(1);
			expect(blocks[0].componentName).toBe("Button");
			expect(blocks[0].maturityCategory).toBe("use");
			expect(blocks[0].maturityLevel).toBe(MaturityLevel.BEST_PRACTICE);
		});

		it("should extract multiple component blocks", () => {
			const content = `
				/**
				 * @componentName Button
				 * @maturityCategory use
				 * @maturityLevel best_practice
				 */
				interface VaButton {
					text: string;
				}

				/**
				 * @componentName Alert
				 * @maturityCategory use
				 * @maturityLevel deployed
				 */
				interface VaAlert {
					status: string;
				}
			`;
			
			const blocks = extractor.extractComponentBlocks(content);
			expect(blocks).toHaveLength(2);
			expect(blocks[0].componentName).toBe("Button");
			expect(blocks[1].componentName).toBe("Alert");
		});

		it("should skip interfaces without proper JSDoc", () => {
			const content = `
				interface VaButton {
					text: string;
				}
			`;
			
			const blocks = extractor.extractComponentBlocks(content);
			expect(blocks).toHaveLength(0);
		});
	});

	describe("extractJSDocMetadata", () => {
		it("should extract component metadata from JSDoc comment", () => {
			const comment = `
				* @componentName Button
				* @maturityCategory use
				* @maturityLevel best_practice
				* @guidanceHref https://example.com
			`;
			
			const metadata = extractor.extractJSDocMetadata(comment);
			expect(metadata.componentName).toBe("Button");
			expect(metadata.maturityCategory).toBe("use");
			expect(metadata.maturityLevel).toBe(MaturityLevel.BEST_PRACTICE);
			expect(metadata.guidanceHref).toBe("https://example.com");
		});
	});
});
